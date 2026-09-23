# Test Results

All tests below were executed against a **production build** (`npm run build && npm start`)
connected to a real PostgreSQL database that was migrated with `npm run migrate` and populated
with `npm run seed`.

Reproduce with:

```bash
npm run build
npm start &
bash scripts/smoke-test.sh
```

Latest run: **63 checks passed, 0 failed.**

## 1. Health & public pages

| Check | Result |
| ----- | ------ |
| `/api/health` reports `database: connected` | PASS |
| `/`, `/about`, `/beliefs`, `/what-we-do`, `/publications` return 200 | PASS |
| `/events`, `/announcements`, `/sermons`, `/media`, `/contact` return 200 | PASS |
| `/admin/login` returns 200 | PASS |
| Unknown URL returns the styled 404 page | PASS |

## 2. Public data security

| Check | Result |
| ----- | ------ |
| Public events API excludes drafts | PASS |
| Public events API excludes soft-deleted records | PASS |
| Public sermons API excludes drafts | PASS |
| Draft detail page returns 404 for anonymous visitors | PASS |

## 3. Authorisation

| Check | Result |
| ----- | ------ |
| `/admin/dashboard` redirects to `/admin/login` when signed out | PASS |
| `POST /api/events` without a session returns 401 | PASS |
| `GET /api/messages` without a session returns 401 | PASS |
| `GET /api/dashboard` without a session returns 401 | PASS |
| `GET /api/events?view=admin` without a session returns 401 | PASS |

## 4. Authentication

| Check | Result |
| ----- | ------ |
| Wrong password returns 401 with a generic message | PASS |
| Unknown email returns 401 (no account enumeration) | PASS |
| Empty fields return 422 with field errors | PASS |
| Correct credentials return 200 and set session + CSRF cookies | PASS |
| Login response never contains a password hash | PASS |
| `GET /api/auth/me` returns the signed-in administrator | PASS |
| Session is invalid immediately after logout | PASS |
| Dashboard redirects to login after logout | PASS |
| Repeated failed sign-ins are rate limited (HTTP 429) | PASS |

## 5. CSRF & CORS

| Check | Result |
| ----- | ------ |
| Mutation without `x-csrf-token` returns 403 | PASS |
| Request from an unlisted `Origin` returns 403 | PASS |

## 6. Event lifecycle (end-to-end workflow)

| Check | Result |
| ----- | ------ |
| Event created through the API | PASS |
| SEO slug generated (`Automated Test Prayer Vigil` → `automated-test-prayer-vigil`) | PASS |
| Row verified directly in PostgreSQL | PASS |
| Draft visible in the admin listing | PASS |
| Draft hidden from the public listing | PASS |
| Publishing makes it visible in the public API | PASS |
| Published event detail page returns 200 | PASS |
| Published event appears on the public events page | PASS |
| Edit is reflected on the public detail page | PASS |
| Update persisted in PostgreSQL | PASS |
| Delete performs a soft delete and removes it from the public API | PASS |

> A bug was found and fixed during this test cycle: partial `PUT` updates were applying zod
> schema defaults, which silently reverted published records to draft. Updates now persist only
> the fields the client actually sent.

## 7. Validation & injection safety

| Check | Result |
| ----- | ------ |
| Invalid payload rejected with 422 | PASS |
| `javascript:` URL rejected by URL validation | PASS |
| SQL injection probe (`' OR 1=1;--`) handled safely, data intact | PASS |
| `<script>` stripped from rich text before storage | PASS |
| `onerror` attribute stripped from rich text | PASS |
| Stored announcement contains no script tag | PASS |

## 8. Contact form & messages

| Check | Result |
| ----- | ------ |
| Valid submission accepted and stored in PostgreSQL | PASS |
| Message stored with `NEW` status | PASS |
| Dashboard reports the unread count | PASS |
| Honeypot submission accepted silently and **not** stored | PASS |
| Message marked read via the API | PASS |
| Message archived via the API | PASS |

## 9. Audit log

| Check | Result |
| ----- | ------ |
| Administrator create/update/publish/delete actions recorded | PASS |

## 10. Manual UI verification

| Area | Result |
| ---- | ------ |
| Authenticated `/admin/dashboard`, `/admin/events`, `/admin/announcements`, `/admin/sermons`, `/admin/media`, `/admin/messages`, `/admin/settings` all return 200 | PASS |
| `/admin` redirects to the dashboard when signed in, to the login page when signed out | PASS |
| Homepage renders seeded events, announcements and sermons from PostgreSQL | PASS |
| Sidebar navigation uses client-side routing (no full page reloads) | PASS |
| Save flow shows `Saving…` then a success toast; delete requires confirmation | PASS |

## 11. Build verification

| Check | Result |
| ----- | ------ |
| `npx next typegen` | PASS |
| `npx tsc --noEmit` (strict mode) | PASS |
| `npm run build` (production, Turbopack) | PASS |
| `npm start` production server boots and serves traffic | PASS |
