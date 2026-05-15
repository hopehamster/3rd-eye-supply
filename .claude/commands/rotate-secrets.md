---
description: Interactive walkthrough to rotate the secrets currently committed to this repo (gcp-oauth, service account, CJ API key).
---

The repo has known live secrets in tracked files. Walk me through rotation in this order. Do NOT print actual key values back to me — just confirm the action was completed.

## Phase 1 — Inventory

1. Run: `git ls-files | grep -iE '(\.env|oauth|service-account|credentials|secret|key)'` — show me what files exist.
2. Run: `grep -rE 'fec0d4746c244fec9fede00a6b626143' . --include='*.js' --include='*.toml' 2>/dev/null | head` — show me where the CJ key is hard-coded.
3. List all secrets that need rotation based on findings.

## Phase 2 — Rotation (one at a time, with explicit confirmation between each)

For each secret found, ask me to:
1. Generate a NEW value in the relevant console (CJ developer console / Google Cloud / etc.) and confirm when done.
2. Run `wrangler secret put NAME --name WORKER_NAME` for each worker that uses it (I'll paste at the stdin prompt — the project hook blocks inline values).
3. After all `wrangler secret put`s for that key are done, ask me to revoke the OLD value in the console and confirm.
4. THEN remove the hard-coded reference from source files.

## Phase 3 — Cleanup

1. Add the relevant filenames to `.gitignore` if not already there.
2. Run: `git rm --cached gcp-oauth.keys.json google-service-account-key.json` if those are present.
3. Show me the diff. Don't commit yet — I want to review.
4. Recommend whether to run `git filter-repo` to scrub history (only needed if repo will ever go public).

## Phase 4 — Verify

1. Run `wrangler deploy --dry-run` for each affected worker — must pass.
2. Smoke test one CJ API call with the new key (if cj-inventory-sync or cj-webhook was rotated).
3. Confirm old key is revoked by attempting a CJ API call with it — should 401.

## Anti-Patterns to refuse

- **Doing all rotations in parallel.** One at a time. If a worker can't reach the API after rotation, I need to know WHICH key broke it.
- **Pasting a value into wrangler.toml "temporarily".** The project hook blocks `wrangler secret put NAME inline-value`; for the same reason, never edit wrangler.toml `[vars]` with a secret.
- **Force-pushing the cleanup commit.** The project hook blocks force-push to main/master anyway. If history rewrite is needed, do it on a separate branch I can review first.
