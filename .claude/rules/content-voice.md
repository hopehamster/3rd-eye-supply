---
name: content-voice
description: Metaphysical brand voice guardrails for product copy, alt text, Oracle responses, and meta descriptions
---

# 3rd Eye Supply — Brand Voice

The store sells metaphysical/spiritual goods (incense, crystals, candles, ritual tools). The voice is what differentiates it from generic e-commerce: warm, grounded, never dismissive of the customer's intention. Apply to ALL user-facing copy — product descriptions, alt text, meta tags, Oracle responses, error pages, 404 text.

## The Three Polarities (always pick the right side)

| Avoid | Prefer |
|---|---|
| Glib / ironic / wink-at-the-audience | Earnest, takes the practice seriously |
| Mystical-jargon overload ("vibrational frequencies activate your third eye") | Concrete sensory + traditional use ("smoldering palo santo, cedar-sweet smoke, used at the start of a quiet morning") |
| Therapeutic / medical claims ("cures anxiety") | Experiential framing ("a small ritual to mark a transition") |
| Performative diversity / generic spirituality | Respectful naming of traditions where known + sourced |

## Voice Calibration — Three Bands

The Oracle persona (chatbot) is the warmest. Product copy sits in the middle. Legal/checkout copy is plain. Don't muddle the bands.

**Band 1 — Oracle (warmest, most personal)**
> "Palo santo carries a long history in Andean ceremony — it isn't 'a candle scent.' If you're drawn to it, the practice usually starts simply: a window cracked, a few minutes of stillness, the smoke moving across the room."

**Band 2 — Product description (clear, evocative, no second-person therapy)**
> "Sustainably harvested palo santo sticks from Peru. Each bundle includes 4 sticks of heartwood, hand-selected for resin density. Burn briefly — the wood is meant to smolder, not sustain a flame."

**Band 3 — Operational (plain, no voice at all)**
> "Add to cart. Shipping calculated at checkout."

## Hard "Don't" List

- ❌ "Manifest your dreams" / "manifest abundance" — overused, devalues the products that are aimed at customers with serious practice.
- ❌ Astrology product claims ("Pisces moon energy") — astrology services have been removed from the catalog (see commits `2bad484`, `05fd06a`). Don't reintroduce them in copy.
- ❌ Tarot / reiki product claims — same removal applies. Selling associated tools is fine; making service claims is not.
- ❌ Health claims of any kind. "Heals", "treats", "remedies" → replace with "traditionally used for", "associated with", "in [tradition]".
- ❌ Vague spiritual flattery directed at the user ("you're on a beautiful journey"). Address what they came to do, not who they are.
- ❌ Trademarked phrases from other brands (Goop, Anthropologie, etc.).
- ❌ Borrowed cultural specificity without sourcing. If you reference a tradition (Andean palo santo, Tibetan singing bowls, Native American smudging), name it accurately and source the material ethically — and say so in copy.

## Hard "Do" List

- ✅ Sensory grounding. "Smoke that hangs low in the room and clears slowly" beats "energy-cleansing."
- ✅ Provenance. Where the material is from, who harvested it, what it was traditionally used for.
- ✅ Practical setup. How to actually use the item — a ceramic dish, a window cracked, three minutes.
- ✅ Plain ritual language. "Light it, set it down, let it burn" is better than esoteric instruction.

## Alt Text Voice

`alt` attributes get a special carveout — they're for screen readers + SEO, not poetic writing. Be DESCRIPTIVE not evocative:

- ❌ `alt="The sacred smoke of palo santo carrying intention to the heavens"`
- ✅ `alt="Smoldering palo santo stick on a black ceramic dish"`

Length: aim for 8-15 words. Describe what's IN the image, not what it means.

## Meta Descriptions

160 characters. Lead with the product type + key sensory or provenance detail. End with use case if room.

- ✅ `Sustainably harvested Peruvian palo santo sticks. Cedar-sweet smoke, traditionally burned at the start of a quiet morning. Bundle of 4.` (135 chars)

## Error / 404 Copy

Plain, no extended metaphor. The user is trying to find something — don't make them parse a koan.

- ✅ "We couldn't find that page. Try the shop or the search bar above."
- ❌ "The path you sought is shrouded in mist..."

## Oracle Persona Cross-Reference

The Oracle is the warmest expression of this voice. The canonical persona is [oracle/persona/oracle-dna.md](../../oracle/persona/oracle-dna.md) — every rule above applies, plus the additional persona-specific constraints in that file (low warm cadence, never-recommend-without-asking, etc.). The 5-question test set at the bottom of `oracle-dna.md` validates the voice — run it after ANY persona edit.

## Symptom Positioning (cross-ref Martins)

When writing problem-aware copy (Stage 2 awareness — customer knows there's a problem but not the category of solution), use the symptom-positioning template from [copywriting-direct-response-canon.md](~/.claude/rules/copywriting-direct-response-canon.md):

> If [specific symptom], and [second symptom nobody admits], you're not [wrong self-diagnosis]. You're [real diagnosis — which the product addresses].

Example:
> "If the apartment feels stale every Sunday, and you've tried three different scented candles that didn't help — you're not a perfectionist about smell. You're trying to mark a transition that needs a different kind of cue."

This pattern fits cold-traffic ads better than product page copy. Use it sparingly.

## When in Doubt

Read three actual product descriptions from the live site before writing new ones. Match the rhythm. Match the register. Don't accidentally drift into either ironic-detachment or therapeutic-claim mode.
