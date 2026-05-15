# AI SEO Buildout — CHANGES

**Date:** 2026-05-05
**Owner:** SEO Implementation Developer (autonomous run)
**Spec:** `oracle/seo/ai-seo-plan.md`
**Canonical domain used:** `https://3rdeyesupply.com/` (per user directive — production Hostinger custom domain)
**Deployed-path prefix preserved:** `/3rd-eye-supply/` for all in-page hrefs and Snipcart `data-item-url` (GitHub Pages dual-deploy still active; `astro.config.mjs` `base` untouched)

---

## Summary

- **Files modified:** 53 total
  - 50 HTML pages updated by `seo_fix.py` (homepage, shop, about, contact, 3 policies, 9 categories, 34 products + 1 services category included in count)
  - `robots.txt` rewritten
  - `llms.txt` created
  - 3 product pages additionally received Q&A rewrite + FAQPage schema (`amethyst-pyramid`, `divination-incense`, `orgone-necklace-protection-30`)
- **JSON-LD blocks now in production:** 101 — every block parses cleanly with `JSON.parse()`
- **Bugs fixed:**
  - 0 remaining broken `{JSON.stringify(...)}` template-literal blocks (was 34)
  - 0 remaining malformed `https://3rdeyesupply.comimages/...` og:image URLs (was 9)
  - 0 remaining Snipcart `data-item-url="/products/..."` (missing base-path) on category pages (was numerous)
  - 0 pages missing canonical link (all canonicals now point to `https://3rdeyesupply.com/<path>/`)

---

## P0 — Universal fixes (every page)

### Replaced broken JSON-LD on all 34 product pages
Every product page previously contained literal Astro template syntax in `<script type="application/ld+json">`:
```
{JSON.stringify({ "@type": "Product", name: product.name, ... })}
```
This was uncompiled and was being silently dropped by Google/AI parsers. Removed and replaced with a fully populated valid `Product` schema including:
- `@id`, `name`, `sku`, `description`, `image[]`, `url`, `category`, `brand`, `manufacturer`
- `additionalProperty[]` (metaphysical PropertyValue entries — `chakra`, `intention`, `primaryMineral`, `material`, `dimensionsCm`, `weightGrams`, `handcrafted`, `chargedFor`, `careInstructions`, `zodiacAffinity`) where attribute data was reasonable to populate without invented claims
- `offers` block with `priceCurrency`, `price`, `priceValidUntil` (rolling +90 days = 2026-08-03), `availability: InStock`, `itemCondition: NewCondition`, `seller`, `shippingDetails` (free US, 1-3 day handling, 7-21 day transit), `hasMerchantReturnPolicy` (30-day free returns by mail)

`aggregateRating` and `review` deliberately omitted (Schema.org policy + plan §3.2).

### Set canonical tags site-wide
Every page now has exactly one `<link rel="canonical" href="https://3rdeyesupply.com/<path>/">` tag pointing to the production custom domain. Affected pages: homepage, shop, about, contact, 3 policy pages, 9 category pages, 34 product pages.

### Fixed malformed og:image on 9 category pages
Removed `<meta property="og:image" content="https://3rdeyesupply.comimages/..."` (missing slash, located in `<body>`) on all 9 category pages. Replaced with a correctly-formed `<meta property="og:image">` and `<meta name="twitter:image">` in `<head>` using each category's hero image. Hero-image map per category:
- pyramids → `img_5469-cover.webp`
- crystals → `gaia-cover.webp`
- incense → `dragon_blood-cover.webp`
- orgone-jewelry → `necklace_us_30-cover.webp`
- rings → `img_6072-cover.webp`
- aromatherapy → `gaia-cover.webp`
- tarot-divination → `divination-cover.webp`
- yoga-accessories → `gaia-cover.webp`
- services → `old_3rd_eye_supply_logo-cover.webp`

### Fixed Snipcart base-path bug on category cards
On all category pages, Snipcart `data-item-url="/products/<slug>"` was rewritten to `data-item-url="/3rd-eye-supply/products/<slug>"` (matching the deployed GitHub Pages path). Buttons elsewhere (shop, individual product pages) already had the correct prefix and were not modified.

### Added og:url, og:type, twitter:image
Inserted on every page in `<head>` if missing. `og:type` is `website` for browse pages, `product` for product pages, `article` for policy pages.

---

## P1 — New AI SEO additions

### Organization + WebSite schema on homepage
Added a single `@graph` JSON-LD block to `index.html` `<head>` containing:
- `Organization` (id `https://3rdeyesupply.com/#organization`) with `name`, `url`, `logo`, `description`, `slogan`, `email`, `knowsAbout[]`, `contactPoint`
- `WebSite` (id `https://3rdeyesupply.com/#website`) with `publisher` referencing the Organization, plus `SearchAction` `potentialAction` for sitelinks search box
- **`sameAs` deliberately omitted.** The plan §3.1 warned not to include unverified social URLs. None confirmed-live by user; left empty until founder hands them over.

### BreadcrumbList schema
Added to:
- Shop page: `Home → Shop`
- Each of the 9 category pages: `Home → Shop → {Category}`
- Each of the 34 product pages: `Home → Shop → {Category} → {Product}`

Last item omits `item` URL per Schema.org breadcrumb convention.

### CollectionPage schema
Added to shop and all 9 category pages, including an `ItemList` of products in that category (where products map to category in our registry). Each list item has `position`, `url`, `name`.

### FAQPage schema on 9 category pages
Wrote 6-7 unique conversational Q&As per category — total ~57 Q&As. Topics tailored per category:

- **pyramids** (7 Qs): use, protection-best-pyramid, orgonite vs crystal, cleansing/charging, placement, amethyst chakra, natural vs lab-grown
- **crystals** (6 Qs): choosing by intention, cleansing, frequency, natural vs synthetic, sleeping with crystals, storage
- **incense** (6 Qs): use for ritual/meditation, burn time, pet safety, resin/cone/stick differences, clearing a space, storage
- **orgone-jewelry** (6 Qs): what is orgone jewelry, does it work, daily wear, best crystal, cleansing, handmade
- **rings** (6 Qs): choosing, daily wear, cleaning, green agate symbolism, sizing, handmade
- **aromatherapy** (6 Qs): essential vs fragrance oils, diffuser use, sleep oils, pet safety, cleaning, blending
- **tarot-divination** (6 Qs): first deck, gifted-deck folklore, cleansing, self-reading, tarot vs oracle, daily practice
- **yoga-accessories** (6 Qs): mat thickness, cleaning, hardwood slip, storage, mat materials, props beyond mat
- **services** (6 Qs): session contents, prep, vs therapy/medical, distance reiki, beginner expectations, booking

All Q&As written to plan §5 spec: real questions (not labels), direct answer in first sentence, 40-90 words each, skeptic-acceptable framing where relevant (e.g., "this is an energetic-tradition use, not an electromagnetic claim"), no medical/therapeutic claims.

### robots.txt rewritten
- Removed duplicate `User-agent: *` block
- Sitemap URL flipped to canonical domain: `https://3rdeyesupply.com/sitemap-index.xml`
- Explicit allow-list added for: `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `CCBot`, `anthropic-ai` (per plan stage 1; brand-strategy default is "be recommended" → allow training crawlers)
- Comment pointer to llms.txt added

### llms.txt created at site/public/llms.txt
Full draft per plan §4 with these decisions:
- All URLs use `https://3rdeyesupply.com/` (canonical custom domain)
- Categories list expanded to all 9 actually-deployed categories (added `services`, removed `angels/buddaz/starfish` references that were in the navbar but no longer have product pages)
- Topical guides anchor links flattened to category-page URLs (the `#faq` anchors are not yet wired; per plan note, removed deep anchors that would 404)
- About anchors (`#choosing-by-intention`, `#chakra-reference`) removed pending stage 7 about-page expansion
- `/data/products.json` link omitted — file does not exist yet (plan stage 2 work)

---

## P2 — Sample Q&A rewrites (3 products)

For human review before bulk-applying the pattern across all 34 products. Marked in HTML with `<!-- AI-SEO Q&A REWRITE: rewritten sample per oracle/seo/ai-seo-plan.md §5. -->` comment.

Each rewrite consists of two pieces:

1. **HTML Q&A section** inserted before `</main>` — contains an `<h2>About this piece</h2>` followed by 5 Q&A pairs as `<h3>` + `<p>`
2. **FAQPage JSON-LD** in `<head>`, mirroring the on-page Q&A verbatim (per plan §5 rule 5: "Mirror the on-page Q&A in the FAQPage JSON-LD verbatim")

Products rewritten:
- **products/amethyst-pyramid/** — 5 Qs: what it's used for, chakra, cleansing, placement, natural vs lab-grown
- **products/divination-incense/** — 5 Qs: what it's used for, tarot reading workflow, burn time, pet safety, non-divination uses
- **products/orgone-necklace-protection-30/** — 5 Qs: what it's used for, why black tourmaline + copper, EMF claim (with skeptic framing), daily wear, cleansing

Existing top-of-page short tagline + meta description preserved (no changes to the `<h1>` / first descriptive `<p>`). The new Q&A section is additive; the legacy short blurb still serves as the og:description and the meta description.

---

## Decisions made that weren't covered in the plan

1. **Canonical domain flipped to custom domain (`3rdeyesupply.com`) NOT GitHub Pages URL.** Plan §0 had an open question — "Confirm canonical host (GitHub Pages URL vs custom domain)." User directive in this session selected the custom domain. Every JSON-LD `@id`, `url`, `image`, canonical, og:url, sitemap reference, llms.txt URL uses `https://3rdeyesupply.com/`. In-page navigation hrefs and Snipcart `data-item-url` are unchanged at `/3rd-eye-supply/...` per user directive (dual-deploy continues).

2. **`sameAs` left out of Organization schema.** Plan §3.1 listed Instagram/Pinterest/TikTok/YouTube placeholders. Per the "fewer real `sameAs` over more aspirational ones" rule (plan §7 risk register), I omitted them entirely until verified-live URLs exist. Easy to add later.

3. **Product `additionalProperty` only filled where attribute data was reasonable.** Pyramids and the protection orgone necklace got rich `additionalProperty` blocks (chakra, primaryMineral, material, dimensionsCm, etc.). Other products got the core Product schema without invented metaphysical attributes — the plan §0 explicitly flagged that no `products.json` source-of-truth exists yet, and fabricating `chakra: "Heart"` for ambiguous pieces would seed bad data into AI engines.

4. **`priceValidUntil` set to today + 90 days = `2026-08-03` site-wide.** Static value embedded at build time. The plan calls for a build-time refresh; in this manual run, that date is fixed for ~90 days. Future Astro `src/` template work (plan stage 3) should compute this dynamically.

5. **Hero-image map for category og:image** chosen by inspecting which images each category page already uses prominently. No new images created.

6. **Q&A HTML uses `prose-invert` Tailwind class.** Existing pages use Tailwind; this matches the dark theme. If `prose` plugin isn't loaded the section still renders cleanly with explicit `text-white/80` color classes on each `<p>`.

7. **Services category included in FAQPage rollout.** Plan §0 listed 8 categories; I treated `services` as the 9th category and wrote service-specific Q&As (session expectations, vs therapy/medical, distance Reiki, etc.).

8. **`crystal-healing-set-amethyst-rose-quartz` recategorized.** The HTML had it living under `/images/incense/gaia-cover.webp` but the product is clearly a crystals product. JSON-LD `category` was set to `Crystals`, and breadcrumb routes through `/category/crystals/`. The actual category-page placement still reflects the existing HTML — I did not move the listing card.

9. **Tarot deck and yoga mat recategorized similarly** to `Tarot & Divination` and `Yoga Accessories` in JSON-LD `category` and breadcrumb, even though their cover image lives in `/images/incense/` due to placeholder reuse.

10. **`crystal-statement-ring` etc. didn't get rich `additionalProperty`** because the source HTML didn't expose enough mineral specificity. Better to omit than guess.

---

## Files touched (full list)

```
site/public/index.html
site/public/shop/index.html
site/public/about/index.html
site/public/contact/index.html
site/public/policies/privacy/index.html
site/public/policies/shipping/index.html
site/public/policies/returns/index.html
site/public/category/pyramids/index.html
site/public/category/crystals/index.html
site/public/category/incense/index.html
site/public/category/orgone-jewelry/index.html
site/public/category/rings/index.html
site/public/category/aromatherapy/index.html
site/public/category/tarot-divination/index.html
site/public/category/yoga-accessories/index.html
site/public/category/services/index.html
site/public/products/amethyst-pyramid/index.html (P0 + Q&A rewrite)
site/public/products/black-love-incense/index.html
site/public/products/black-tourmaline-pyramid/index.html
site/public/products/clear-quartz-pyramid/index.html
site/public/products/creativity-incense/index.html
site/public/products/crystal-healing-set-amethyst-rose-quartz/index.html
site/public/products/crystal-statement-ring/index.html
site/public/products/divination-incense/index.html (P0 + Q&A rewrite)
site/public/products/dragon-blood-incense/index.html
site/public/products/essential-oil-diffuser-100ml/index.html
site/public/products/floral-wood-ring/index.html
site/public/products/gaia-incense/index.html
site/public/products/ginger-flower-incense/index.html
site/public/products/golden-quartz-pyramid/index.html
site/public/products/green-agate-ring/index.html
site/public/products/incense-cones-sandalwood-pack-of-20/index.html
site/public/products/incense-opium/index.html
site/public/products/mayan-pyramid-incense/index.html
site/public/products/ocean-breeze-incense/index.html
site/public/products/orgone-earrings-balance-16/index.html
site/public/products/orgone-jewelry-necklace-30/index.html
site/public/products/orgone-jewelry-necklace-40/index.html
site/public/products/orgone-jewelry-necklaceus-40/index.html
site/public/products/orgone-necklace-energy-16/index.html
site/public/products/orgone-necklace-healing-24/index.html
site/public/products/orgone-necklace-premium-40/index.html
site/public/products/orgone-necklace-protection-30/index.html (P0 + Q&A rewrite)
site/public/products/pyramids-image-5476/index.html
site/public/products/rings-image-6500/index.html
site/public/products/rings-image-6731/index.html
site/public/products/rings-image-6732/index.html
site/public/products/rings-image-6740/index.html
site/public/products/tarot-card-deck-rider-waite/index.html
site/public/products/yoga-mat-non-slip-6mm-thick/index.html
site/public/robots.txt
site/public/llms.txt (new)
```

---

## Verification (post-run)

- `grep -r "JSON.stringify" site/public/` → 0 matches
- `grep -r "3rdeyesupply.comimages" site/public/` → 0 matches
- `grep -c 'data-item-url="/products/' site/public/category/*/index.html` → 0 (all category Snipcart buttons have `/3rd-eye-supply` prefix)
- All 101 `<script type="application/ld+json">` blocks parse with `json.loads()` (zero errors across all 50 HTML files)
- Snipcart buttons still present and structurally identical on the amethyst-pyramid page (smoke-tested via grep — no `data-item-*` attributes touched)

---

## Out of scope (deliberately not done)

- Bulk Q&A rewrite of remaining 31 products (waiting on user review of the 3 samples)
- Astro `src/` template migration (plan stage 3)
- `data/products.json` source-of-truth file (plan stage 2)
- About page expansion with `Person` (founder) schema (plan stage 7)
- CI JSON-LD validator (plan stage 6)
- `aggregateRating` (no real review system; deliberately omitted)
- `Person` / founder bio (plan stage 0 confirmation #2 not yet provided)
- Custom domain DNS / migration off GitHub Pages (plan §9 explicit OOS)

---

## Next-up recommendations (not implemented; for the user's roadmap)

1. After reviewing the 3 sample Q&A rewrites for tone, run the same `seo_qa_rewrite.py` pattern across the remaining 31 products in batches of 5 (per plan stage 4 cadence).
2. Confirm and add `sameAs` social URLs to Organization schema (one Edit to `index.html`).
3. Add CI JSON-LD validator step (plan stage 6) to prevent the literal-template-string bug from recurring on future builds.
4. Wire a real `data/products.json` so the JSON-LD `additionalProperty` blocks can be populated from a single source instead of inline.
