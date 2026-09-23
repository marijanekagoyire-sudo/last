# REST API Reference

Base URL: `<origin>/api` (configurable in the browser client via `NEXT_PUBLIC_API_URL`).

All responses use a consistent envelope.

**Success**

```json
{ "success": true, "data": {}, "meta": { "total": 12, "page": 1, "pageSize": 10, "totalPages": 2 } }
```

**Error**

```json
{ "success": false, "message": "Unable to process request.", "errors": { "title": ["Title is required."] } }
```

Internal errors are logged server-side and never leaked to clients.

---

## Authentication

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| `POST` | `/api/auth/login` | public (rate limited: 10 / 5 min / IP) | Signs in an administrator, sets an HTTP-only session cookie and a CSRF cookie. |
| `POST` | `/api/auth/logout` | admin | Revokes the current database session and clears cookies. |
| `GET`  | `/api/auth/me` | admin | Returns the signed-in administrator profile and the CSRF token. |
| `POST` | `/api/auth/password` | admin | Changes the password, revokes all sessions, forces re-authentication. |

Login body: `{ "email": "...", "password": "..." }`

Mutating admin requests must include the header `x-csrf-token` with the value of the
`church_admin_csrf` cookie (double-submit CSRF protection).

---

## Content resources

The same contract applies to `events`, `announcements`, `sermons`, and `media`.

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| `GET` | `/api/<resource>` | public | Published records only. Supports `page`, `pageSize`, `search`, `category`, `scope` (`upcoming` / `past`, events only). |
| `GET` | `/api/<resource>?view=admin` | admin | Includes drafts. Supports the filters above plus `status=DRAFT\|PUBLISHED`. |
| `GET` | `/api/<resource>/:idOrSlug` | public / admin | Single record. Drafts are only returned to an authenticated administrator. |
| `POST` | `/api/<resource>` | admin | Creates a record. Slugs are generated automatically and are unique. |
| `PUT` \| `PATCH` | `/api/<resource>/:id` | admin | Partial update. Sending `{"status":"PUBLISHED"}` publishes; `{"status":"DRAFT"}` unpublishes. |
| `DELETE` | `/api/<resource>/:id` | admin | Soft delete (`deleted_at` is set; the record disappears from all listings). |

### Field reference

* **events** — `title`, `description`, `eventDate` (`YYYY-MM-DD`), `startTime`/`endTime` (`HH:MM`), `location`, `organizer`, `imageUrl`, `registrationUrl`, `status`
* **announcements** — `title`, `content` (sanitised rich text), `imageUrl`, `status`
* **sermons** — `title`, `speaker`, `scripture`, `description`, `sermonDate`, `audioUrl`, `videoUrl`, `thumbnailUrl`, `category`, `status`
* **media** — `title`, `description`, `mediaType` (`PHOTO`/`VIDEO`/`LIVESTREAM`), `mediaUrl`, `thumbnailUrl`, `category`, `status`

---

## Contact & messages

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| `POST` | `/api/contact` | public (rate limited: 5 / 10 min / IP) | Stores a contact message. Includes honeypot (`website`) and duplicate-submission protection. |
| `GET` | `/api/messages` | admin | Paginated list. Filters: `status`, `category`, `search`. `meta.unread` returns the unread count. |
| `GET` | `/api/messages/:id` | admin | Single message. |
| `PATCH` | `/api/messages/:id` | admin | Updates status: `NEW`, `READ`, `REPLIED`, `ARCHIVED`. |
| `DELETE` | `/api/messages/:id` | admin | Permanently deletes a message. |

Contact body: `fullName`, `email`, `phone?`, `subject`, `category`, `message`, `website` (honeypot, must be empty).

---

## Operations

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| `GET` | `/api/health` | public | `{ "status": "ok", "database": "connected" }`. Returns `503` when the database is unreachable. Suitable for the Render health check. |
| `GET` | `/api/dashboard` | admin | Content statistics plus the most recent audit-log entries. |

---

## Status codes

| Code | Meaning |
| ---- | ------- |
| `200` / `201` | Success |
| `400` | Malformed request |
| `401` | Not signed in / session expired |
| `403` | CSRF failure or disallowed origin |
| `404` | Record not found (or draft requested publicly) |
| `413` | Payload too large |
| `422` | Validation failure (see `errors`) |
| `429` | Rate limited / account temporarily locked |
| `500` | Unexpected server error (details are logged, never returned) |
