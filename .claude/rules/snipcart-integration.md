---
name: snipcart-integration
description: Snipcart v3 cart button patterns + webhook security for 3rd Eye Supply
paths:
  - site/**
  - cj-webhook-worker.js
---

# Snipcart Integration

Snipcart v3 powers checkout. The client-side script is included on every product page; the webhook worker (`cj-webhook`) handles server-side order confirmation. Two surfaces, two security postures.

## Client-Side (public — by design)

`data-api-key` on `<div id="snipcart">` is the PUBLIC key. It's meant to be in HTML. Never confuse it with the Secret API Key.

```html
<div id="snipcart" hidden data-api-key="[PUBLIC_KEY]"></div>
<script defer src="https://cdn.snipcart.com/themes/v3.4.1/default/snipcart.js"></script>
<link rel="stylesheet" href="https://cdn.snipcart.com/themes/v3.4.1/default/snipcart.css">
```

Pin the version (currently `v3.4.1`). Don't use `v3/latest/` — auto-upgrades can break button schema.

## Add-to-Cart Button Schema

```html
<button
  class="snipcart-add-item"
  data-item-id="lavender-incense"
  data-item-name="Lavender Incense Bundle"
  data-item-price="12.00"
  data-item-url="/3rd-eye-supply/products/lavender-incense"
  data-item-description="Hand-rolled lavender incense, 20 sticks"
  data-item-image="/3rd-eye-supply/images/incense/lavender-cover.webp"
>
  Add to Cart
</button>
```

Critical fields:
- `data-item-id` — MUST match the slug in `data-item-url` AND the product key in `PRODUCTS` KV. Snipcart uses this as the canonical SKU; mismatches between cart and inventory cause overselling.
- `data-item-url` — MUST be project-absolute (`/3rd-eye-supply/...`), MUST be a real product page. Snipcart fetches this URL server-side to verify the item exists at the stated price (Snipcart "URL crawling" anti-tampering check).
- `data-item-price` — string, two decimal places. Snipcart will reject the cart if the live URL crawl returns a different price.

## URL Crawler = Anti-Tampering, Not Optional

When a customer hits checkout, Snipcart's servers fetch `data-item-url` and re-read the price + name from the page. If they differ from the cart, Snipcart aborts with a validation error. Implications:

1. **Don't generate dynamic prices on the client.** The server-side crawl will see a different value than the client did.
2. **Don't gate product pages behind auth.** Snipcart's crawler is unauthenticated.
3. **Don't deploy a price change without rebuilding the product page that hosts it.** The cart will silently fail.

## Webhook Security (server-side)

`cj-webhook-worker.js` receives POSTs from Snipcart. Every request includes an `X-Snipcart-RequestToken` header that's a one-time token — NOT a static secret.

The validation flow:
1. Read `X-Snipcart-RequestToken` from the incoming request.
2. Call `GET https://app.snipcart.com/api/requestvalidation/{token}` with HTTP Basic Auth using the Snipcart SECRET API Key.
3. If the response is 200 with a valid event, the webhook is authentic. Otherwise reject with 401.

```js
const token = request.headers.get('X-Snipcart-RequestToken');
if (!token) return new Response('Missing token', { status: 401 });

const validation = await fetch(`https://app.snipcart.com/api/requestvalidation/${token}`, {
  headers: { 'Authorization': 'Basic ' + btoa(env.SNIPCART_SECRET_API_KEY + ':') }
});
if (!validation.ok) return new Response('Invalid token', { status: 401 });
```

The Secret API Key lives in `wrangler secret put SNIPCART_SECRET_API_KEY --name cj-webhook`. Never client-side, never in `site/public/`.

## Order Fulfillment Flow

```
1. Customer clicks Add to Cart → Snipcart stores cart in their session
2. Customer checks out → Snipcart crawls each item URL, verifies prices, charges card
3. Snipcart POSTs `order.completed` webhook → cj-webhook validates token
4. cj-webhook reads order details from Snipcart API → writes to ORDERS_STATE KV
5. cj-webhook calls CJ API to create dropship order with shipping info
6. cj-tracking polls CJ hourly → writes tracking updates to ORDERS_STATE
7. (Future) cj-tracking POSTs back to Snipcart to update order with tracking #
```

The KV `ORDERS_STATE` is the durable record. Snipcart is the system of record for payment; CJ is the system of record for fulfillment; ORDERS_STATE is the join.

## Test Mode

Snipcart test mode uses a separate `data-api-key`. Don't ship test keys to production. The webhook worker reads `env.SNIPCART_MODE` (or similar) — set it explicitly per worker, don't infer.

## Anti-Patterns

- **Putting the Secret API Key anywhere client-visible** — including in commented-out HTML, build configs, or `.env` files that get bundled.
- **Computing prices in JavaScript on the product page** — Snipcart's crawler will see the un-rendered HTML price, mismatch the cart, abort checkout.
- **Skipping token validation in the webhook** — anyone can POST to the worker URL. Without validation you'll accept forged "paid" notifications and trigger free dropship orders.
- **Using `data-item-url` that points to a CDN or external host** — Snipcart's crawler resolves it against your origin; external URLs may not work consistently.

## Cross-references
- [PROJECT_PLAYBOOK.md](../../PROJECT_PLAYBOOK.md) §"Snipcart Integration"
- [cj-dropshipping.md](cj-dropshipping.md) — what happens after the webhook validates
- [cloudflare-workers-deploy.md](cloudflare-workers-deploy.md) — secret management
- Snipcart docs: https://docs.snipcart.com/v3/webhooks
