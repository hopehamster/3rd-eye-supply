---
description: Generate a TikTok script + caption for a 3rd Eye Supply product. Coach drafts, Auditor reviews. Usage: /tiktok-script <product-slug>
---

Generate a TikTok script for the product slug the user passes in. Workflow:

1. **Confirm the product exists.** Read [tiktok/product-catalog.md](../../tiktok/product-catalog.md). If the slug isn't there, list the 3-5 closest matches and ask the user which they meant. Do NOT invent a product.

2. **Spawn the `tiktok-content-coach` agent.** Pass it: "Generate a TikTok script for product slug `<slug>`. Produce hook drafts (3-5 across different categories), recommended structure, full script outline, caption draft, and self-audit per your standard output shape."

3. **Wait for the Coach output.** Show it to the user verbatim.

4. **Spawn the `tiktok-claim-auditor` agent in FRESH context** with: "Audit this TikTok draft for policy + voice issues: <paste the Coach's hook + script outline + caption>. Produce your 7-point audit verdict."

5. **If Auditor returns PASS**: report green light, summarize what was checked, remind the user to flip the in-app Branded Content toggle, and tell them to add the draft to their batch shoot list.

6. **If Auditor returns FAIL**: report the blocking issues, show the recommended rewrite from the Auditor output, and ask the user if they want the Coach to revise. If yes, spawn the Coach again with: "Revise the script for slug `<slug>` — the Auditor flagged: <paste blocking issues>. Apply the recommended rewrites and produce a corrected draft."

7. **Loop until PASS.** Never tell the user "it's probably fine" if the Auditor said FAIL. The Two-Agent Rule is non-negotiable.

This workflow exists because the partner needs an artifact ready to film — but they also need confidence the draft won't get their account banned. The Coach is fast at generating; the Auditor is rigorous at gating. Don't let one do the other's job.

Reminder to the user: this command produces a script, not a finished video. The filming and editing happens in CapCut per [tiktok/workflow/batching-system.md](../../tiktok/workflow/batching-system.md). After filming, the user runs `/tiktok-audit` again against the FINAL caption (which may have changed from the draft) before posting.
