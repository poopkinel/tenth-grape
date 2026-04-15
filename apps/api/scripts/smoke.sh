#!/usr/bin/env bash
# Phase 0 smoke test — verifies every endpoint we're keeping still works.
# Run with: bash apps/api/scripts/smoke.sh
# Requires: API running on :3002, Postgres reachable, jq installed.

set -u
BASE="${BASE_URL:-http://localhost:3002/api}"
EMAIL="smoke-$(date +%s)@meeple.dev"
PASSWORD="smokepass123"
NAME="Smoke Tester"

pass=0
fail=0

say() { printf "\n\033[1;34m→ %s\033[0m\n" "$*"; }
ok()  { printf "  \033[1;32m✓\033[0m %s\n" "$*"; pass=$((pass+1)); }
bad() { printf "  \033[1;31m✗\033[0m %s\n    %s\n" "$1" "$2"; fail=$((fail+1)); }

# Helper: assert a JSON field exists in $BODY
has_field() {
  local field="$1"
  echo "$BODY" | grep -q "\"$field\""
}

# ─── 1. Register ──────────────────────────────────────────────────────────────
say "1. POST /auth/register"
BODY=$(curl -sS -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$NAME\"}")
if has_field accessToken; then
  ACCESS=$(echo "$BODY" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
  REFRESH=$(echo "$BODY" | sed -n 's/.*"refreshToken":"\([^"]*\)".*/\1/p')
  ok "Registered, got access + refresh tokens"
else
  bad "register failed" "$BODY"
  exit 1
fi

# ─── 2. Login (new session) ───────────────────────────────────────────────────
say "2. POST /auth/login"
BODY=$(curl -sS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
if has_field accessToken; then
  ACCESS=$(echo "$BODY" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
  ok "Logged in, fresh tokens received"
else
  bad "login failed" "$BODY"
fi

# ─── 3. GET /users/me ─────────────────────────────────────────────────────────
say "3. GET /users/me"
BODY=$(curl -sS "$BASE/users/me" -H "Authorization: Bearer $ACCESS")
if has_field email; then
  ok "Got profile: $(echo "$BODY" | sed -n 's/.*"email":"\([^"]*\)".*/\1/p')"
else
  bad "/users/me failed" "$BODY"
fi

# ─── 4. PATCH /users/me (update profile) ──────────────────────────────────────
say "4. PATCH /users/me"
BODY=$(curl -sS -X PATCH "$BASE/users/me" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"bio":"I test things","gamingFrequency":"REGULAR","maxTravelKm":50}')
if echo "$BODY" | grep -q '"bio":"I test things"'; then
  ok "Profile bio updated"
else
  bad "profile update failed" "$BODY"
fi

# ─── 5. PATCH /users/me/location ──────────────────────────────────────────────
say "5. PATCH /users/me/location"
BODY=$(curl -sS -X PATCH "$BASE/users/me/location" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"lat":32.0853,"lng":34.7818}')
if echo "$BODY" | grep -q '"lat":32.0853'; then
  ok "Location saved (Tel Aviv)"
else
  bad "location update failed" "$BODY"
fi

# ─── 6. GET /games/search ─────────────────────────────────────────────────────
say "6. GET /games/search?q=catan"
BODY=$(curl -sS "$BASE/games/search?q=catan" -H "Authorization: Bearer $ACCESS")
if echo "$BODY" | grep -q '"bggId"'; then
  BGG_ID=$(echo "$BODY" | sed -n 's/.*"bggId":\([0-9]*\).*/\1/p' | head -1)
  ok "BGG search returned results, first bggId=$BGG_ID"
else
  bad "BGG search failed" "$BODY"
  BGG_ID=""
fi

# ─── 7. POST /users/me/games (add game) ──────────────────────────────────────
if [ -n "$BGG_ID" ]; then
  say "7. POST /users/me/games (add bggId=$BGG_ID)"
  BODY=$(curl -sS -X POST "$BASE/users/me/games" \
    -H "Authorization: Bearer $ACCESS" \
    -H "Content-Type: application/json" \
    -d "{\"bggId\":$BGG_ID,\"ownership\":\"OWN\"}")
  if echo "$BODY" | grep -q "\"bggId\":$BGG_ID"; then
    ok "Game added to library"
  else
    bad "add game failed" "$BODY"
  fi
fi

# ─── 8. GET /users/me/games (list library) ───────────────────────────────────
say "8. GET /users/me/games"
BODY=$(curl -sS "$BASE/users/me/games" -H "Authorization: Bearer $ACCESS")
if echo "$BODY" | grep -q "\"bggId\":$BGG_ID"; then
  ok "Library contains the added game"
else
  bad "list games failed to show added game" "$BODY"
fi

# ─── 9. DELETE /users/me/games/:bggId ────────────────────────────────────────
if [ -n "$BGG_ID" ]; then
  say "9. DELETE /users/me/games/$BGG_ID"
  STATUS=$(curl -sS -o /dev/null -w "%{http_code}" -X DELETE "$BASE/users/me/games/$BGG_ID" \
    -H "Authorization: Bearer $ACCESS")
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "204" ]; then
    ok "Game removed (status $STATUS)"
  else
    bad "delete game failed" "HTTP $STATUS"
  fi
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo
printf "\033[1m═══ Smoke test complete: %d passed, %d failed ═══\033[0m\n" "$pass" "$fail"
[ "$fail" -eq 0 ] && exit 0 || exit 1
