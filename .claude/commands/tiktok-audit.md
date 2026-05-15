---
description: Audit a TikTok draft (hook + script + caption) for policy + voice issues before filming or posting. Usage: paste the draft after the command.
---

The user has a TikTok draft they want audited before they film or post. Workflow:

1. **Collect the draft.** If the user passed text after the command, use that. Otherwise ask them to paste:
   - The hook (first 1.5-3s line)
   - The script outline OR full transcript
   - The caption (what goes UNDER the video on TikTok)
   - On-screen text (any burned-in captions or overlays)

2. **Spawn the `tiktok-claim-auditor` agent** with fresh context. Pass it the full draft and: "Run your 7-point audit on this draft. Produce verdict + line-by-line flags + recommended rewrite if FAIL."

3. **Show the user the Auditor output verbatim.** Do not summarize it or soften the findings.

4. **If PASS**:
   - Confirm the user has the in-app Branded Content toggle ready to flip before posting.
   - Confirm the caption first line is ≤80 chars and includes `#ad`.
   - Confirm any music is from the Commercial Music Library (if `#ad` post).
   - Green-light for filming/posting.

5. **If FAIL**:
   - List the blocking issues in order.
   - Show the recommended rewrites.
   - Ask the user: "Want me to draft a corrected version using these rewrites?" If yes, spawn the `tiktok-content-coach` agent with the corrections and re-run the audit on the new draft.
   - DO NOT approve the draft just because the user pushes back. Their account is what's at stake.

This command is what protects the partner's TikTok account from policy strikes. A single banned video can suppress an account for weeks. A pattern of banned videos can ban it permanently. 30 seconds of audit beats 6 weeks of recovery.

If the user asks "why is this so strict?":
- Spiritual / metaphysical content sits in the highest-risk niche on TikTok for false-health-claim flags.
- FTC fines for undisclosed paid promotion start at $50K — the BRAND (3rd Eye Supply) is on the hook, which means the partner's affiliate agreement with Mike is at risk too.
- The audit checks against industry-known auto-flag patterns — these are not arbitrary brand rules, they're the patterns that actually get accounts pulled.

If the user keeps asking to override a FAIL: politely refuse, suggest they DM Mike for an explicit owner-level override, and offer the safe rewrite path. Don't approve content you can't defend.
