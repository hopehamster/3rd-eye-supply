---
description: Run the full pre-deploy verification suite (site + Oracle worker) before pushing or running wrangler deploy.
---

Run the deploy-readiness suite for 3rd Eye Supply. Do these in this order:

1. **Spawn the `pre-deploy-verifier` agent** with fresh context. Pass it: "Verify the current branch is safe to push to main. Report pass/fail with specific file:line references for any issues."

2. **If site changes touch [oracle/](../../oracle/), also spawn the `oracle-qa-reviewer` agent** in parallel with: "Review the current Oracle worker + persona for the 5-point audit. Report pass/fail."

3. **Wait for both verdicts.** Do NOT auto-fix issues. Surface them to me with the agents' raw reports.

4. **If both PASS**: report the green-light status, summarize what was checked, and list the deploy commands I should run (in order: `git push origin <branch>` for site, then `cd oracle/worker && wrangler deploy --dry-run && wrangler deploy` for the worker IF site CI passed first).

5. **If either FAIL**: stop. Show me the blocking issues. Do not proceed.

This command exists because the project has known landmines (base path 404s, missing `.nojekyll`, committed secrets, Cloudflare zone-routing mismatches). Two fresh-context agents reviewing in parallel is the Two-Agent Rule applied to deploy gating.
