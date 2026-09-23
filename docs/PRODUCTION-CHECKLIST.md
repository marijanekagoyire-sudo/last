# Production Readiness Checklist

Verify every item before pointing a live domain at the deployment.

## Build & runtime

- [x] `npm install` completes without errors
- [x] `npm run build` produces an optimised production build
- [x] `npm start` boots the production server and binds to `process.env.PORT`
- [x] `GET /api/health` returns `{"status":"ok","database":"connected"}`
- [x] No `localhost` / `127.0.0.1` values are hard-coded in application code (only defaults in `.env.example`)

## Database

- [x] `npm run migrate` applies the full schema to an empty PostgreSQL database
- [x] `npm run seed` creates the administrator and sample content (idempotent)
- [x] Tables present: `administrators`, `admin_sessions`, `events`, `announcements`, `sermons`, `media`, `contact_messages`, `audit_logs`
- [x] Indexes exist on status, published date, event/sermon date, category, slug, message status and email
- [x] Connection pooling configured (`PG_POOL_MAX`) with TLS auto-enabled for managed hosts
- [x] Pool errors are handled so a transient outage never permanently crashes the server

## Security

- [x] Passwords hashed with bcrypt (cost 12); hashes are never returned or logged
- [x] Session token stored in an HTTP-only, SameSite=Lax cookie (Secure in production)
- [x] Sessions are database-backed and can be revoked; 8-hour expiry
- [x] CSRF double-submit token required on every state-changing admin request
- [x] Brute-force protection: account lock after 5 failures + IP rate limiting
- [x] All admin API routes verify the session server-side (hiding UI is not relied on)
- [x] Draft content is never exposed through public endpoints or pages
- [x] Rich text sanitised on write **and** on render (`sanitize-html` allowlist)
- [x] Parameterised queries only (Drizzle ORM) — verified against injection probes
- [x] Request body size limits, payload validation (zod) on every endpoint
- [x] Security headers + CSP configured in `next.config.ts`
- [x] CORS restricted to the configured production origin(s)
- [x] Contact form protected by honeypot, rate limiting and duplicate detection

## Configuration

- [ ] `DATABASE_URL` points at the production database
- [ ] `JWT_SECRET` and `SESSION_SECRET` set to unique 32-byte random values
- [ ] `NEXT_PUBLIC_SITE_URL` and `FRONTEND_URL` set to the production origin
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` set to production values **before** seeding
- [ ] `.env` excluded from git (already in `.gitignore`)
- [ ] Seeded administrator password changed after first sign-in (the portal shows a banner until it is)

## Content & UX

- [x] Public pages render with empty states when no content exists
- [x] Loading states / skeletons on every asynchronous admin view
- [x] Toast notifications and confirmation dialogs for destructive actions
- [x] Pagination on all list views (public and admin)
- [x] Responsive layouts verified from 320 px upward; no horizontal overflow
- [x] Accessibility: skip link, labelled inputs, focus styles, ARIA live regions, semantic headings
- [x] SEO: titles, meta descriptions, Open Graph, canonical URLs; admin pages set `noindex`

## Post-deployment smoke test

- [ ] Sign in at `/admin/login`, change the password, sign in again
- [ ] Create → publish → edit → unpublish → delete an event, verifying the public site each time
- [ ] Repeat for an announcement, sermon and media item
- [ ] Submit the public contact form and confirm the message appears with unread styling
- [ ] Mark the message read, replied, archived, then delete it
- [ ] Sign out and confirm `/admin/dashboard` redirects to the login page
- [ ] Confirm HTTPS, the custom domain and the health check are all green in Render
