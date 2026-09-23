#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# End-to-end verification for the church management system.
# Requires the production server to be running on $BASE_URL.
#
#   npm run build && npm start &
#   bash scripts/smoke-test.sh
# ---------------------------------------------------------------------------
set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/app_db}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@church.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-ChurchAdmin@2026!}"
COOKIE_JAR="$(mktemp)"
PASS=0
FAIL=0

pass() { echo "  PASS  $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL  $1 ($2)"; FAIL=$((FAIL + 1)); }

check_eq() { # description expected actual
  if [ "$2" = "$3" ]; then pass "$1"; else fail "$1" "expected '$2' got '$3'"; fi
}

check_contains() { # description haystack needle
  if printf '%s' "$2" | grep -q -- "$3"; then pass "$1"; else fail "$1" "missing '$3'"; fi
}

check_not_contains() { # description haystack needle
  if printf '%s' "$2" | grep -q -- "$3"; then fail "$1" "unexpected '$3'"; else pass "$1"; fi
}

status() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

echo "== 1. Health & public pages =="
check_contains "health endpoint reports connected database" "$(curl -s "$BASE_URL/api/health")" '"database":"connected"'
for path in / /about /beliefs /what-we-do /publications /events /announcements /sermons /media /contact; do
  check_eq "GET $path returns 200" "200" "$(status "$BASE_URL$path")"
done
check_eq "GET /admin/login returns 200" "200" "$(status "$BASE_URL/admin/login")"
check_eq "unknown page returns 404" "404" "$(status "$BASE_URL/this-page-does-not-exist")"

echo "== 2. Public API only exposes published content =="
PUBLIC_EVENTS=$(curl -s "$BASE_URL/api/events?pageSize=50")
check_not_contains "public events API hides drafts" "$PUBLIC_EVENTS" '"status":"DRAFT"'
check_not_contains "public events API hides deleted records" "$PUBLIC_EVENTS" '"deletedAt":"2'
check_not_contains "public sermons API hides drafts" "$(curl -s "$BASE_URL/api/sermons?pageSize=50")" '"status":"DRAFT"'

echo "== 3. Unauthenticated access is blocked =="
check_eq "admin dashboard redirects to login" "307" "$(status "$BASE_URL/admin/dashboard")"
check_eq "POST /api/events without session -> 401" "401" "$(status -X POST -H 'Content-Type: application/json' -d '{"title":"x"}' "$BASE_URL/api/events")"
check_eq "GET /api/messages without session -> 401" "401" "$(status "$BASE_URL/api/messages")"
check_eq "GET /api/dashboard without session -> 401" "401" "$(status "$BASE_URL/api/dashboard")"
check_eq "admin view listing without session -> 401" "401" "$(status "$BASE_URL/api/events?view=admin")"

echo "== 4. Authentication =="
check_eq "login with wrong password -> 401" "401" "$(status -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"WrongPassword1!\"}" "$BASE_URL/api/auth/login")"
check_eq "login with unknown email -> 401" "401" "$(status -X POST -H 'Content-Type: application/json' -d '{"email":"nobody@example.com","password":"WrongPassword1!"}' "$BASE_URL/api/auth/login")"
check_eq "login with empty fields -> 422" "422" "$(status -X POST -H 'Content-Type: application/json' -d '{"email":"","password":""}' "$BASE_URL/api/auth/login")"

LOGIN_BODY=$(curl -s -c "$COOKIE_JAR" -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" "$BASE_URL/api/auth/login")
check_contains "login with correct credentials succeeds" "$LOGIN_BODY" '"success":true'
check_not_contains "login response never returns a password hash" "$LOGIN_BODY" 'passwordHash'
CSRF=$(grep church_admin_csrf "$COOKIE_JAR" | awk '{print $7}')
[ -n "$CSRF" ] && pass "CSRF cookie issued" || fail "CSRF cookie issued" "empty"
check_contains "GET /api/auth/me returns the administrator" "$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/auth/me")" "$ADMIN_EMAIL"

echo "== 5. CSRF protection =="
check_eq "mutation without CSRF header -> 403" "403" "$(status -b "$COOKIE_JAR" -X POST -H 'Content-Type: application/json' -d '{"title":"CSRF probe","description":"should be rejected because no csrf token","eventDate":"2030-01-01","location":"Hall"}' "$BASE_URL/api/events")"
check_eq "cross-origin request from unknown origin -> 403" "403" "$(status -H 'Origin: https://evil.example.com' "$BASE_URL/api/events")"

echo "== 6. Event lifecycle (create -> verify -> publish -> edit -> delete) =="
CREATE=$(curl -s -b "$COOKIE_JAR" -X POST -H 'Content-Type: application/json' -H "x-csrf-token: $CSRF" \
  -d '{"title":"Automated Test Prayer Vigil","description":"Created by the automated smoke test suite to verify CRUD.","eventDate":"2030-05-18","startTime":"18:00","endTime":"20:00","location":"Main Sanctuary","status":"DRAFT"}' \
  "$BASE_URL/api/events")
check_contains "event created" "$CREATE" '"success":true'
EVENT_ID=$(printf '%s' "$CREATE" | sed -n 's/.*"id":\([0-9]*\).*/\1/p' | head -1)
SLUG=$(printf '%s' "$CREATE" | sed -n 's/.*"slug":"\([^"]*\)".*/\1/p' | head -1)
check_eq "slug generated" "automated-test-prayer-vigil" "$SLUG"
check_eq "record persisted in PostgreSQL" "1" "$(psql "$DB_URL" -tAc "select count(*) from events where id = ${EVENT_ID:-0}")"
check_contains "draft visible in admin listing" "$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/events?view=admin&search=Automated%20Test")" 'Automated Test Prayer Vigil'
check_not_contains "draft hidden from public listing" "$(curl -s "$BASE_URL/api/events?search=Automated%20Test")" 'Automated Test Prayer Vigil'
check_eq "draft detail page returns 404 publicly" "404" "$(status "$BASE_URL/events/$SLUG")"

PUBLISH=$(curl -s -b "$COOKIE_JAR" -X PUT -H 'Content-Type: application/json' -H "x-csrf-token: $CSRF" \
  -d '{"status":"PUBLISHED"}' "$BASE_URL/api/events/$EVENT_ID")
check_contains "event published" "$PUBLISH" '"status":"PUBLISHED"'
check_contains "published event visible in public API" "$(curl -s "$BASE_URL/api/events?search=Automated%20Test")" 'Automated Test Prayer Vigil'
check_eq "published event detail page returns 200" "200" "$(status "$BASE_URL/events/$SLUG")"
check_contains "published event appears on the public events page" "$(curl -s "$BASE_URL/events")" 'Automated Test Prayer Vigil'

curl -s -b "$COOKIE_JAR" -X PUT -H 'Content-Type: application/json' -H "x-csrf-token: $CSRF" \
  -d '{"location":"Fellowship Hall (updated)"}' "$BASE_URL/api/events/$EVENT_ID" > /dev/null
check_contains "edit reflected on the public detail page" "$(curl -s "$BASE_URL/events/$SLUG")" 'Fellowship Hall (updated)'
check_eq "update persisted in PostgreSQL" "Fellowship Hall (updated)" "$(psql "$DB_URL" -tAc "select location from events where id = $EVENT_ID")"

echo "== 7. Validation & injection safety =="
check_eq "invalid payload rejected (422)" "422" "$(status -b "$COOKIE_JAR" -X POST -H 'Content-Type: application/json' -H "x-csrf-token: $CSRF" -d '{"title":"a","description":"short","eventDate":"not-a-date","location":""}' "$BASE_URL/api/events")"
check_eq "invalid URL rejected (422)" "422" "$(status -b "$COOKIE_JAR" -X POST -H 'Content-Type: application/json' -H "x-csrf-token: $CSRF" -d '{"title":"Bad URL Test","description":"Testing URL validation rules.","eventDate":"2030-01-01","location":"Hall","imageUrl":"javascript:alert(1)"}' "$BASE_URL/api/events")"
INJECTION=$(curl -s "$BASE_URL/api/events?search=%27%20OR%201%3D1%3B--")
check_contains "SQL injection attempt handled safely" "$INJECTION" '"success":true'
check_eq "events table intact after injection attempt" "1" "$(psql "$DB_URL" -tAc "select count(*) >= 1 from events" | tr -d ' ' | sed 's/t/1/;s/f/0/')"

XSS=$(curl -s -b "$COOKIE_JAR" -X POST -H 'Content-Type: application/json' -H "x-csrf-token: $CSRF" \
  -d '{"title":"XSS Probe Announcement","content":"<p>Safe copy</p><script>alert(\"xss\")</script><img src=x onerror=alert(1)>","status":"PUBLISHED"}' \
  "$BASE_URL/api/announcements")
ANN_ID=$(printf '%s' "$XSS" | sed -n 's/.*"id":\([0-9]*\).*/\1/p' | head -1)
check_not_contains "script tag stripped before storage" "$XSS" '<script>'
check_not_contains "event handler attribute stripped" "$XSS" 'onerror'
check_not_contains "stored announcement contains no script tag" "$(psql "$DB_URL" -tAc "select content from announcements where id = ${ANN_ID:-0}")" '<script>'

echo "== 8. Contact form & messages =="
CONTACT=$(curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"fullName":"Automated Tester","email":"tester+smoke@example.com","subject":"Smoke test enquiry","category":"General inquiry","message":"This message was generated by the automated end-to-end test suite.","website":""}' \
  "$BASE_URL/api/contact")
check_contains "contact form accepted" "$CONTACT" '"received":true'
MSG_ID=$(psql "$DB_URL" -tAc "select id from contact_messages where email = 'tester+smoke@example.com' order by id desc limit 1" | tr -d ' ')
[ -n "$MSG_ID" ] && pass "message stored in PostgreSQL" || fail "message stored in PostgreSQL" "not found"
check_eq "message stored with NEW status" "NEW" "$(psql "$DB_URL" -tAc "select status from contact_messages where id = ${MSG_ID:-0}" | tr -d ' ')"
check_contains "dashboard reports unread messages" "$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/dashboard")" '"newMessages"'
HONEYPOT=$(curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"fullName":"Spam Bot","email":"bot@example.com","subject":"Spam subject","category":"Other","message":"Buy cheap things right now from this spam bot message.","website":"http://spam.example.com"}' \
  "$BASE_URL/api/contact")
check_contains "honeypot submission accepted silently" "$HONEYPOT" '"received":true'
check_eq "honeypot submission not stored" "0" "$(psql "$DB_URL" -tAc "select count(*) from contact_messages where email = 'bot@example.com'")"

curl -s -b "$COOKIE_JAR" -X PATCH -H 'Content-Type: application/json' -H "x-csrf-token: $CSRF" -d '{"status":"READ"}' "$BASE_URL/api/messages/$MSG_ID" > /dev/null
check_eq "message marked as read" "READ" "$(psql "$DB_URL" -tAc "select status from contact_messages where id = $MSG_ID" | tr -d ' ')"
curl -s -b "$COOKIE_JAR" -X PATCH -H 'Content-Type: application/json' -H "x-csrf-token: $CSRF" -d '{"status":"ARCHIVED"}' "$BASE_URL/api/messages/$MSG_ID" > /dev/null
check_eq "message archived" "ARCHIVED" "$(psql "$DB_URL" -tAc "select status from contact_messages where id = $MSG_ID" | tr -d ' ')"

echo "== 9. Audit log =="
check_eq "audit log recorded admin actions" "1" "$(psql "$DB_URL" -tAc "select count(*) > 0 from audit_logs where entity_type = 'EVENT'" | tr -d ' ' | sed 's/t/1/;s/f/0/')"

echo "== 10. Deletion & cleanup =="
curl -s -b "$COOKIE_JAR" -X DELETE -H "x-csrf-token: $CSRF" "$BASE_URL/api/events/$EVENT_ID" > /dev/null
check_eq "event soft deleted" "1" "$(psql "$DB_URL" -tAc "select count(*) from events where id = $EVENT_ID and deleted_at is not null")"
check_not_contains "deleted event removed from public API" "$(curl -s "$BASE_URL/api/events?search=Automated%20Test")" 'Automated Test Prayer Vigil'
curl -s -b "$COOKIE_JAR" -X DELETE -H "x-csrf-token: $CSRF" "$BASE_URL/api/announcements/$ANN_ID" > /dev/null
psql "$DB_URL" -qAtc "delete from events where id = $EVENT_ID; delete from announcements where id = ${ANN_ID:-0}; delete from contact_messages where id = ${MSG_ID:-0};" > /dev/null

echo "== 11. Session termination =="
curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST -H "x-csrf-token: $CSRF" "$BASE_URL/api/auth/logout" > /dev/null
check_eq "session invalid after logout" "401" "$(status -b "$COOKIE_JAR" "$BASE_URL/api/auth/me")"
check_eq "dashboard redirects to login after logout" "307" "$(status -b "$COOKIE_JAR" "$BASE_URL/admin/dashboard")"

echo "== 12. Brute-force protection (runs last: triggers rate limiting) =="
CODES=""
for _ in 1 2 3 4 5 6 7 8 9 10 11 12; do
  CODES="$CODES$(status -X POST -H 'Content-Type: application/json' -d '{"email":"bruteforce@example.com","password":"WrongPassword1!"}' "$BASE_URL/api/auth/login") "
done
check_contains "repeated failed logins are rate limited" "$CODES" "429"

rm -f "$COOKIE_JAR"
echo
echo "RESULTS: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
