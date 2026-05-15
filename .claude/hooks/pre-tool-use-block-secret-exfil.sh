#!/usr/bin/env bash
# .claude/hooks/pre-tool-use-block-secret-exfil.sh
#
# Layer 3 of Huet's three-layer MCP containment stack
# (see ~/.claude/rules/huet-mcp-security.md).
#
# Structural defense — runs before every Bash tool call.
# Exit code 2 = block; the model cannot reason around this.
#
# Blocks:
#   - Reading .env / credential files (cat, less, more, head, tail, cp to stdout/network)
#   - Outbound exfiltration patterns (curl/wget with .env contents, /dev/tcp tricks)
#   - Force-push to main/master
#   - rm -rf on anything resembling source/state
#
# This repo has known committed secrets (gcp-oauth.keys.json, google-service-account-key.json,
# possibly .env). Until those are rotated and .gitignore'd, this hook is the structural
# guarantee that prompt-injection via MCP-fetched content can't exfiltrate them.

set -u

# Read the JSON event from stdin per Claude Code hook contract.
event_json="$(cat)"

# Extract the Bash command. Fall back to empty string if jq is missing.
if command -v jq >/dev/null 2>&1; then
  cmd="$(printf '%s' "$event_json" | jq -r '.tool_input.command // empty')"
else
  # Naive grep fallback — better than nothing.
  cmd="$(printf '%s' "$event_json" | grep -oE '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"command"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')"
fi

# Empty command = nothing to check.
[ -z "$cmd" ] && exit 0

block() {
  local reason="$1"
  printf 'blocked by .claude/hooks/pre-tool-use-block-secret-exfil.sh: %s\n' "$reason" >&2
  printf 'command: %s\n' "$cmd" >&2
  exit 2
}

# --- Pattern 1: secret-file reads -------------------------------------------
# Match common secret file names regardless of cat/less/head/tail/cp/scp/etc.
if printf '%s' "$cmd" | grep -qiE '(\.env([^a-zA-Z0-9_./]|$)|gcp-oauth\.keys\.json|google-service-account-key\.json|id_rsa|\.p8([^a-zA-Z0-9]|$)|\.pem([^a-zA-Z0-9]|$)|credentials\.json|service-account.*\.json|\.aws/credentials|\.npmrc|wrangler-account\.json)'; then
  # Allow `git ls-files` / `grep -l` style enumeration; block actual reads.
  if printf '%s' "$cmd" | grep -qiE '(cat |less |more |head |tail |cp |scp |curl .*-T|curl .*--upload-file|nc .*<|base64 |xxd |strings )'; then
    block "attempt to read secret-bearing file"
  fi
  # Explicit redirection of secret file into another process.
  if printf '%s' "$cmd" | grep -qE '(\.env|gcp-oauth\.keys\.json|google-service-account-key\.json|\.p8|\.pem|credentials\.json|id_rsa)[^a-zA-Z0-9_./]*[[:space:]]*[|<>]'; then
    block "attempt to pipe/redirect secret-bearing file"
  fi
fi

# --- Pattern 2: outbound exfiltration ---------------------------------------
# /dev/tcp socket trick, common in shell-based exfil.
if printf '%s' "$cmd" | grep -qE '/dev/tcp/'; then
  block "raw TCP socket via /dev/tcp"
fi
# curl/wget POST or PUT to an unlisted host while .env-ish content is referenced.
if printf '%s' "$cmd" | grep -qE '(curl|wget)' && \
   printf '%s' "$cmd" | grep -qiE '(\.env|gcp-oauth|service-account|credentials)' && \
   printf '%s' "$cmd" | grep -qE '(-X[[:space:]]*(POST|PUT)|--data|--data-binary|-d[[:space:]]|--upload-file|-T[[:space:]])'; then
  block "outbound transmission of secret-bearing content"
fi

# --- Pattern 3: destructive git ---------------------------------------------
if printf '%s' "$cmd" | grep -qE 'git[[:space:]]+push[[:space:]]+(--force|-f)([[:space:]]|$).*[[:space:]](main|master)([[:space:]]|$|:)'; then
  block "force-push to main/master"
fi
if printf '%s' "$cmd" | grep -qE 'git[[:space:]]+reset[[:space:]]+--hard'; then
  # Allow on local branches if user has explicitly approved; this is a soft warning instead.
  # Keeping as hard block by default — flip to warning if you want.
  block "git reset --hard (use revert or new commit instead)"
fi

# --- Pattern 4: rm -rf on source/state --------------------------------------
if printf '%s' "$cmd" | grep -qE 'rm[[:space:]]+(-[rRf]+[[:space:]]+|--recursive[[:space:]]+|--force[[:space:]]+)'; then
  if printf '%s' "$cmd" | grep -qE '(site/?$|site/src|site/public|oracle/?$|oracle/worker|\.git/?$|\.claude/?$|/$|~/?$|\$HOME/?$)'; then
    block "rm -rf targeting source/state directory"
  fi
fi

# --- Pattern 5: wrangler secret leak ----------------------------------------
# Block `wrangler secret put NAME value` invocations that include the value inline
# (correct usage prompts for value via stdin).
if printf '%s' "$cmd" | grep -qE 'wrangler[[:space:]]+secret[[:space:]]+put[[:space:]]+[A-Z_]+[[:space:]]+[^[:space:]-]'; then
  block "wrangler secret put value passed inline (use stdin prompt instead)"
fi

# Allow.
exit 0
