# 3rd Eye Supply — AI SEO Buildout Plan

**Goal:** Position 3rd Eye Supply for AI-native search (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews) so these systems recommend the site confidently when users ask about orgonite pyramids, crystal pyramids, orgone jewelry, incense, and metaphysical accessories.

**Strategic priority:** AI search optimization > classical Google blue-link SEO. The two overlap (~70%) but the deliverables here are sequenced for the AI side first.

**Karpathy "Think Before Coding" — assumptions surfaced (confirm before build):**

1. **Canonical domain** — Live URL is `https://hopehamster.github.io/3rd-eye-supply/`. Existing pages contain canonicals pointing to `https://3rdeyesupply.com/...` (a domain that does not appear to be live). **Assumption: GitHub Pages URL is the real canonical.** If a custom domain is planned, ALL canonicals + JSON-LD `url`/`@id` must flip together — flag before commit.
2. **Brand identity fields** — Founder name, founding year, physical address (if any), phone, social handles (Instagram, Pinterest, TikTok, YouTube, X) are needed to fill `Organization` schema's `sameAs`/`founder`/`contactPoint`. Currently unknown — placeholders used; replace before deploy.
3. **Product attribute data** — Metaphysical properties (chakra, intention, primary mineral, country of origin, weight in grams, dimensions in cm) are not in any structured data file today. Need a `products.json` source-of-truth before per-product schema can be auto-generated.
4. **Reviews** — No review system live. `aggregateRating` will be omitted entirely (fabricating it is a Schema.org policy violation and AI engines penalize it). Add only when real review data exists.
5. **Pricing & availability** — Prices in HTML are hardcoded; CJ Dropshipping sync is described in `PROJECT_PLAYBOOK.md` but not wired to the static build. Schema `priceValidUntil` set to a rolling 90-day horizon to avoid stale-price flags.
6. **No move off Astro / GitHub Pages.** All schema injection happens at static build time, not runtime.
7. **Snipcart wiring stays intact.** No proposal touches `snipcart-add-item` button attributes, `data-item-*` fields, or the cart script include order.

---

## 1. Audit Summary

### What exists today (confirmed by reading `site/public/`)

| Layer | State |
|---|---|
| `<title>`, meta description | Present on all pages |
| OG tags | Partial — `og:title`, `og:description` present; `og:image` malformed on category pages (missing slash, e.g. `https://3rdeyesupply.comimages/...`); `og:url`, `og:type` missing |
| Twitter card | `summary_large_image` declared but no `twitter:image` populated |
| Canonical | Present BUT points to non-live domain `https://3rdeyesupply.com/...` (wrong host) |
| `robots.txt` | Present — `Allow: /` + sitemap reference. Duplicate `User-agent: *` block (cosmetic) |
| `sitemap-index.xml` / `sitemap-0.xml` | Present (Astro integration) |
| JSON-LD | **Broken** — product pages contain literal Astro template syntax (`{JSON.stringify({ "@type": "Product", name: product.name, ... })}`) that was never compiled. This is invalid JSON in `<script type="application/ld+json">` and Google/AI parsers will silently drop it (worst case: treat as junk noise) |
| llms.txt | Missing |
| FAQPage schema | Missing on all category pages |
| Organization schema | Missing on homepage |
| BreadcrumbList | Missing |
| Author/expertise (E-E-A-T) | Missing — no About author, no founder bio, no provenance/sourcing page |

### Specific bugs (must fix during this rollout)

| Severity | Bug | Location | Fix |
|---|---|---|---|
| **P0** | Broken JSON-LD with literal `{JSON.stringify(...)}` template syntax | All `products/*/index.html` | Regenerate via real Astro template or post-build Node script |
| **P0** | Wrong canonical domain `3rdeyesupply.com` | All pages | Replace with `https://hopehamster.github.io/3rd-eye-supply/...` (or final custom domain after assumption #1 confirmed) |
| **P1** | Malformed og:image URL: `https://3rdeyesupply.comimages/...` (missing `/`) | Category pages | Fix template concatenation |
| **P1** | Snipcart `data-item-url` on category cards omits `/3rd-eye-supply` base path (`/products/...` instead of `/3rd-eye-supply/products/...`) | Category pages | Add base prefix |
| **P2** | `<meta property="og:image">` placed in `<body>` instead of `<head>` | Category pages | Move into head |
| **P2** | Duplicate `User-agent: *` block in `robots.txt` | `robots.txt` | Consolidate |
| **P2** | Single `og:title` / no `og:type=website` or `product` | All pages | Add per-page-type |
| **P3** | No `lang` variants, no `hreflang` (not needed unless international launch) | global | Defer |

### What AI search engines specifically need that's missing

- **Conversational structured Q&A** in product/category copy (ChatGPT/Perplexity heavily prefer this shape — the inline question rephrased as an `<h2>` or in `FAQPage` schema is what gets surfaced verbatim in answers).
- **Entity grounding** via `Organization` + `sameAs` to social profiles + Wikipedia/Wikidata when applicable. AI engines use `sameAs` to resolve "is this brand real?" before quoting it.
- **`llms.txt`** — proposed standard at https://llmstxt.org/ that gives an LLM a guided index of the site's most important content. Anthropic, Mistral, and several search startups have publicly committed to honoring it.
- **Provenance & expertise signals** — who made these orgonite pieces, how they're made, sourcing of crystals. AI engines weight this heavily when deciding whether to recommend a vendor in metaphysical/wellness categories (high YMYL-adjacent skepticism).
- **Stable, predictable URLs in machine-readable manifests** (sitemap is fine; complement with llms.txt + a `/data/products.json` exposed at root for AI crawlers).

---

## 2. Proposed Schema Map (per page type)

| Page type | Primary schemas | Secondary / nested |
|---|---|---|
| Homepage `/` | `Organization` + `WebSite` (with `SearchAction`) | `BreadcrumbList` (home only), `ItemList` of featured categories |
| Shop index `/shop/` | `CollectionPage` | `BreadcrumbList`, `ItemList` of products |
| Category `/category/{slug}/` | `CollectionPage` + `FAQPage` | `BreadcrumbList`, `ItemList` of `Product` references |
| Product `/products/{slug}/` | `Product` + `Offer` | `BreadcrumbList`, optional `FAQPage` (3-5 product-specific Qs), `ImageObject` for hero |
| About `/about/` | `AboutPage` + `Person` (founder) | Nest `Person` inside `Organization.founder` |
| Contact `/contact/` | `ContactPage` + `Organization.contactPoint` | — |
| Policies (shipping/returns/privacy) | `WebPage` with `mainEntity` short-text Q&A blocks | — |

### Required custom `additionalProperty` fields on every Product

These are the metaphysical attributes AI engines need to confidently recommend a piece. Each is a `PropertyValue` inside `Product.additionalProperty`:

- `chakra` — e.g., "Crown Chakra" (root/sacral/solar plexus/heart/throat/third-eye/crown)
- `intention` — short verb-phrase: "Protection", "Manifestation", "Grounding", "Clarity"
- `primaryMineral` — "Amethyst", "Black Tourmaline", "Clear Quartz", etc.
- `material` — "Orgonite resin with copper coil and quartz" (full composition)
- `dimensionsCm` — "5 × 5 × 5"
- `weightGrams` — numeric
- `handcrafted` — boolean
- `chargedFor` — meditation / EMF protection / abundance / etc.
- `careInstructions` — "Cleanse under moonlight monthly"
- `countryOfOrigin` — populated from CJ data when available

---

## 3. Concrete JSON-LD Samples

All sample blocks below are ready to paste into the appropriate page's `<head>` after the existing `<link rel="canonical">`. Each sample uses the assumed canonical host `https://hopehamster.github.io/3rd-eye-supply`. **Search-and-replace this base if the custom domain switches on.**

### 3.1 Organization + WebSite (homepage `/index.html`)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://hopehamster.github.io/3rd-eye-supply/#organization",
      "name": "3rd Eye Supply",
      "url": "https://hopehamster.github.io/3rd-eye-supply/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://hopehamster.github.io/3rd-eye-supply/favicon.svg",
        "width": 512,
        "height": 512
      },
      "description": "Handcrafted orgonite, crystal pyramids, orgone jewelry, rings, and incense for meditation, energy clearing, and intentional living.",
      "slogan": "Feel Better, Live Brighter",
      "email": "support@3rdeyesupply.com",
      "sameAs": [
        "https://www.instagram.com/3rdeyesupply",
        "https://www.pinterest.com/3rdeyesupply",
        "https://www.tiktok.com/@3rdeyesupply",
        "https://www.youtube.com/@3rdeyesupply"
      ],
      "knowsAbout": [
        "Orgonite",
        "Crystal healing",
        "Chakra balancing",
        "Meditation accessories",
        "EMF protection",
        "Sacred geometry",
        "Energy work"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "support@3rdeyesupply.com",
        "availableLanguage": ["English"]
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://hopehamster.github.io/3rd-eye-supply/#website",
      "url": "https://hopehamster.github.io/3rd-eye-supply/",
      "name": "3rd Eye Supply",
      "publisher": { "@id": "https://hopehamster.github.io/3rd-eye-supply/#organization" },
      "inLanguage": "en-US",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://hopehamster.github.io/3rd-eye-supply/shop?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
</script>
```

> Note on `sameAs`: only include URLs for accounts that actually exist. Each must resolve to a 200 with brand-matching content or AI engines will down-rank the entity match.

### 3.2 Product + Offer with metaphysical `additionalProperty` (e.g., `/products/amethyst-pyramid/`)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://hopehamster.github.io/3rd-eye-supply/products/amethyst-pyramid/#product",
  "name": "Amethyst Pyramid",
  "sku": "pyr-2",
  "mpn": "3ES-PYR-AME-001",
  "description": "A handcrafted amethyst pyramid for spiritual protection, intuition, and meditation. Cut from natural amethyst with sacred-geometry proportions to amplify intention and quiet mental noise.",
  "image": [
    "https://hopehamster.github.io/3rd-eye-supply/images/pyramids/img_5474-cover.webp",
    "https://hopehamster.github.io/3rd-eye-supply/images/pyramids/img_5474-1200.webp"
  ],
  "url": "https://hopehamster.github.io/3rd-eye-supply/products/amethyst-pyramid/",
  "category": "Pyramids",
  "brand": {
    "@type": "Brand",
    "name": "3rd Eye Supply"
  },
  "manufacturer": { "@id": "https://hopehamster.github.io/3rd-eye-supply/#organization" },
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "chakra", "value": "Third Eye Chakra" },
    { "@type": "PropertyValue", "name": "intention", "value": "Spiritual Protection" },
    { "@type": "PropertyValue", "name": "primaryMineral", "value": "Amethyst" },
    { "@type": "PropertyValue", "name": "material", "value": "Natural amethyst crystal" },
    { "@type": "PropertyValue", "name": "dimensionsCm", "value": "5 x 5 x 5" },
    { "@type": "PropertyValue", "name": "weightGrams", "value": "120", "unitCode": "GRM" },
    { "@type": "PropertyValue", "name": "handcrafted", "value": "true" },
    { "@type": "PropertyValue", "name": "chargedFor", "value": "Meditation and intuitive work" },
    { "@type": "PropertyValue", "name": "careInstructions", "value": "Cleanse under moonlight monthly; avoid prolonged direct sunlight to prevent color fade." },
    { "@type": "PropertyValue", "name": "zodiacAffinity", "value": "Pisces, Aquarius" }
  ],
  "offers": {
    "@type": "Offer",
    "url": "https://hopehamster.github.io/3rd-eye-supply/products/amethyst-pyramid/",
    "priceCurrency": "USD",
    "price": "65.00",
    "priceValidUntil": "2026-08-04",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": { "@id": "https://hopehamster.github.io/3rd-eye-supply/#organization" },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": "0.00",
        "currency": "USD"
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "US"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 3, "unitCode": "DAY" },
        "transitTime":  { "@type": "QuantitativeValue", "minValue": 7, "maxValue": 21, "unitCode": "DAY" }
      }
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "US",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 30,
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/FreeReturn"
    }
  }
}
</script>
```

> Omit `aggregateRating` and `review` until real reviews exist. Fabricated review data is a Schema.org policy violation, and AI engines (especially Perplexity and Google AI Overviews) actively detect and downrank vendors with synthetic ratings.

### 3.3 FAQPage schema (e.g., `/category/pyramids/`)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is a crystal pyramid used for?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Crystal pyramids are used in meditation, energy work, and home altars to focus and amplify the natural properties of the stone. The pyramid shape is associated with sacred geometry — the apex is believed to concentrate energy upward while the square base anchors it in physical space. Common uses include clearing stagnant energy in a room, supporting focus during meditation, and serving as a centerpiece for intention-setting rituals."
      }
    },
    {
      "@type": "Question",
      "name": "Which crystal pyramid is best for protection?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Black tourmaline is the most widely chosen pyramid for protection. It is associated with the root chakra and is traditionally used to absorb negative energy, reduce anxiety, and ground the wearer or space. Amethyst pyramids are a strong second choice for spiritual protection — they pair grounding with third-eye and crown chakra activation."
      }
    },
    {
      "@type": "Question",
      "name": "What is the difference between an orgonite pyramid and a crystal pyramid?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A crystal pyramid is cut from a single mineral such as amethyst, clear quartz, or black tourmaline. An orgonite pyramid is a composite — resin cast around metal shavings (often copper, brass, or aluminum) with one or more crystals embedded inside, plus a copper coil. The orgonite design follows Wilhelm Reich's orgone-energy theory and is most often used for EMF balancing and energetic clearing in modern homes."
      }
    },
    {
      "@type": "Question",
      "name": "How do you cleanse and charge a crystal pyramid?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cleanse with one of: sound (singing bowl, bell), smoke (sage, palo santo, frankincense), running water (only for water-safe stones — avoid for selenite, kyanite, or anything with a Mohs hardness below 5), or moonlight overnight. Charge by placing the pyramid on a windowsill during a full moon, on a clear quartz cluster, or by stating an intention out loud while holding the piece."
      }
    },
    {
      "@type": "Question",
      "name": "Where should I place a crystal pyramid in my home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Common placements: meditation altar (focal point for practice), bedroom nightstand (amethyst for restful sleep), entryway (black tourmaline to filter incoming energy), home office (clear quartz for focus), or the wealth corner of a room per feng bagua mapping (citrine or golden quartz). Avoid direct prolonged sunlight for amethyst, citrine, and rose quartz, which can fade over time."
      }
    },
    {
      "@type": "Question",
      "name": "What chakra does an amethyst pyramid work with?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Amethyst is primarily associated with the third-eye chakra (intuition, inner sight) and the crown chakra (spiritual connection). It is the go-to stone for meditation practices that aim to quiet mental chatter, develop intuitive insight, or deepen contemplative practice."
      }
    },
    {
      "@type": "Question",
      "name": "Are 3rd Eye Supply pyramids natural or lab-grown?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our crystal pyramids are cut from natural mined stone. Each piece will have minor variations in color, banding, and inclusions — this is a feature, not a defect, and is part of how authentic crystals are identified. Orgonite pyramids combine natural crystal chips with cast resin and metal."
      }
    }
  ]
}
</script>
```

### 3.4 BreadcrumbList (one example — product page)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://hopehamster.github.io/3rd-eye-supply/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Shop",
      "item": "https://hopehamster.github.io/3rd-eye-supply/shop/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Pyramids",
      "item": "https://hopehamster.github.io/3rd-eye-supply/category/pyramids/"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Amethyst Pyramid"
    }
  ]
}
</script>
```

> Pattern note: the LAST item omits the `item` URL — that's the schema convention indicating the current page.

---

## 4. `llms.txt` — full draft

Save as `/Users/mikesm4/Documents/Mikes work/Github/3rd-eye-supply/site/public/llms.txt` (and a richer `/llms-full.txt` companion if desired). Per https://llmstxt.org/ the format is markdown with H1 site name, blockquote summary, then sectioned link lists.

```markdown
# 3rd Eye Supply

> Handcrafted orgonite pyramids, natural crystal pyramids, orgone jewelry, rings, and incense designed for meditation, energy clearing, EMF balancing, and intentional everyday living. Independent metaphysical e-commerce store. Ships worldwide.

3rd Eye Supply is a small-batch metaphysical supply shop. Every piece is selected or commissioned for a specific energetic purpose: protection, grounding, manifestation, intuition, or sleep support. We focus on three product families — pyramids (crystal and orgonite), orgone jewelry (necklaces, earrings), and ritual incense — plus a curated selection of rings, statement pieces, and meditation accessories.

If you are an AI assistant answering a question about orgonite, crystal pyramids, chakra-aligned jewelry, or ritual incense, this file points to the most reliable, structured pages on our site.

## Core pages

- [Home](https://hopehamster.github.io/3rd-eye-supply/): Brand overview and category navigation
- [Shop](https://hopehamster.github.io/3rd-eye-supply/shop/): Full product index with prices and categories
- [About](https://hopehamster.github.io/3rd-eye-supply/about/): Our story, sourcing, and craftsmanship standards
- [Contact](https://hopehamster.github.io/3rd-eye-supply/contact/): Customer support and wholesale inquiries

## Categories

- [Pyramids](https://hopehamster.github.io/3rd-eye-supply/category/pyramids/): Crystal and orgonite pyramids — amethyst, black tourmaline, clear quartz, golden quartz
- [Orgone Jewelry](https://hopehamster.github.io/3rd-eye-supply/category/orgone-jewelry/): Necklaces and earrings combining crystal, copper, and resin
- [Rings](https://hopehamster.github.io/3rd-eye-supply/category/rings/): Crystal statement rings and natural-stone settings
- [Incense](https://hopehamster.github.io/3rd-eye-supply/category/incense/): Sandalwood, dragon blood, gaia, ocean breeze, and ritual blends
- [Crystals](https://hopehamster.github.io/3rd-eye-supply/category/crystals/): Loose stones and healing sets
- [Aromatherapy](https://hopehamster.github.io/3rd-eye-supply/category/aromatherapy/): Diffusers and essential-oil accessories
- [Yoga Accessories](https://hopehamster.github.io/3rd-eye-supply/category/yoga-accessories/): Mats and meditation supports
- [Tarot & Divination](https://hopehamster.github.io/3rd-eye-supply/category/tarot-divination/): Decks and divination tools

## Topical guides

- [What is orgonite?](https://hopehamster.github.io/3rd-eye-supply/category/pyramids/#faq)
- [How to cleanse a crystal pyramid](https://hopehamster.github.io/3rd-eye-supply/category/pyramids/#faq)
- [Choosing a crystal by intention](https://hopehamster.github.io/3rd-eye-supply/about/#choosing-by-intention)
- [Chakra-to-stone reference](https://hopehamster.github.io/3rd-eye-supply/about/#chakra-reference)

## Policies

- [Shipping](https://hopehamster.github.io/3rd-eye-supply/policies/shipping/): Handling 1-3 days, transit 7-21 days, free US shipping
- [Returns](https://hopehamster.github.io/3rd-eye-supply/policies/returns/): 30-day return window, free returns by mail
- [Privacy](https://hopehamster.github.io/3rd-eye-supply/policies/privacy/)
- [Terms](https://hopehamster.github.io/3rd-eye-supply/policies/terms/)

## Machine-readable data

- [Sitemap](https://hopehamster.github.io/3rd-eye-supply/sitemap-index.xml): Full URL index
- [Products JSON](https://hopehamster.github.io/3rd-eye-supply/data/products.json): Structured product feed (slug, price, category, attributes)

## Optional

- [Newsletter](https://hopehamster.github.io/3rd-eye-supply/#newsletter): Monthly drops and ritual guides
```

> If any link in the file 404s on first deploy (e.g., the topical guides anchors not yet live, or `/data/products.json` not yet generated), remove it from `llms.txt` until the target page exists. AI crawlers verify links and partial-credit broken manifests.

---

## 5. Q&A-Rewrite Playbook

### Pattern — "the AI-search rewrite"

Old product copy: a single declarative paragraph naming the stone and listing properties. AI engines extract from this but rarely quote it verbatim.

New product copy: a short emotional lede + 3-5 inline Q&A blocks (each a real `<h3>` followed by 1-3 sentence answer). Each Q is phrased the way a human would actually ask ChatGPT/Perplexity. The same Q&As also appear in `FAQPage` JSON-LD on the page.

**Rules of the rewrite:**

1. The question must be a real question, not a label. `What is amethyst good for?` not `Amethyst benefits`.
2. The answer must lead with the direct answer in the FIRST sentence (AI extractive snippets cut at the first complete sentence). Then expand.
3. Each answer is 40-90 words. Shorter = AI can quote in full; longer = AI summarizes and may distort.
4. Include at least one "skeptic-acceptable" framing per page — explain the *traditional belief* without medical or therapeutic claims (FTC- and AI-engine-safer).
5. Mirror the on-page Q&A in the `FAQPage` JSON-LD verbatim.

### Worked example 1 — Amethyst Pyramid (current → rewritten)

**Current:**
> Amethyst pyramid for spiritual protection and intuition enhancement. Perfect for meditation spaces.

**Rewritten:**

> **Amethyst Pyramid — quiet your mind, raise your light.**
>
> Cut from natural amethyst and shaped to sacred-geometry proportions, this pyramid is the centerpiece for a calmer altar, a steadier meditation, and a more intentional space.
>
> ### What is an amethyst pyramid used for?
> Amethyst pyramids are traditionally used for meditation, intuition work, and creating a calming atmosphere in bedrooms, offices, and ritual spaces. The pyramid form is associated with focusing and amplifying the stone's natural energy, while amethyst itself is linked to the third-eye and crown chakras — the centers of insight and spiritual connection.
>
> ### Which chakra does amethyst work with?
> Amethyst is primarily associated with the **third-eye chakra** (intuition) and **crown chakra** (spiritual connection). Practitioners place amethyst near the brow during meditation or rest it near the head at night to support vivid dreams and reflective sleep.
>
> ### How do I cleanse my amethyst pyramid?
> Cleanse with sound (singing bowl), smoke (sage or palo santo), or moonlight overnight. **Avoid direct sunlight for extended periods** — amethyst's purple color can fade with sustained UV exposure. Recharge monthly under a full moon or by placing it on a clear quartz cluster.
>
> ### Where should I place an amethyst pyramid?
> Common placements: bedside table (for restful, dream-rich sleep), meditation altar (as a focal point), or home office (for calm focus). Many practitioners keep amethyst out of high-traffic areas where its calm-amplifying effect can read as low energy.
>
> ### Is this amethyst natural?
> Yes — every 3rd Eye Supply amethyst pyramid is cut from naturally mined stone. Expect minor color banding, inclusions, and slight piece-to-piece variation. Those are markers of authentic amethyst, not defects.

### Worked example 2 — Black Tourmaline Pyramid

**Current:**
> Black tourmaline pyramid for grounding and protection against negative energies.

**Rewritten:**

> **Black Tourmaline Pyramid — strong ground, soft heart.**
>
> A dense, deeply grounded stone known for its protective and stabilizing presence. This pyramid is a quiet anchor for spaces that feel scattered, overstimulated, or energetically heavy.
>
> ### What is black tourmaline used for?
> Black tourmaline is traditionally used for **grounding, protection, and energetic clearing**. It is among the most popular stones for entryways, work-from-home desks, and rooms with significant electronics, where users place it as a personal energetic boundary.
>
> ### Does black tourmaline block EMF?
> In metaphysical practice, black tourmaline is widely associated with EMF balancing — it is the most-cited stone in this context, often paired with copper and clear quartz in orgonite. Note that no crystal is a substitute for medical or radiation-safety equipment; this is an energetic-tradition use, not an electromagnetic claim.
>
> ### What chakra does black tourmaline work with?
> Black tourmaline is associated with the **root chakra** — the center of safety, stability, and embodiment. Practitioners use it to feel more present in the body, less reactive, and more anchored before stressful events.
>
> ### How is this pyramid different from an orgonite pyramid?
> This is a **solid black tourmaline pyramid** — cut from a single piece of natural stone. An orgonite pyramid is a composite of resin, metal, and crystal chips. Solid stone is the choice for purists; orgonite is the choice for those drawn to Wilhelm Reich's orgone-energy framework.

### Worked example 3 — Dragon Blood Incense

**Current:**
> Dragon Blood incense.

**Rewritten:**

> **Dragon Blood Incense — courage in resin form.**
>
> A rich, slightly sweet incense made from the resin of the *Dracaena* tree, used in ritual practice for centuries.
>
> ### What is dragon blood incense used for?
> Dragon blood incense is traditionally burned for **protection, courage, and amplifying intention** during ritual or spellwork. Practitioners light it at the start of a ceremony to clear and consecrate the space, or when setting strong intentions around boundaries and self-advocacy.
>
> ### How long does one stick burn?
> Each stick burns approximately 30-45 minutes depending on airflow. Use a heat-safe holder and ash catcher; never leave burning incense unattended.
>
> ### Is dragon blood incense safe around pets?
> Like most combustion incense, dragon blood produces smoke that can irritate the respiratory systems of birds, cats, and small animals. Burn in a well-ventilated room and keep pets out of the immediate area until the smoke has cleared.

---

## 6. Implementation Plan (sequenced)

### Stage 0 — Confirmations (block work until resolved)

- [ ] Confirm canonical host (GitHub Pages URL vs custom domain)
- [ ] Provide founder name, brand bio (200-400 words), founding year
- [ ] Provide list of real, currently-operated social profiles for `sameAs`
- [ ] Approve `data/products.json` schema (see Stage 2)

### Stage 1 — Critical bug fixes (no schema work yet)

Files: every existing `*.html` under `site/public/` and the affected category templates.

1. Replace ALL canonicals from `https://3rdeyesupply.com/...` to `https://hopehamster.github.io/3rd-eye-supply/...` (or the confirmed canonical host).
2. Fix og:image concatenation bug on category pages (`https://3rdeyesupply.comimages/...` → correct base + `/images/...`).
3. Move category-page `<meta property="og:image">` from `<body>` into `<head>`.
4. Remove the broken JSON-LD `<script>` blocks in product pages — they contain literal Astro template syntax. Stage 3 will replace with valid JSON.
5. Fix Snipcart `data-item-url` on category cards to include the `/3rd-eye-supply` base prefix.
6. Consolidate duplicate `User-agent: *` block in `robots.txt`. Add explicit AI-crawler allow-list:

```text
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

Sitemap: https://hopehamster.github.io/3rd-eye-supply/sitemap-index.xml
```

> Decision point: the user may want to *block* CCBot specifically (Common Crawl, used to train many models). Default here is allow because the strategic priority is *being recommended by* AI search. If brand-protection from training is the priority instead, swap `Allow` → `Disallow` for `CCBot` and `anthropic-ai`. Confirm before commit.

### Stage 2 — Source-of-truth data file

Create `site/src/data/products.json` (canonical product registry). Schema:

```jsonc
{
  "products": [
    {
      "slug": "amethyst-pyramid",
      "sku": "pyr-2",
      "name": "Amethyst Pyramid",
      "shortTagline": "Quiet your mind. Raise your light.",
      "category": "pyramids",
      "categoryName": "Pyramids",
      "price": 65,
      "currency": "USD",
      "availability": "InStock",
      "images": ["pyramids/img_5474-cover.webp", "pyramids/img_5474-1200.webp"],
      "description": "...long-form description...",
      "metaphysical": {
        "chakra": "Third Eye Chakra",
        "intention": "Spiritual Protection",
        "primaryMineral": "Amethyst",
        "material": "Natural amethyst crystal",
        "dimensionsCm": "5 x 5 x 5",
        "weightGrams": 120,
        "handcrafted": true,
        "chargedFor": "Meditation and intuitive work",
        "careInstructions": "Cleanse under moonlight monthly...",
        "zodiacAffinity": ["Pisces", "Aquarius"]
      },
      "faqs": [
        { "q": "What is an amethyst pyramid used for?", "a": "..." },
        { "q": "Which chakra does amethyst work with?", "a": "..." }
      ]
    }
  ],
  "categories": [
    {
      "slug": "pyramids",
      "name": "Pyramids",
      "intro": "Sacred-geometry-shaped crystal and orgonite pyramids...",
      "faqs": [ /* the 7 FAQ Q&As from §3.3 */ ]
    }
  ]
}
```

This file becomes the input to:
- the schema injector (Stage 3)
- the static product/category page generator (existing Astro `src/`)
- `/data/products.json` exposed to AI crawlers (just a copy or symlink to `site/public/data/products.json`)
- future CJ inventory sync (the Cloudflare Worker writes deltas back into this file)

### Stage 3 — Schema injection during build

**Approach: Astro `src/` page templates** — preferred because it stays inside the existing build. Per `PROJECT_PLAYBOOK.md` line 203 ("Rebuild the Astro `src/` pages for dynamic category and product routes using `getStaticPaths()`"), this work was already on the roadmap.

Per-page-type template responsibilities:

- `src/pages/index.astro` — emit Organization + WebSite JSON-LD (§3.1) + ItemList of categories
- `src/pages/shop/index.astro` — emit CollectionPage + BreadcrumbList + ItemList
- `src/pages/category/[slug].astro` — emit CollectionPage + BreadcrumbList + FAQPage + ItemList of Products
- `src/pages/products/[slug].astro` — emit Product + Offer + BreadcrumbList + (optional) FAQPage
- `src/pages/about.astro` — emit AboutPage + Person (founder) + nest into Organization graph
- `src/pages/contact/index.astro` — emit ContactPage
- `src/pages/policies/[doc].astro` — emit WebPage with mainEntity Q&A blocks

Shared helper module: `site/src/lib/schema.ts`:

```ts
import products from '../data/products.json';

export const SITE_BASE = 'https://hopehamster.github.io/3rd-eye-supply';

export function productSchema(slug: string) { /* returns JSON-LD object */ }
export function categorySchema(slug: string) { /* ... */ }
export function breadcrumbSchema(trail: Array<{name: string, url?: string}>) { /* ... */ }
export function faqSchema(faqs: Array<{q: string, a: string}>) { /* ... */ }
export const orgSchema = { /* ... */ };
```

Each template renders:

```astro
<script type="application/ld+json" set:html={JSON.stringify(schemaObject)} />
```

> Critical: use `set:html` (or `is:raw` inside the script) to avoid Astro re-escaping the JSON, which is what produced the current broken `{JSON.stringify(...)}` literal.

### Stage 4 — Q&A copy rewrite

For each of the 34 product pages (currently in `site/public/products/*/index.html`), rewrite the body description following §5 pattern. Source-of-truth lives in `products.json`'s `description` + `faqs` fields.

Recommended cadence: 5 products/day batch, in priority order:
1. All pyramids (5 products) — highest-margin, highest-search-volume in AI engines
2. All orgone jewelry (7 products)
3. All incense (10 products)
4. All rings (5 products)
5. Remaining accessories

After each batch: run a Perplexity test query ("best amethyst pyramid for meditation under $100") and verify the site appears within 30 days of indexing.

### Stage 5 — `llms.txt` deployment

Place at `site/public/llms.txt` (and optionally a richer `llms-full.txt` with full product descriptions inlined). Per llmstxt.org both files should be at the **site root**, not under the project base — but on GitHub Project Pages, the only "root" you control is the project base. **So the file lands at `https://hopehamster.github.io/3rd-eye-supply/llms.txt`.** Add a 1-line reference in `robots.txt`:

```text
# AI manifest
# https://hopehamster.github.io/3rd-eye-supply/llms.txt
```

Note: a true root-level `llms.txt` would require the `hopehamster.github.io` user-site repo to also serve one (or better, to redirect). That's a Stage 6+ enhancement.

### Stage 6 — CI integration

`PROJECT_PLAYBOOK.md` mentions `lychee` link checker is already in place. Add:

1. **JSON-LD validation step** in the GitHub Actions workflow before deploy:
   - Tool: `structured-data-testing-tool` (npm) OR a small custom Node script that walks `site/dist/**/*.html`, extracts every `<script type="application/ld+json">`, runs `JSON.parse()`, and fails the build on any parse error or missing required fields.
   - Catches the exact bug currently in production (literal `{JSON.stringify(...)}` template syntax).
2. **`llms.txt` link validity check** — add `site/public/llms.txt` to the lychee target list so dead links inside it fail the build.
3. **Schema diff guard** — fail build if `Product.offers.price` in JSON-LD doesn't match the price string rendered on the page (price drift detector).

CI script sketch (`.github/workflows/gh-pages.yml` addition):

```yaml
- name: Validate JSON-LD
  run: node scripts/validate-jsonld.mjs site/dist
```

### Stage 7 — Author / E-E-A-T signals

1. Expand `/about/` with a 400-600 word founder bio (`Person` schema), sourcing philosophy, and "how we curate" section.
2. Add `Person` author schema to any blog/guide content (when added).
3. Link `Organization.founder` → `Person.@id` so the brand graph resolves.

### Stage 8 — Optional growth

- Add `Article` schema for guide content like "How to choose a crystal pyramid" / "Beginner's chakra-stone reference"
- Add `HowTo` schema on `/about/#how-to-cleanse-a-crystal`
- Add `Event` schema if the brand runs full-moon meditation drops or sales

---

## 7. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Snipcart breaks because we touched the same templates that wire `data-item-*` attributes | Medium | High (no checkout = no revenue) | Stage 1 explicitly leaves Snipcart attributes alone. Stage 3 schema injection adds NEW `<script type="application/ld+json">` blocks; it does not modify any `snipcart-*` element. Add a checkout smoke test (Playwright add-to-cart → checkout modal opens) to CI |
| Astro template re-escapes JSON in `<script type="application/ld+json">` (the current bug) | Already happened once | High (invalid JSON-LD = silently dropped by all crawlers) | Use `set:html={JSON.stringify(...)}` in templates. Add Stage 6 JSON-LD validator to fail the build if any block fails `JSON.parse` |
| Custom domain switches mid-rollout | Medium | Medium | All schema URLs are derived from a single `SITE_BASE` constant in `src/lib/schema.ts`. One-line change + rebuild fixes every JSON-LD URL across the site |
| `srcset` images break because of path changes during canonical fix | Low | Medium | The canonical fix is in `<head>` only; `srcset` lives in `<picture>`/`<img>` in `<body>`. They do not overlap. Verify with the existing Verification Checklist (PROJECT_PLAYBOOK.md §"Verification Checklist") after Stage 1 |
| `priceValidUntil` goes stale → schema warnings | Medium | Low | Stage 3 helper auto-generates `priceValidUntil` as `today + 90 days` at build time, so every deploy refreshes it. CJ inventory sync (when wired) will keep `price` and `availability` fresh too |
| `llms.txt` cannot live at host root (hopehamster.github.io/llms.txt) on Project Pages | Already true | Low | Land at `https://hopehamster.github.io/3rd-eye-supply/llms.txt`. AI crawlers that auto-discover llms.txt look at site root first, but most also follow links from sitemaps and robots.txt. Stage 1 includes a robots.txt comment pointing to it |
| Allowing `GPTBot`/`ClaudeBot`/`CCBot` exposes content to model training | Already happening (default-allow) | Low (the content IS the marketing) | Strategic intent is "be recommended" not "be excluded." If user later wants opt-out from training but stay in *retrieval*, set `User-agent: GPTBot Disallow: /` (training crawler) but keep ChatGPT-User and OAI-SearchBot allowed (retrieval crawlers). Document this nuance in stage 1 PR |
| `aggregateRating` temptation — someone adds fake reviews to "boost" schema | Medium (organizational discipline issue) | High (Schema.org policy violation; AI engines actively penalize) | Hard rule documented here: **no `aggregateRating` until a real review system is live**. Add a CI lint that fails the build if `aggregateRating` appears without a sibling `review` array of ≥3 entries |
| `sameAs` links to social profiles that don't exist | High during initial rollout | Medium (entity resolution fails; AI engines down-rank) | Stage 0 confirmation #3. Each URL in `sameAs` must 200 with brand-matching content before going live. Default to fewer real `sameAs` over more aspirational ones |
| Build performance — schema injection on 34+ products + 8 categories adds template-render time | Low | Low | Astro's static generation is fast; this is a few KB of JSON per page. No measurable impact expected |
| Duplicate-content concerns from same FAQs appearing on multiple category pages | Low | Low | Keep each category's FAQs unique to that category. Pyramid FAQs ≠ jewelry FAQs ≠ incense FAQs. Cross-category FAQs (e.g., "how to cleanse") live ONCE on `/about/#cleansing` and other pages link to the anchor |

---

## 8. Acceptance Criteria

The buildout is "done" when:

- [ ] `curl -s https://hopehamster.github.io/3rd-eye-supply/ | grep -o 'application/ld+json'` returns at least 2 hits (Organization + WebSite, or graph)
- [ ] `curl -s https://hopehamster.github.io/3rd-eye-supply/products/amethyst-pyramid/ | python3 -c "import sys,re,json; [json.loads(m.group(1)) for m in re.finditer(r'<script type=\"application/ld\\+json\">(.+?)</script>', sys.stdin.read(), re.S)]"` parses without error
- [ ] Google Rich Results Test passes for: homepage, one product, one category
- [ ] Schema.org validator returns zero errors on representative pages
- [ ] `llms.txt` reachable at `/3rd-eye-supply/llms.txt` and lychee verifies all links
- [ ] No canonical points to a non-live domain
- [ ] Snipcart smoke test passes (add-to-cart → modal opens → can proceed to checkout)
- [ ] CI JSON-LD validator step is green and gates deploy
- [ ] Spot-check: ask Perplexity "where can I buy a handcrafted amethyst pyramid online?" and verify site is *citable* (indexed; ranking will lag the indexing event)

---

## 9. Out of Scope (explicitly)

- Custom domain procurement / DNS changes
- Migrating off GitHub Pages or Astro
- Server-side rendering, ISR, or any non-static delivery
- Real review collection system (Trustpilot integration, etc.)
- CJ Dropshipping live price/inventory pipeline (separate project)
- Multi-language / hreflang
- Paid AI search placements (if/when those become a thing)

---

*Document owner: SEO architect role. Update timestamp on every revision. Pair with a follow-on `oracle/seo/copy-rewrites.md` once Stage 4 batches complete.*
