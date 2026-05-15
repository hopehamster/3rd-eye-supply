# 3rd Eye Supply — Project Canonical

Metaphysical e-commerce site. Astro + GitHub Pages + Snipcart checkout + Cloudflare Workers automation (CJ dropshipping + Oracle chatbot).

## Identity & Stakes
- **Owner:** 702 AI Services (mikebradley1980@gmail.com / hopehamster on GitHub).
- **Canonical site URL:** `https://hopehamster.github.io/3rd-eye-supply/` (transitional) → `https://3rdeyesupply.com/` (target, pending DNS topology decision).
- **Brand voice:** spiritual/metaphysical, warm but grounded. Never glib, never campy. The Oracle persona spec is the canonical reference — read [oracle/persona/oracle-dna.md](../oracle/persona/oracle-dna.md) before writing ANY user-facing copy in Oracle context.

## Hosting Model
- **Site:** Astro builds `site/` → `site/dist/` → GitHub Actions uploads via `actions/upload-pages-artifact@v3` + `deploy-pages@v4`.
- **Source branch:** `main` triggers build. Currently on `may2026`.
- **DNS:** Hostinger registrar. Nameservers point to Cloudflare (per WHOIS). Cloudflare workers route at `3rdeyesupply.com/api/oracle/*` (requires zone ownership; verify before deploy).
- **Workers account:** Cloudflare account `6926c6c0934c0d577f211a04f3dbfbd1`.

## Deploy Blocker (active)
The Oracle worker `wrangler.toml` declares routes for `3rdeyesupply.com/api/oracle/*` — these only work if the zone is in this Cloudflare account. **Verify before `wrangler deploy`** by running `wrangler whoami` + checking the Cloudflare dashboard's Zones list. If the zone isn't there, either (a) migrate DNS to Cloudflare, or (b) strip routes from wrangler.toml and use workers.dev URL.

## The Four Hard Rules (project-specific)
1. **NEVER use plain `/...` paths.** Always project-absolute `/3rd-eye-supply/...` or Astro-generated. Plain `/images/foo.webp` resolves to `hopehamster.github.io/images/foo.webp` — 404. See [rules/astro-gh-pages-pathing.md](rules/astro-gh-pages-pathing.md).
2. **NEVER commit secrets.** `.env`, `gcp-oauth.keys.json`, and `google-service-account-key.json` are in the repo TODAY — these need to be rotated and `.gitignore`d before any public attention. Wrangler secrets via `wrangler secret put`, never paste into `wrangler.toml`.
3. **NEVER bypass `.nojekyll`.** It must exist at repo root AND inside the artifact. Without it, GitHub Pages strips `_astro/` and the site appears unstyled.
4. **NEVER edit `site/dist/`.** It's a build artifact. Edits get blown away on next build. Edit `site/public/` or `site/src/`.

## Repository Map
- [site/](../site/) — Astro project root. `astro.config.mjs` sets `base: '/3rd-eye-supply'` + `site: 'https://hopehamster.github.io'`.
- [oracle/](../oracle/) — Oracle chatbot subsystem. `worker/` is the Cloudflare Worker; `persona/` is the canonical brand DNA; `catalog/` + `seo/` + `docs/` support it.
- [cj-*-worker.js](../) — Three CJ dropshipping workers (webhook / tracking / inventory-sync) at repo root. Deployed via [deploy-cloudflare-workers.js](../deploy-cloudflare-workers.js).
- [.github/workflows/gh-pages.yml](../.github/workflows/gh-pages.yml) — official Pages build/deploy.

## Two Modes of Work in This Repo

There are TWO kinds of contributor and they touch DIFFERENT files:

- **Site / worker development** (Mike + Claude Code on this machine) — edits `site/`, `oracle/`, `cj-*-worker.js`, deploys via wrangler + GitHub Actions. Follows the focal rules below.
- **TikTok content partner** (separate person, pulls the repo to film TikToks) — works only in `tiktok/`, never edits `site/` or `oracle/`. Their entry point is [tiktok/README.md](../tiktok/README.md). Their agents: `tiktok-content-coach` + `tiktok-claim-auditor`. Their slash commands: `/tiktok-script` + `/tiktok-audit`.

If you (Claude) are invoked by the partner: stay in the `tiktok/` mode. Don't propose changes to website code, worker code, or DNS. Refer site issues to Mike.

## Focal Rule Files (auto-load by path scope)
- [rules/astro-gh-pages-pathing.md](rules/astro-gh-pages-pathing.md) — base path discipline, `.nojekyll`, image srcset rules. Loads in `site/**`.
- [rules/oracle-worker-discipline.md](rules/oracle-worker-discipline.md) — Origin validation, input sanitization, KV TTLs, streaming, cost tracking. Loads in `oracle/**`.
- [rules/cloudflare-workers-deploy.md](rules/cloudflare-workers-deploy.md) — wrangler/KV/routes/secrets discipline. Loads for `**/*worker*.js` + `wrangler.toml`.
- [rules/snipcart-integration.md](rules/snipcart-integration.md) — cart button patterns + webhook security. Loads in `site/**` + `cj-webhook-worker.js`.
- [rules/cj-dropshipping.md](rules/cj-dropshipping.md) — CJ API integration + inventory sync. Loads for `cj-*.js`.
- [rules/content-voice.md](rules/content-voice.md) — metaphysical brand voice guardrails. Loads everywhere (no path filter).

## Established Conventions (already in the codebase)
- **Image variants:** `-cover.webp` baseline + `-{400,800,1200}w.webp` responsive set. If 800w is missing, fall back to cover (see `aeb34f7`, `de1c046`).
- **Product page slug:** `/3rd-eye-supply/products/{slug}/` — slug matches the `data-item-id` in Snipcart buttons.
- **Worker naming:** `oracle-worker`, `cj-webhook`, `cj-tracking`, `cj-inventory-sync`. Each gets its own wrangler config; never share.
- **KV namespace IDs** (from PROJECT_PLAYBOOK + deploy-cloudflare-workers.js):
  - `PRODUCTS`: `068e6599412e40659fd403e54f5fac55`
  - `ORDERS_STATE`: `e2b14ff2ea19401f9f4211540ddf3f6e`
  - `ORACLE_SESSIONS` / `ORACLE_CACHE`: not yet created (see oracle/worker/wrangler.toml deploy steps).

## Known Landmines (don't re-step on)
- **`gcp-oauth.keys.json` is committed.** Client secret in plaintext at repo root. Schedule rotation + `.gitignore` before site goes public.
- **`google-service-account-key.json` likely committed too.** Verify with `git ls-files | grep -i 'key\\|secret\\|credential'` before any commit.
- **CJ API key hard-coded** in [deploy-cloudflare-workers.js:73](../deploy-cloudflare-workers.js#L73). Move to `wrangler secret put CJ_API_KEY` before re-running.
- **Snipcart public key is fine in HTML** (that's its purpose). Snipcart **Secret API Key** is server-side only — never in `site/public/`.
- **`memory-tool.db` at repo root** is a Claude memory artifact. Likely doesn't belong in git. Confirm before commit.

## Workflow Defaults
- Plan mode for any change touching: routing, build config, worker deployment, DNS, secrets.
- Surgical edits only — match existing srcset patterns, don't reformat adjacent code.
- Verify image references with `find site/public/images -name '*pattern*'` BEFORE adding `<img>` tags.
- After ANY site change: spin up `npm run dev` in `site/` and load in a real browser at the project base path before declaring done.

## Cross-references (global rules that apply here)
- [karpathy-coding-principles.md](~/.claude/rules/karpathy-coding-principles.md) — think-before, simplicity, surgical, goal-driven.
- [huet-mcp-security.md](~/.claude/rules/huet-mcp-security.md) — three-layer containment (Layer 3 hook installed at `.claude/hooks/pre-tool-use-block-secret-exfil.sh`).
- [agent-operation-discipline.md](~/.claude/rules/agent-operation-discipline.md) — TPPAS, Rule of Two, Two-Agent Rule. The Oracle worker is a high-authority public-facing agent → honey-pot canary required (already in `oracle-dna.md`).
- [claude-code-mastery.md](~/.claude/rules/claude-code-mastery.md) — Developer + QA pattern. Run `oracle-qa-reviewer` agent before any Oracle worker deploy.

## Useful Commands
```bash
# Site dev (from site/)
npm run dev          # local dev server
npm run build        # produce site/dist/

# Worker deploy (from oracle/worker/)
wrangler whoami                                    # verify account
wrangler deploy --dry-run                          # sanity check
wrangler kv:namespace list                         # check ORACLE_SESSIONS / ORACLE_CACHE exist
wrangler deploy                                    # real deploy
wrangler tail oracle-worker --format=pretty        # live log

# Pre-commit secret audit
git diff --cached | grep -iE '(api[_-]?key|secret|password|token|bearer)' && echo "STOP: secrets in diff"
```

This file is the project's source of truth. Update it alongside any change to hosting, build, or integration topology.
