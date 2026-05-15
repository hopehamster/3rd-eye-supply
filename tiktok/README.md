# 3rd Eye Supply — TikTok Operator Workspace

Welcome. This folder is your home base. You're running the TikTok Shop for 3rd Eye Supply from your machine, while Mike handles the website, inventory, and fulfillment from his. You don't need to touch any of the website code — everything you need lives in this folder.

## What this business is

3rd Eye Supply sells metaphysical / spiritual goods online: incense, crystals, pyramids, orgone jewelry, rings, and a few accessories. The site is [3rdeyesupply.com](https://3rdeyesupply.com). Mike (owner, 702 AI Services) runs the website and ships orders. You run TikTok Shop — videos and LIVE selling.

3rd Eye Supply is an approved TikTok Shop seller. You operate the seller account directly — no third-party affiliates. Your primary mechanic is the in-video product tag (and the LIVE-session product card). Viewers tap a product, check out in-app, never leave TikTok.

**The centerpiece of your strategy is LIVE selling** — 2 sessions per week (Tuesday 8pm and Saturday 11am), 90 minutes each. Regular videos between LIVES feed the algorithm and warm the audience. Spiritual goods sell exceptionally well in LIVE format.

## What's in here

- **[product-catalog.md](product-catalog.md)** — every product with price, image, hook angles, and what NOT to say. Start here.
- **[content-system/](content-system/)** — the templates for regular video content.
  - [hook-templates.md](content-system/hook-templates.md) — 5 proven hook structures for spiritual products
  - [video-structures.md](content-system/video-structures.md) — 5 video frame templates
  - [caption-formulas.md](content-system/caption-formulas.md) — caption + CTA patterns
  - [hashtag-bundles.md](content-system/hashtag-bundles.md) — per-category hashtag bundles
- **[policies/](policies/)** — what you can say, what will get the Shop suspended.
  - [tiktok-shop-compliance.md](policies/tiktok-shop-compliance.md) — **read first** — Shop-side compliance + Seller Health Score
  - [voice-and-claims.md](policies/voice-and-claims.md) — never-say / always-say lists
  - [tiktok-policy-guardrails.md](policies/tiktok-policy-guardrails.md) — regular TikTok content rules
  - [ftc-disclosure-rules.md](policies/ftc-disclosure-rules.md) — owner-operator FTC posture (simpler than affiliate)
- **[workflow/](workflow/)** — how to actually do the work.
  - [seller-account-setup.md](workflow/seller-account-setup.md) — **start here** — getting access from Mike, what you control vs. what he does
  - [live-selling.md](workflow/live-selling.md) — the LIVE playbook (your centerpiece)
  - [daily-rhythm.md](workflow/daily-rhythm.md) — LIVE-centered weekly cadence
  - [batching-system.md](workflow/batching-system.md) — film 8-12 videos in one session
  - [analytics-review.md](workflow/analytics-review.md) — Friday weekly review
- **[scripts/regenerate-catalog.sh](scripts/regenerate-catalog.sh)** — refreshes `product-catalog.md` if Mike adds new SKUs.

## If you use Claude Code

The repo has a `.claude/` folder with TikTok-specific helpers:

- **`/tiktok-script <product-slug>`** — generates a 30-60s TikTok script for a product, voice-checked and policy-audited.
- **`/tiktok-audit <draft>`** — reviews a script draft for compliance issues before you film.

You can also call the agents directly:
- `tiktok-content-coach` — brainstorm hooks, angles, story ideas for a product
- `tiktok-claim-auditor` — second pair of eyes on any draft

Not required — the human workflow stands alone. But if you're prepping a busy LIVE schedule, the agents save time.

## Critical rules (read once, remember forever)

1. **NEVER claim a product cures, heals, treats, or prevents anything.** Health claims will pull videos, suppress the account, and can trigger FTC action against the brand. See [policies/voice-and-claims.md](policies/voice-and-claims.md).

2. **NEVER promise manifestation outcomes.** "Manifest your soulmate," "manifest abundance" — these get spiritual sellers banned on TikTok specifically because the platform treats them as outcome guarantees. Use experiential language: "traditionally used for", "a ritual to mark", "associated with".

3. **NEVER go LIVE without checking with Mike first.** TikTok Shop requires shipping within 48 hours of order. A LIVE that pulls 80 orders means Mike's fulfillment side absorbs that spike. 12-24h notice minimum.

4. **NEVER touch the website code in `/site` or `/oracle`.** Those are Mike's surfaces. If you find a broken product link or want to suggest a copy change, message Mike — don't edit.

5. **NEVER post copyrighted music for commercial LIVE/tagged content.** TikTok's Commercial Music Library is your friend. Non-CML music on a Shop-tagged video will mute the moment it crosses ~5K views.

6. **Use TikTok Shop product tags, not bio links, for the primary CTA.** The tag is the conversion mechanic. Bio links are a fallback for content that doesn't feature one specific SKU.

7. **Your bio disclosure does your FTC work.** "Co-owner of 3rd Eye Supply" or "Official TikTok of 3rd Eye Supply" in the bio satisfies FTC. You don't need `#ad` on every post — that's for affiliates, which you aren't.

8. **Coordinate with Mike on promotions.** Don't run a 20% off LIVE flash sale if Mike's running a site-wide 25% off promotion. Margin math gets ugly fast.

## First-week ramp

Don't try to start LIVE selling immediately. Build the rhythm first.

- **Day 1**: read this README, [policies/tiktok-shop-compliance.md](policies/tiktok-shop-compliance.md), [policies/voice-and-claims.md](policies/voice-and-claims.md), and [workflow/seller-account-setup.md](workflow/seller-account-setup.md). Get account access from Mike. Set up bio disclosure.
- **Day 2**: read [product-catalog.md](product-catalog.md). Pick 3 products you personally connect with — you'll be more authentic on camera.
- **Day 3**: read [content-system/hook-templates.md](content-system/hook-templates.md) and [video-structures.md](content-system/video-structures.md). Draft 5-6 hooks for each of your 3 products. Don't film yet.
- **Day 4**: read [workflow/batching-system.md](workflow/batching-system.md). Set up your filming spot. Batch-film 6-8 videos.
- **Day 5**: edit 2-3 of those videos. Post 1 with a product tag. Confirm the tag fires in Seller Center.
- **Day 6-7**: post 1-2 more videos per day. Get comfortable with the tagging + caption flow.

**Week 2**: read [workflow/live-selling.md](workflow/live-selling.md). Run a single Saturday 11am LIVE — 60 min only, 5-6 products. Tell Mike at least 24h ahead.

**Week 3+**: full schedule per [workflow/daily-rhythm.md](workflow/daily-rhythm.md) — 4-6 regular posts + 2 LIVES per week.

Don't try to compress this. The 48h fulfillment SLA on Mike's side and your own LIVE learning curve compound.

## Your Claude Code config (kept in sync with Mike's machine)

Mike maintains a private GitHub repo (`claude-config`) that mirrors the portable parts of his `~/.claude/` — the global rules, agents, mined book notes, skills, and hooks that Claude reads every session. Your machine should clone that repo so you have the same context Mike does.

**One-time setup** (after Mike's added you to the repo):

```bash
# Replace REPO_URL if Mike uses a different name
bash <(curl -sL https://raw.githubusercontent.com/hopehamster/claude-config/main/sync/setup-new-machine.sh)
```

That script clones to `~/claude-config/`, symlinks the right folders into `~/.claude/`, generates a starter `settings.json` you'll need to fill in (Anthropic API key, MCP auth), and creates an empty `.secrets` file.

**Weekly maintenance** — pull any updates Mike pushed:

```bash
bash ~/claude-config/sync/pull.sh
```

This is how you get any new rules / agents / mined book notes Mike adds on his side. No restart of Claude Code needed — symlinks make new files immediately available in the next session.

See [~/claude-config/sync/README.md](https://github.com/hopehamster/claude-config) on her machine after setup, or ask Mike for the latest URL.

## Contact

- **Mike** — text/iMessage for daily coordination. Email for non-urgent. Owner of website + fulfillment.
- **Questions about a product** (sourcing, stock, when it ships): Mike.
- **Questions about TikTok content** (hook, caption, draft review): use `/tiktok-audit` if you have Claude Code, or post in your scratch notes for batch review.
- **Customer DMs**: reply from the Brand Account whenever possible. Forward escalations (refund disputes, complaints, fulfillment delays) to Mike same-day.

Good luck. The brand voice is grounded, warm, and takes the practice seriously. Don't go ironic, don't go performative. The audience that buys this stuff is buying intentionally — match their energy.
