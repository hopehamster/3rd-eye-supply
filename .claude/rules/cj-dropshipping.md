---
name: cj-dropshipping
description: CJdropshipping API integration patterns — order creation, inventory sync, tracking
paths:
  - cj-*.js
  - oracle/catalog/**
---

# CJdropshipping Integration

Three workers and a product importer talk to CJ's API. They form the inventory/fulfillment backbone of the storefront.

## The Four Components

| File | Role | Trigger |
|---|---|---|
| [cj-product-importer.js](../../cj-product-importer.js) | Pull product catalog into `PRODUCTS` KV + generate product pages | Manual / scheduled |
| [cj-inventory-sync-worker.js](../../cj-inventory-sync-worker.js) | Hourly stock + price sync from CJ → `PRODUCTS` KV | Cron |
| [cj-webhook-worker.js](../../cj-webhook-worker.js) | Snipcart webhook → CJ order creation | HTTP POST |
| [cj-tracking-worker.js](../../cj-tracking-worker.js) | Poll CJ for shipped-order tracking updates | Cron |

## API Key Hygiene

CJ uses a single long-lived API key. Currently hard-coded in [deploy-cloudflare-workers.js:73](../../deploy-cloudflare-workers.js#L73) as `fec0d4746c244fec9fede00a6b626143` — **this is a live secret in a tracked file**. Rotation steps:

1. Generate a new key in CJ developer console.
2. `wrangler secret put CJ_API_KEY --name cj-webhook` (and same for `cj-tracking`, `cj-inventory-sync`).
3. Remove the hard-coded value from `deploy-cloudflare-workers.js`.
4. Revoke the old key in CJ console.
5. `git filter-repo` or BFG the old value out of history if the repo will ever go public.

Until rotated, treat this key as compromised — anyone with read access to the repo has it.

## Rate Limits

CJ documents ~600 requests / 5 minutes per account. The inventory sync worker iterates the whole catalog hourly — at 100+ products this gets close to the limit. Two mitigations:

1. **Batch endpoint preference**: CJ's `/product/list` accepts pagination. Don't fan out 100 single-product calls when one paginated call works.
2. **Backoff on 429**: catch the `429 Too Many Requests` response and sleep proportional to the `Retry-After` header. Don't retry tightly.

## Product Schema (`PRODUCTS` KV)

The KV stores one entry per SKU under key `product:{slug}`. Schema:

```json
{
  "slug": "lavender-incense",
  "cj_pid": "1234567890",
  "name": "Lavender Incense Bundle",
  "price_usd": 12.00,
  "stock": 47,
  "weight_g": 80,
  "images": ["lavender-cover.webp", "lavender-400w.webp", ...],
  "description": "...",
  "updated_at": "2026-05-15T03:14:00Z"
}
```

The `slug` is canonical — it's the Snipcart `data-item-id`, the product page path segment, and the KV key suffix all in one. Never change a slug for an existing product (would orphan in-flight carts and break SEO).

## Order Creation Flow (cj-webhook)

After Snipcart validates the webhook, the worker:

1. Reads order details from Snipcart API (`GET /api/orders/{token}`).
2. Maps each Snipcart line item's `id` (= slug) → `cj_pid` via `PRODUCTS` KV.
3. POSTs to CJ `/order/create` with shipping address + line items.
4. Writes the CJ order ID into `ORDERS_STATE` under `order:{snipcart_id}`.

Failure modes to handle:
- **CJ rejects the order** (out of stock, address invalid): log to `ORDERS_STATE` with status `failed`, notify ops via email/Slack. Snipcart already charged the customer — manual refund needed.
- **CJ times out / 5xx**: idempotent retry. CJ deduplicates by Snipcart order ID if you pass it as `externalOrderId`.
- **Product in cart no longer in PRODUCTS KV** (sync race): fail loudly, do not silently substitute.

## Tracking Polling (cj-tracking)

CJ provides per-order tracking via `/order/get?id={cj_order_id}`. The worker:

1. Reads all orders from `ORDERS_STATE` with status `awaiting_shipment` or `in_transit`.
2. For each, calls CJ for current status + tracking number.
3. On state change, updates ORDERS_STATE + (future) emails the customer + (future) posts back to Snipcart's order API to attach the tracking number.

Don't poll orders in terminal states (`delivered`, `cancelled`, `refunded`). Those should be filtered before the iteration starts.

## Inventory Sync Discipline

The inventory sync worker writes to BOTH `stock` (integer) and `price_usd` (decimal). Price changes are dangerous:

- Snipcart's URL crawler reads the price from the live product page HTML.
- If KV says `$15.00` but the static HTML in `site/dist/` still says `$12.00`, Snipcart will accept carts at $12 and try to create CJ orders at the new cost → margin loss.

The fix is to mark `PRODUCTS` KV as the source of truth and **regenerate the static product pages** whenever a price changes. The inventory sync worker should write a `price_changes.json` to KV that a CI step reads to trigger a rebuild — don't expect the static HTML to lazy-update.

## Anti-Patterns

- **Reading the CJ API key from a `[vars]` block in wrangler.toml** — that's plaintext in git. Use `wrangler secret put`.
- **Fanning out hundreds of `/product/get` calls when `/product/list` paginates** — burns rate limit budget and is 100× slower.
- **Treating CJ stock as exact** — it's eventually consistent. Always overdraw-protect at order creation (CJ will reject if truly OOS; treat that as authoritative).
- **Mutating slugs to "clean up SEO"** — breaks in-flight carts, breaks order-tracking joins.

## Cross-references
- [PROJECT_PLAYBOOK.md](../../PROJECT_PLAYBOOK.md) §"CJdropshipping API"
- [snipcart-integration.md](snipcart-integration.md) — webhook is the entry point
- [cloudflare-workers-deploy.md](cloudflare-workers-deploy.md) — secret management
- CJ docs: https://developers.cjdropshipping.com/
