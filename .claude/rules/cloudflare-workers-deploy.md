---
name: cloudflare-workers-deploy
description: Wrangler / KV / routes / secrets discipline for all Cloudflare Workers in this repo
paths:
  - oracle/worker/**
  - cj-*-worker.js
  - "**/wrangler*.toml"
  - deploy-cloudflare-workers.js
---

# Cloudflare Workers Deploy Discipline

Four workers run on this account: `oracle-worker`, `cj-webhook`, `cj-tracking`, `cj-inventory-sync`. Each is a separate deployment with its own config. This rule covers patterns that apply to all of them.

## One Worker, One wrangler.toml

Don't merge workers into a shared config. The `deploy-cloudflare-workers.js` script generates a per-worker `wrangler-<name>.toml` and tears it down after deploy — preserve that pattern. Reasons:
- Least-privilege bindings: the Oracle worker should NEVER see CJ secrets and vice versa.
- Independent rollback: a bad CJ deploy shouldn't force-roll the Oracle worker.
- Per-worker observability: separate `wrangler tail` streams.

## Secrets Are Always `wrangler secret put`

Never:
```toml
[vars]
ANTHROPIC_API_KEY = "sk-ant-..."   # WRONG — value committed to git via wrangler.toml
```

Always:
```bash
wrangler secret put ANTHROPIC_API_KEY --name oracle-worker
# (paste value at the prompt)
```

Secrets list (per worker):
- `oracle-worker`: `ANTHROPIC_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_GROUP_ID`
- `cj-webhook`: `SNIPCART_SECRET_API_KEY`, `CJ_API_KEY`, optional `SNIPCART_WEBHOOK_SECRET`
- `cj-tracking`: `CJ_API_KEY`
- `cj-inventory-sync`: `CJ_API_KEY`

The CJ key currently hard-coded in `deploy-cloudflare-workers.js:73` is the active landmine — move it to `wrangler secret put CJ_API_KEY` and remove from source. The project hook (`.claude/hooks/pre-tool-use-block-secret-exfil.sh`) will block `wrangler secret put NAME inline-value` to enforce stdin entry.

## KV Namespace IDs Are Stable; Reuse Them

| Binding | ID | Workers that use it |
|---|---|---|
| `PRODUCTS` | `068e6599412e40659fd403e54f5fac55` | oracle-worker (RO), cj-inventory-sync (RW) |
| `ORDERS_STATE` | `e2b14ff2ea19401f9f4211540ddf3f6e` | cj-webhook (RW), cj-tracking (RW) |
| `ORACLE_SESSIONS` | not yet created | oracle-worker (RW) |
| `ORACLE_CACHE` | not yet created | oracle-worker (RW) |

If you see a placeholder like `REPLACE_AFTER_wrangler_kv_namespace_create_...` in a wrangler.toml, that namespace hasn't been provisioned. Run:

```bash
wrangler kv:namespace create ORACLE_SESSIONS
wrangler kv:namespace create ORACLE_CACHE
```

Then paste the returned IDs into wrangler.toml. Don't deploy with placeholder IDs — the worker will throw at first read.

## Routes vs workers.dev

`oracle/worker/wrangler.toml` declares:
```toml
[[routes]]
pattern = "3rdeyesupply.com/api/oracle/*"
zone_name = "3rdeyesupply.com"
```

This ONLY works if the `3rdeyesupply.com` zone is in this Cloudflare account. Verify before deploy:

```bash
wrangler whoami
# In the Cloudflare dashboard: Websites → confirm 3rdeyesupply.com is listed
```

If the zone isn't there, Hostinger is hosting DNS — two choices:
1. **Migrate**: change Hostinger registrar to use Cloudflare nameservers, then add the zone in Cloudflare. ~24-48h propagation. Cleanest long-term.
2. **Strip routes**: remove the `[[routes]]` blocks from wrangler.toml and call the worker at `https://oracle-worker.<account>.workers.dev/oracle/*`. Update [oracle/site client](../../site/src/scripts/oracle-client.js) origin detection to use the workers.dev URL.

This decision is the current deploy blocker. Don't deploy with routes the zone won't honor.

## Compatibility Date Discipline

`compatibility_date = "2026-05-05"` (Oracle worker) or `"2024-01-01"` (CJ workers). Don't bump backwards — only forward, and only when a new Workers runtime feature is needed. Rolling back the compat date can silently change behavior of `fetch`, `crypto`, or `Headers`.

## Observability On During Early Deploy

```toml
[observability]
enabled = true
```

Keep it on for the first 2 weeks of any new worker. Then audit log volume — Workers Logs is billable past free tier. Disable for low-traffic stable workers, keep enabled for the oracle worker permanently.

## Deploy Sequence (every worker)

```bash
# 1. From the worker's directory (or with --config flag)
wrangler whoami                        # confirm account
wrangler kv:namespace list             # confirm bindings exist
wrangler deploy --dry-run              # static + binding validation
wrangler deploy                        # real deploy
wrangler tail <worker-name> --format=pretty   # smoke test live
```

## Anti-Patterns to Refuse

- **Pasting secrets into wrangler.toml** — even temporarily "to test". The file gets committed by reflex. Use `wrangler secret put` always.
- **Sharing a wrangler.toml across workers** — collapses least-privilege.
- **Deploying with `REPLACE_AFTER_...` placeholders** — will throw at runtime.
- **`workers_dev = true` on a worker that should only respond to a custom route** — leaks a public URL. Set `workers_dev = false` once the route is verified working.
- **Deploying without `wrangler deploy --dry-run` first** — costs you the rollback round-trip when there's a syntax error.

## Cross-references
- [PROJECT_PLAYBOOK.md](../../PROJECT_PLAYBOOK.md) §"Cloudflare Workers + KV"
- [oracle-worker-discipline.md](oracle-worker-discipline.md) — Oracle-specific security
- [cj-dropshipping.md](cj-dropshipping.md) — CJ workers' role in this system
