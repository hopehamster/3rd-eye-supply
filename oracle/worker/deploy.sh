#!/usr/bin/env bash
# Oracle Worker deploy helper — 3rd Eye Supply
#
# This script PRINTS the deploy plan and runs `wrangler deploy --dry-run`
# only. The actual deploy command is intentionally commented out — uncomment
# AFTER all preflight steps below have been completed manually.
#
# Usage:
#   cd oracle/worker
#   bash deploy.sh
#
# Required tools:
#   - wrangler >= 3.x  (npm i -g wrangler  OR  npx wrangler ...)
#   - cloudflared logged in to the right account

set -euo pipefail

cd "$(dirname "$0")"

# ---------------------------------------------------------------------------
# Colors (skip on non-tty)
# ---------------------------------------------------------------------------
if [ -t 1 ]; then
  C_BOLD=$'\033[1m'; C_GREEN=$'\033[0;32m'; C_YELLOW=$'\033[0;33m'
  C_RED=$'\033[0;31m'; C_CYAN=$'\033[0;36m'; C_RESET=$'\033[0m'
else
  C_BOLD=''; C_GREEN=''; C_YELLOW=''; C_RED=''; C_CYAN=''; C_RESET=''
fi

echo
echo "${C_BOLD}=========================================================${C_RESET}"
echo "${C_BOLD}  Oracle Worker Deploy Plan — 3rd Eye Supply${C_RESET}"
echo "${C_BOLD}=========================================================${C_RESET}"
echo
echo "Worker name:      oracle-worker"
echo "Entrypoint:       oracle-worker.js"
echo "Wrangler config:  $(pwd)/wrangler.toml"
echo

# ---------------------------------------------------------------------------
# Preflight checklist (manual — script does NOT auto-run any of these)
# ---------------------------------------------------------------------------
cat <<EOF
${C_BOLD}--- PREFLIGHT CHECKLIST ---${C_RESET}

${C_CYAN}1) Create the new KV namespaces (one-time):${C_RESET}
   wrangler kv:namespace create ORACLE_SESSIONS
   wrangler kv:namespace create ORACLE_CACHE
   ${C_YELLOW}→ Paste each returned id into wrangler.toml [[kv_namespaces]] entries.${C_RESET}

${C_CYAN}2) Create the Vectorize index (one-time, optional for first deploy):${C_RESET}
   wrangler vectorize create oracle-knowledge --dimensions=768 --metric=cosine
   ${C_YELLOW}→ The worker no-ops on RAG vector retrieval if the index isn't bound,${C_RESET}
   ${C_YELLOW}  so this can be deferred while the corpus is still being ingested.${C_RESET}

${C_CYAN}3) Inject secrets (one-time per secret; re-run to rotate):${C_RESET}
   wrangler secret put ANTHROPIC_API_KEY  --name oracle-worker
   wrangler secret put MINIMAX_API_KEY    --name oracle-worker
   wrangler secret put MINIMAX_GROUP_ID   --name oracle-worker
   ${C_YELLOW}→ Each prompt accepts the secret on stdin; it is NEVER stored in this repo.${C_RESET}

${C_CYAN}4) Confirm Cloudflare zone ownership:${C_RESET}
   The route pattern 3rdeyesupply.com/api/oracle/* requires the zone to be
   in your Cloudflare account. Verify in the dashboard, or:
     wrangler whoami                  # confirm account
     wrangler zones list 2>/dev/null  # may differ by wrangler version

${C_CYAN}5) (Optional) Configure edge rate-limiting in the Cloudflare dashboard:${C_RESET}
   30 req/min/IP on /api/oracle/* — see architecture.md §9.

EOF

# ---------------------------------------------------------------------------
# Sanity check: ensure wrangler.toml has been filled in
# ---------------------------------------------------------------------------
if grep -q 'REPLACE_AFTER_wrangler_kv_namespace_create' wrangler.toml; then
  echo "${C_RED}!!  wrangler.toml still has placeholder KV namespace IDs.${C_RESET}"
  echo "${C_RED}    Run step (1) above and paste the IDs in before deploying.${C_RESET}"
  echo "${C_RED}    (--dry-run will still work, but the live deploy will fail.)${C_RESET}"
  echo
fi

# ---------------------------------------------------------------------------
# Dry-run validation
# ---------------------------------------------------------------------------
echo "${C_BOLD}--- Running: wrangler deploy --dry-run ---${C_RESET}"
echo
wrangler deploy --dry-run --outdir=./dist || {
  echo
  echo "${C_RED}Dry run failed. Fix the errors above before proceeding.${C_RESET}"
  exit 1
}

echo
echo "${C_GREEN}✔ Dry run succeeded.${C_RESET}"
echo

# ---------------------------------------------------------------------------
# REAL DEPLOY — uncomment manually after preflight is complete
# ---------------------------------------------------------------------------
cat <<EOF
${C_BOLD}--- TO ACTUALLY DEPLOY ---${C_RESET}

The dry run looks good. To push to production, run:

    ${C_CYAN}wrangler deploy${C_RESET}

After deploy, verify:

  ${C_CYAN}# 1) Health check (should return { ok: true, version: 1 })${C_RESET}
  curl -s https://oracle-worker.\$ACCOUNT.workers.dev/oracle/health | jq

  ${C_CYAN}# 2) Custom domain check (if route is provisioned)${C_RESET}
  curl -s https://3rdeyesupply.com/api/oracle/health | jq

  ${C_CYAN}# 3) CORS preflight from production origin${C_RESET}
  curl -i -X OPTIONS https://3rdeyesupply.com/api/oracle/chat \\
       -H "Origin: https://3rdeyesupply.com" \\
       -H "Access-Control-Request-Method: POST"

  ${C_CYAN}# 4) Mint a session and run one chat turn (see test-oracle.sh)${C_RESET}
  bash test-oracle.sh

  ${C_CYAN}# 5) Tail the live logs while you click around${C_RESET}
  wrangler tail oracle-worker

EOF

# UNCOMMENT THE LINE BELOW WHEN READY TO ACTUALLY DEPLOY:
#
# wrangler deploy
#
# (And then comment it out again so future runs of this script stay safe.)

exit 0
