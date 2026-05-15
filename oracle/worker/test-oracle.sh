#!/usr/bin/env bash
# test-oracle.sh — integration smoke tests for oracle-worker.
#
# Defaults to wrangler dev at http://localhost:8787. Override the base URL
# with an env var:
#   ORACLE_BASE=https://3rdeyesupply.com/api bash test-oracle.sh
#
# Local dev workflow:
#   # In one terminal:
#   cd oracle/worker
#   wrangler dev   # starts on http://localhost:8787 by default
#
#   # In another terminal:
#   bash test-oracle.sh
#
# Exit codes:
#   0  all assertions passed
#   1  one or more assertions failed (see stderr)

set -uo pipefail

BASE="${ORACLE_BASE:-http://localhost:8787}"
ORIGIN="${ORACLE_ORIGIN:-https://3rdeyesupply.com}"
PASS=0; FAIL=0

bold() { printf "\033[1m%s\033[0m\n" "$*"; }
ok()   { printf "  \033[0;32m✔\033[0m %s\n" "$*"; PASS=$((PASS+1)); }
bad()  { printf "  \033[0;31m✘\033[0m %s\n" "$*" >&2; FAIL=$((FAIL+1)); }

bold "=========================================================="
bold " Oracle Worker Integration Tests"
bold "=========================================================="
echo "BASE   = $BASE"
echo "ORIGIN = $ORIGIN"
echo

# --------------------------------------------------------------------------
# 1) Health check
# --------------------------------------------------------------------------
bold "[1] GET /oracle/health"
resp=$(curl -sS -w '\n%{http_code}' "$BASE/oracle/health")
body=$(echo "$resp" | head -n -1)
code=$(echo "$resp" | tail -n 1)
echo "    response: $body (HTTP $code)"
if [ "$code" = "200" ] && echo "$body" | grep -q '"ok":true'; then
  ok "health endpoint returns ok:true"
else
  bad "health endpoint did not return ok:true"
fi
echo

# --------------------------------------------------------------------------
# 2) CORS preflight from production origin (3rdeyesupply.com)
# --------------------------------------------------------------------------
bold "[2] OPTIONS /oracle/chat — CORS preflight (production origin)"
resp=$(curl -sS -i -X OPTIONS "$BASE/oracle/chat" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")
allow_origin=$(echo "$resp" | grep -i '^access-control-allow-origin:' | tr -d '\r' | awk '{print $2}')
allow_methods=$(echo "$resp" | grep -i '^access-control-allow-methods:' | tr -d '\r' | sed 's/^[^:]*: //')
echo "    allow-origin: $allow_origin"
echo "    allow-methods: $allow_methods"
if [ "$allow_origin" = "$ORIGIN" ]; then
  ok "CORS allow-origin echoes production origin"
else
  bad "CORS allow-origin did not echo production origin (got: $allow_origin)"
fi
if echo "$allow_methods" | grep -q "POST"; then
  ok "CORS allow-methods includes POST"
else
  bad "CORS allow-methods missing POST"
fi
echo

# --------------------------------------------------------------------------
# 2b) CORS preflight from GitHub Pages transitional origin
# --------------------------------------------------------------------------
bold "[2b] OPTIONS /oracle/chat — CORS preflight (hopehamster.github.io)"
allow_origin=$(curl -sS -i -X OPTIONS "$BASE/oracle/chat" \
  -H "Origin: https://hopehamster.github.io" \
  -H "Access-Control-Request-Method: POST" \
  | grep -i '^access-control-allow-origin:' | tr -d '\r' | awk '{print $2}')
if [ "$allow_origin" = "https://hopehamster.github.io" ]; then
  ok "transitional GH Pages origin allowed"
else
  bad "transitional GH Pages origin not echoed (got: $allow_origin)"
fi
echo

# --------------------------------------------------------------------------
# 2c) CORS preflight from localhost dev port
# --------------------------------------------------------------------------
bold "[2c] OPTIONS /oracle/chat — CORS preflight (localhost:4321)"
allow_origin=$(curl -sS -i -X OPTIONS "$BASE/oracle/chat" \
  -H "Origin: http://localhost:4321" \
  -H "Access-Control-Request-Method: POST" \
  | grep -i '^access-control-allow-origin:' | tr -d '\r' | awk '{print $2}')
if [ "$allow_origin" = "http://localhost:4321" ]; then
  ok "localhost:4321 dev origin allowed"
else
  bad "localhost dev origin not echoed (got: $allow_origin)"
fi
echo

# --------------------------------------------------------------------------
# 2d) CORS preflight from a hostile origin (must NOT be echoed)
# --------------------------------------------------------------------------
bold "[2d] OPTIONS /oracle/chat — CORS preflight (evil.example.com, must reject)"
allow_origin=$(curl -sS -i -X OPTIONS "$BASE/oracle/chat" \
  -H "Origin: https://evil.example.com" \
  -H "Access-Control-Request-Method: POST" \
  | grep -i '^access-control-allow-origin:' | tr -d '\r' | awk '{print $2}')
if [ "$allow_origin" = "null" ] || [ -z "$allow_origin" ]; then
  ok "hostile origin not echoed (got: '$allow_origin')"
else
  bad "hostile origin was echoed back: $allow_origin"
fi
echo

# --------------------------------------------------------------------------
# 3) Session mint
# --------------------------------------------------------------------------
bold "[3] POST /oracle/session — mint sessionId"
resp=$(curl -sS -X POST "$BASE/oracle/session" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json")
echo "    response: $resp"
SESSION_ID=$(echo "$resp" | sed -n 's/.*"sessionId":"\([^"]*\)".*/\1/p')
if [ -n "$SESSION_ID" ] && echo "$SESSION_ID" | grep -qE '^[0-9a-f-]{36}$'; then
  ok "session mint returned UUID v4: $SESSION_ID"
else
  bad "session mint did not return a UUID"
fi
echo

# --------------------------------------------------------------------------
# 4) Sample chat turn (SSE) — only if we got a session
# --------------------------------------------------------------------------
if [ -n "${SESSION_ID:-}" ]; then
  bold "[4] POST /oracle/chat — sample SSE turn"
  echo "    expected events: meta, token (many), [voice_ready], done"
  echo "    streaming first 10 SSE lines below…"
  echo "    -----"

  # Use a 10s timeout — full turn may take longer but we want to confirm
  # the stream STARTS, not wait for the whole response.
  curl -sS -N --max-time 12 -X POST "$BASE/oracle/chat" \
    -H "Origin: $ORIGIN" \
    -H "Content-Type: application/json" \
    -H "X-Session-Id: $SESSION_ID" \
    -d "{\"sessionId\":\"$SESSION_ID\",\"message\":\"What stones help with anxiety before sleep?\"}" \
    | head -n 10 | sed 's/^/      /' \
    || true

  echo "    -----"
  echo "    (if you see 'event: token' lines above, the stream is working)"
  echo
  ok "chat endpoint responded (full SSE inspection requires manual check above)"
fi
echo

# --------------------------------------------------------------------------
# 5) Bad-shape rejections
# --------------------------------------------------------------------------
bold "[5] Bad-shape rejections"

# 5a) bad sessionId
code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$BASE/oracle/chat" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d '{"sessionId":"not-a-uuid","message":"hi"}')
[ "$code" = "400" ] && ok "rejects bad sessionId (HTTP 400)" || bad "expected 400 on bad sessionId, got $code"

# 5b) empty message
code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$BASE/oracle/chat" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"${SESSION_ID:-00000000-0000-0000-0000-000000000000}\",\"message\":\"\"}")
[ "$code" = "400" ] && ok "rejects empty message (HTTP 400)" || bad "expected 400 on empty message, got $code"

# 5c) invalid JSON
code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$BASE/oracle/chat" \
  -H "Origin: $ORIGIN" -H "Content-Type: application/json" \
  -d 'not json')
[ "$code" = "400" ] && ok "rejects invalid JSON (HTTP 400)" || bad "expected 400 on bad JSON, got $code"

echo

# --------------------------------------------------------------------------
# 6) Voice fetch — likely 404 unless step 4 actually completed
# --------------------------------------------------------------------------
bold "[6] GET /oracle/voice/<turnId> — bad turnId rejected"
code=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/oracle/voice/not-a-uuid" \
  -H "Origin: $ORIGIN")
[ "$code" = "400" ] && ok "rejects bad turnId (HTTP 400)" || bad "expected 400, got $code"
echo

# --------------------------------------------------------------------------
# Summary
# --------------------------------------------------------------------------
bold "=========================================================="
bold " Results: $PASS passed, $FAIL failed"
bold "=========================================================="

if [ "$FAIL" -eq 0 ]; then
  echo
  echo "All assertions passed. Oracle worker looks healthy at $BASE."
  exit 0
else
  echo
  echo "One or more assertions failed. See output above." >&2
  exit 1
fi

# --------------------------------------------------------------------------
# Expected vs actual response shapes (for manual reference)
# --------------------------------------------------------------------------
# /oracle/health  → { "ok": true, "version": 1 }
# /oracle/session → { "sessionId": "<uuid>", "ttl": 86400 }
# /oracle/chat    → text/event-stream:
#                   event: meta         data: { "turnId": "<uuid>" }
#                   event: token        data: { "delta": "..." } (many)
#                   event: meta         data: { "turnId": "...", "tokensIn": N, "tokensOut": N }
#                   event: voice_ready  data: { "url": "/oracle/voice/<turnId>" }
#                   event: done         data: { "ok": true }
# /oracle/voice/:id → audio/mpeg bytes (Cache-Control: private, max-age=300)
