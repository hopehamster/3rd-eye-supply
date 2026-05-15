---
name: oracle-worker-discipline
description: Security + operational discipline for the public-facing Oracle chatbot Cloudflare Worker
paths:
  - oracle/**
---

# Oracle Worker Discipline

The Oracle worker is the highest-stakes surface on this site: a public-facing AI endpoint that spends money on Anthropic + MiniMax calls, holds session state in KV, and shapes user perception of the brand. Apply this rule whenever editing anything under [oracle/](../../oracle/).

## Three Non-Negotiables

### 1. Origin Validation Cannot Be Bypassed

The `ALLOWED_ORIGINS` list in [wrangler.toml](../../oracle/worker/wrangler.toml) controls CORS, but CORS is a browser concept — `curl` ignores it. Server-side callers sending no `Origin` header MUST be rejected outright, not silently allowed.

```js
// CORRECT
const origin = request.headers.get('Origin');
if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
  return new Response('Forbidden', { status: 403 });
}

// WRONG — bypassable by curl with no Origin
const origin = request.headers.get('Origin');
if (origin && !ALLOWED_ORIGINS.includes(origin)) {
  return new Response('Forbidden', { status: 403 });
}
```

A missing Origin is not "allowed" — it's "unauthorized request from a non-browser client." Treat them identically.

### 2. User Input Must Be Sanitized Before LLM Injection

The Oracle persona prompt uses XML-like delimiters (`<context>`, `<product>`, `<instructions>`). If a user message contains those literal strings, they can break out of the user-message context and inject fake instructions or fabricate products.

Sanitize EVERY user message before prepending it to the LLM call:

```js
function sanitizeUserInput(text) {
  if (typeof text !== 'string') return '';
  return text
    .slice(0, 2000)                              // Hard length cap
    .replace(/[<>]/g, '')                        // Strip XML-ish chars
    .replace(/\\b(system|assistant|user):/gi, '') // Strip role labels
    .trim();
}
```

The honey-pot canary `CODE PHOENIX` lives in `oracle-dna.md`. If the assistant emits that string, the worker MUST stop the stream, log the attempt, and return a generic error to the user — never echo it back. See [agent-operation-discipline.md](~/.claude/rules/agent-operation-discipline.md) Rule 5.

### 3. Rate Limiting + Cost Cap Per IP

`MAX_CONV_PER_IP_PER_DAY = 8` in wrangler.toml is the floor. The worker MUST:
- Use `CF-Connecting-IP` (Cloudflare-set, can't be spoofed) — NOT `X-Forwarded-For`.
- Key the KV counter by IP + UTC date (`YYYY-MM-DD`).
- Set the KV entry's TTL to 86400 seconds so expired counters auto-clean.
- Return 429 with a `Retry-After` header when over limit.

Anthropic billing is real money. A single un-rate-limited user can run up $50+ in an afternoon with streaming Haiku calls.

## KV Hygiene

Three KV namespaces, three distinct TTL policies:

| Binding | Purpose | TTL | Notes |
|---|---|---|---|
| `PRODUCTS` | Product catalog (CJ-synced) | none (long-lived) | Read-only from Oracle. |
| `ORACLE_SESSIONS` | Conversation memory per session ID | 3600s (1h) | Auto-clean on idle. |
| `ORACLE_CACHE` | RAG context cache (embeddings + retrievals) | 86400s (24h) | Save Anthropic/Workers AI calls. |

Never store PII in `ORACLE_SESSIONS`. Session ID is a random UUID generated client-side and stored in `localStorage`; no email, no name, no payment info ever lands in KV.

## Streaming Discipline

`/oracle/chat` returns Server-Sent Events. Three rules:

1. **Always flush the response headers immediately** — don't buffer waiting for the first model token. Users feel any delay >300ms as broken.
2. **Heartbeat every 15 seconds** with `: keepalive\n\n` to prevent Cloudflare's 100-second idle timeout from killing the stream mid-response.
3. **Catch and emit errors as SSE events**, not HTTP 500s. Once headers are flushed the browser can't recover from a status code change — only the event stream can convey "the model failed, please retry."

## Cost Tracking

Every `/oracle/chat` invocation logs: `{ session_id, ip_hash, tokens_in, tokens_out, model, cost_usd_estimate }` to a `cost-tracking` KV key (or to a separate analytics endpoint). The estimate uses published per-token pricing for `ORACLE_MODEL`. This is the only way to spot a runaway loop before the Anthropic invoice arrives.

## Voice (MiniMax) Boundary

`/oracle/voice/:turnId` is a SEPARATE endpoint from `/oracle/chat`. Reasons:

- Voice synthesis is opt-in — many users will only read the text. Don't pre-pay for audio they'll never play.
- MiniMax has its own rate limits and failure modes; isolating it means a MiniMax outage doesn't break the chat path.
- The `turnId` ties an audio request to a specific completed turn already stored in `ORACLE_SESSIONS` — never let voice synth requests carry their own arbitrary text. Always read from KV.

## Brand DNA = Single Source

`oracle/persona/oracle-dna.md` is the canonical prompt. Don't fork it. Don't paraphrase it inline in the worker. The worker `fetch`es it (or imports it as a build asset) so the persona has one editor.

5-question test set lives at the bottom of `oracle-dna.md`. Re-run after EVERY persona edit; ship only if all 5 produce on-brand answers.

## Deploy Discipline

1. `wrangler whoami` — verify the right Cloudflare account (`6926c6c0934c0d577f211a04f3dbfbd1`).
2. Confirm the zone for `3rdeyesupply.com` is in this account (dashboard → Websites). If not, strip the route declarations from wrangler.toml before deploying.
3. `wrangler kv:namespace list` — confirm `ORACLE_SESSIONS` + `ORACLE_CACHE` exist and IDs in wrangler.toml match.
4. `wrangler secret put ANTHROPIC_API_KEY --name oracle-worker` — paste value via STDIN, NEVER as an inline argument (the project hook blocks that anyway).
5. `wrangler deploy --dry-run` — must pass clean.
6. `wrangler deploy`.
7. Smoke test the 5-question set against the live worker BEFORE updating the site to point at it.

## Cross-references
- [PROJECT_PLAYBOOK.md](../../PROJECT_PLAYBOOK.md) §"Cloudflare Workers + KV"
- [oracle/persona/oracle-dna.md](../../oracle/persona/oracle-dna.md) — canonical persona + test set
- [huet-mcp-security.md](~/.claude/rules/huet-mcp-security.md) — three-layer containment (this worker is Layer 1 + Layer 3; Layer 2 is the Astro client's input sanitizer)
- [agent-operation-discipline.md](~/.claude/rules/agent-operation-discipline.md) — Rule 5 (honey-pot canary), Rule 10 (blast-radius / reversibility)
