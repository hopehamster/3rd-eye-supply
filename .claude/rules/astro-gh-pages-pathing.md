---
name: astro-gh-pages-pathing
description: Path discipline for Astro + GitHub Project Pages — the #1 cause of broken deploys on this site
paths:
  - site/**
  - .github/workflows/**
---

# Astro + GitHub Pages Path Discipline

GitHub Project Pages serves this site at `/3rd-eye-supply/` — NOT at `/`. Every absolute path that doesn't include the base prefix becomes a 404. This file exists because that exact mistake has been made enough times to merit its own rule.

## The Three Path Forms

| Form | Resolves to | When to use |
|---|---|---|
| `/3rd-eye-supply/images/foo.webp` | `hopehamster.github.io/3rd-eye-supply/images/foo.webp` ✅ | Static HTML in `site/public/` |
| `/images/foo.webp` | `hopehamster.github.io/images/foo.webp` ❌ 404 | Never — this is the bug |
| `{import.meta.env.BASE_URL}images/foo.webp` | Resolved by Astro at build time ✅ | `.astro` files preferred |

**Inside `.astro` files** prefer `{import.meta.env.BASE_URL}…` or Astro's `<Image />` so the base is computed, not hard-coded. Inside `site/public/*.html` (static passthrough) hard-code the `/3rd-eye-supply/` prefix.

## `astro.config.mjs` is Load-Bearing

These two values MUST stay in sync with the GitHub Pages URL:

```js
site: 'https://hopehamster.github.io',
base: '/3rd-eye-supply',
```

If `base` ever drifts (e.g. someone removes it for "local dev convenience"), every generated link breaks on the live site. Don't do it.

## `.nojekyll` Is Non-Negotiable

GitHub Pages runs Jekyll by default. Jekyll strips any directory starting with `_`. Astro outputs to `_astro/`. Without `.nojekyll`:

- All CSS 404s.
- All hashed JS chunks 404.
- Site renders unstyled and broken.

Confirm before every deploy:
```bash
test -f .nojekyll && test -f site/dist/.nojekyll && echo "ok" || echo "MISSING .nojekyll"
```

The Astro build automatically copies anything in `site/public/` into `site/dist/`, so keeping `.nojekyll` in `site/public/` is the durable fix.

## Case Sensitivity

GitHub Pages is case-sensitive. Local macOS development is not. This means a link that works locally can 404 in production.

- File on disk: `incense-cover.webp`
- HTML reference: `Incense-Cover.webp` → works locally, 404 in prod.

Always verify with `find site/public/images -name 'PATTERN'` before adding an `<img>` reference. The recent commits `aeb34f7` and `de1c046` were case + variant fixes — don't reintroduce.

## Image srcset Pattern (current convention)

The codebase uses a `-cover.webp` baseline + `-{400,800,1200}w.webp` responsive variants. When a width variant is missing, fall back to the cover — never make up a filename.

```html
<img
  src="/3rd-eye-supply/images/incense/sage-cover.webp"
  srcset="
    /3rd-eye-supply/images/incense/sage-400w.webp 400w,
    /3rd-eye-supply/images/incense/sage-800w.webp 800w,
    /3rd-eye-supply/images/incense/sage-1200w.webp 1200w
  "
  sizes="(max-width: 640px) 100vw, 400px"
  loading="lazy"
  alt="White sage smudge bundle"
/>
```

If only the cover exists, use it for all sources rather than 404-ing the responsive variants.

## Pre-Deploy Verification Checklist

Run BEFORE every push that touches paths:

```bash
# 1. Base path appears in every generated HTML reference
grep -rE 'href="/[^3]' site/dist/ | head           # Should be empty
grep -rE 'src="/[^3]' site/dist/ | head            # Should be empty

# 2. .nojekyll survived the build
test -f site/dist/.nojekyll && echo "ok"

# 3. Astro config still has base + site
grep -E '(base:|site:)' site/astro.config.mjs

# 4. Image references match real files (sample a few)
find site/public/images -name '*.webp' | head -20
```

## When You're About To Edit a Path

Read this checklist first:

1. Does the path start with `/3rd-eye-supply/`? (or use `BASE_URL`)
2. Does the file exist on disk with that EXACT case + spelling?
3. If it's a srcset, do all referenced widths exist? If not, fall back to cover.
4. Are you editing `site/public/` or `site/src/` — NOT `site/dist/`?

If any answer is "no" or "not sure", stop and verify with `find`.

## Cross-references
- [PROJECT_PLAYBOOK.md](../../PROJECT_PLAYBOOK.md) §"Pathing Rules" — the original source for these rules.
- [content-voice.md](content-voice.md) — what to write in those `alt` attributes.
