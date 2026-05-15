# Oracle Worker — Implementation Notes

> Companion to `oracle-worker.js` + `wrangler.toml` + `deploy.sh` +
> `test-oracle.sh`. Captures the decisions that weren't fully spelled out in
> `architecture.md` so the next person doesn't have to re-derive them.

## Final file inventory

| File              | Lines | Purpose                                         |
|-------------------|-------|-------------------------------------------------|
| `oracle-worker.js`| 845   | Worker source — single default-export `{ fetch }` |
| `wrangler.toml`   | 108   | Worker config — bindings, vars, routes          |
| `deploy.sh`       | 135   | Deploy plan + dry-run; live deploy commented out|
| `test-oracle.sh`  | 225   | Integration smoke tests against local/prod      |

All TODO markers in the original skeleton are resolved (verified by `grep`).

## All TODOs resolved

| Original TODO                                  | Resolution                                                                 |
|------------------------------------------------|----------------------------------------------------------------------------|
| `// TODO: paste from oracle/persona/oracle-dna.md` | Pasted full ~2,400-token system prompt verbatim from §5 of oracle-dna.md as a JS template literal, wrapped in `cache_control: { type: 'ephemeral' }`. |
| MiniMax response shape verification           | Confirmed against current MiniMax docs: `data.audio` is HEX-encoded by default (`output_format: "hex"`); `data.audio_file` URL fallback handled defensively. Endpoint moved from `api.minimaxi.chat` (legacy) → `api.minimax.io` (current). |
| RAG retrieval placeholders                    | Workers AI embedding (`@cf/baai/bge-base-en-v1.5`) + Vectorize query (`ORACLE_VECTORS`) wired with graceful no-op fallback if the index isn't bound yet; PRODUCTS lexical pre-pass scans for category tokens (pyramid, crystal, incense, ring, jewelry, candle, tarot, chakra, reiki, astrology, sage, palo santo, rune, pendulum, orgonite). Tries both `category:<tag>:` and `tag:<tag>:` KV prefixes defensively. |
| MiniMax voice ID choice                       | `English_Graceful_Lady` — see "Voice ID decision" below. |

## Decisions made (not spelled out in architecture.md)

### 1. Voice ID: `English_Graceful_Lady`

The architecture doc said "wise female voice" but didn't pin a specific
fingerprint. Confirmed against the official MiniMax T2A v2 voice list at
`platform.minimax.io/docs/api-reference/speech-t2a-http`. Of the documented
English system voices, the candidates were:

- `English_Graceful_Lady` — mature, warm, intimate. **Picked.** Matches the
  Oracle persona's "wise woman at the threshold of a calm room" spec
  (oracle-dna.md §1.2): low-warm-intimate cadence, no perky energy, no
  clinical edge.
- `English_Insightful_Speaker` — more authoritative, less warm. Closer to a
  professor or analyst than a wise woman. Rejected for tone mismatch.
- `English_radiant_girl` — too bright and youthful. Rejected on persona spec
  ("Never bright-perky").
- `Wise_Woman` — appears in legacy MiniMax samples but NOT in the current
  documented System Voice list. Listed in the JSDoc as a fallback A/B
  candidate; if the legacy ID still resolves on `speech-02-hd`, it may be
  worth comparing.

The voice ID is a `[vars]` entry, not a secret — override at runtime via
`wrangler.toml` or `wrangler vars put ORACLE_VOICE_ID --name oracle-worker`
without a code change.

### 2. MiniMax model: `speech-02-hd`

Architecture didn't specify. MiniMax currently offers `speech-2.8-hd`,
`speech-2.6-hd`, `speech-02-hd` (and `-turbo` variants of each). Picked
`speech-02-hd` because (a) it's the most widely documented in 2026 and (b)
the existing skeleton already referenced it. Override via `MINIMAX_MODEL` env
var if the QA pass prefers `speech-2.8-hd`.

### 3. CORS allowlist

Production canonical domain is `https://3rdeyesupply.com/` (per the task
brief). Per architecture §12 the existing list was `hopehamster.github.io +
localhost`. **Updated** the worker default and `wrangler.toml` `[vars]` to
include in this order:

1. `https://3rdeyesupply.com` (production canonical)
2. `https://www.3rdeyesupply.com`
3. `https://hopehamster.github.io` (transitional GH Pages)
4. `http://localhost:4321` (Astro dev)
5. `http://localhost:3000`
6. `http://localhost:8787` (wrangler dev)

Plus a regex pass that allows ANY `http://localhost:<port>` and
`http://127.0.0.1:<port>` so a developer running on a non-standard port
isn't locked out. Hostile origins receive `Access-Control-Allow-Origin: null`
(i.e., browser CORS rejects).

Origin enforcement also applies to `/oracle/session` and `/oracle/chat`
(returning HTTP 403) — CORS alone is browser-side, so server-side check
prevents script-driven KV burn from hostile origins.

### 4. Routes — only Cloudflare zones can have route entries

Architecture §11 documented `oracle.3rdeyesupply.com` as an "optional"
custom hostname. The task brief asked for a route at
`https://hopehamster.github.io/3rd-eye-supply/api/oracle/*` — but
`hopehamster.github.io` is GitHub Pages, NOT a Cloudflare zone, so it
**cannot** be a `[[routes]]` entry in `wrangler.toml`. The only correct way
the GH Pages site reaches the worker is by calling either:

- `https://oracle-worker.<account>.workers.dev/oracle/*` (workers.dev URL)
- `https://3rdeyesupply.com/api/oracle/*` (custom domain — once DNS+route
  are wired)

The `wrangler.toml` therefore declares only the two valid Cloudflare-zone
routes (`3rdeyesupply.com/api/oracle/*` and `www.`), with a long comment
explaining why GH Pages isn't a route. Frontend calling code on the GH Pages
site must use the workers.dev or canonical domain URL directly.

### 5. RAG graceful degradation

Architecture says the Vectorize index will hold a 42-book corpus, but the
ingest pipeline isn't built yet. The worker therefore has to deploy BEFORE
the index has data. Implementation:

- If `env.AI` or `env.ORACLE_VECTORS` is unbound → skip vector retrieval
  silently, fall back to PRODUCTS lexical pre-pass only.
- If Vectorize query throws (index doesn't exist, dimensions mismatch) →
  log + skip. The user still gets a streamed Haiku reply, just without book
  context.

The first deploy is therefore safe even with `oracle-knowledge` unprovisioned.

### 6. Cost tracking

Per architecture §8, sliding `costCents` counter on the session record with
hard ceiling at 10. Implementation increments by `ROUGH_COST_PER_TURN_CENTS`
(1.5) per turn — close enough to the architecture's $0.013/turn estimate.
Refine when real Anthropic + MiniMax usage data is available (the
`message_delta` event already exposes `output_tokens`; we capture it in
`usageOut` and emit a `meta` SSE event so the client can show a live cost
counter if desired).

### 7. Honey-pot canary

Wired exactly per architecture §10:

- Detection: scan `accumulated` after each `text_delta` for the literal
  string `CODE PHOENIX`.
- Action on trip: write `alert:phoenix:<isoTs>` to `ORACLE_CACHE` with 30-day
  TTL containing `{ sessionId, ip, userMessage, accumulated }`, cancel the
  upstream Anthropic stream, send a soft `event: error` to the client, and
  refuse to persist the conversation turn.

Soft injection signature (`/ignore previous|disregard the above|reveal your
system prompt/i`) also logs to `alert:phoenix:` keyspace as a warning but
does NOT reject the message — sometimes seekers legitimately quote those
phrases when asking about prompt-injection attacks.

### 8. Stack-trace safety

Every `catch` in the public-facing routes returns a generic message
("The veil shimmered. Try again shortly." in Oracle voice for 500s,
specific error codes like `bad_session` / `body_too_large` / `rate_limited`
otherwise). Stack traces only go to `console.error` for `wrangler tail`.

### 9. Conversation memory TTL

`expirationTtl: 86400` (24h sliding) on every `session:<uuid>` write.
Refreshed on every chat turn. Per-session turn cap = `ORACLE_MAX_TURNS`
(default 12); per-session cost cap = `COST_CEILING_CENTS` (10). On either
hit, the worker returns a calm in-character "this consultation has reached
its natural close" response and forces a new session.

## Pre-deploy checklist (must do before `wrangler deploy`)

The `deploy.sh` script prints these on every run, but they're listed here
as the canonical reference:

1. **Create the new KV namespaces:**
   ```bash
   wrangler kv:namespace create ORACLE_SESSIONS
   wrangler kv:namespace create ORACLE_CACHE
   ```
   Paste the returned IDs into `wrangler.toml` (replace the
   `REPLACE_AFTER_wrangler_kv_namespace_create_*` placeholders).

2. **(Optional, can defer) Create the Vectorize index:**
   ```bash
   wrangler vectorize create oracle-knowledge --dimensions=768 --metric=cosine
   ```
   Worker degrades gracefully if this isn't bound — safe to defer until the
   42-book corpus is ready to ingest.

3. **Inject secrets:**
   ```bash
   wrangler secret put ANTHROPIC_API_KEY  --name oracle-worker
   wrangler secret put MINIMAX_API_KEY    --name oracle-worker
   wrangler secret put MINIMAX_GROUP_ID   --name oracle-worker
   ```

4. **Verify Cloudflare zone ownership** for `3rdeyesupply.com` (already in
   the account per `PROJECT_PLAYBOOK.md`).

5. **Run dry-run:**
   ```bash
   bash deploy.sh
   ```

6. **Uncomment the `wrangler deploy` line** in `deploy.sh` (or run
   `wrangler deploy` directly), then **re-comment** so the script stays
   safe by default.

7. **Post-deploy smoke test:**
   ```bash
   ORACLE_BASE=https://3rdeyesupply.com/api bash test-oracle.sh
   ```

8. **(Optional) Configure edge rate-limiting** in the Cloudflare dashboard:
   30 req/min/IP on `/api/oracle/*`. Architecture §9.

## Things explicitly NOT done in this session

- **No `wrangler deploy` actually run** — dry-run only is documented; live
  deploy line is commented out in `deploy.sh`.
- **No git commits or pushes.**
- **No CJ worker files modified.**
- **No secrets pasted into any file.** All keys via `env.SECRET_NAME`.
- **No Turnstile / CF WAF rules configured** — those are dashboard-side
  follow-ups documented in architecture §9.
- **No 42-book RAG corpus ingested** — out of scope; worker handles the
  empty-index case.
- **No frontend integration** — out of scope; architecture §13 spec is
  unchanged.
