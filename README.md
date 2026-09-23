# Grace Covenant Church — Website & Administration Portal

A production-ready, full-stack Christian church management system: a public church website backed
by PostgreSQL, plus a secure administrator portal for managing events, announcements, sermons,
media and contact messages.

Everything is real: authentication, CRUD, validation, sanitisation, audit logging, rate limiting,
migrations, seeding and deployment configuration. There is no mock data layer.

---

## Contents

- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Features](#features)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Administrator setup](#administrator-setup)
- [Project structure](#project-structure)
- [Security model](#security-model)
- [Performance](#performance)
- [Testing](#testing)
- [Production build](#production-build)
- [Deployment to Render](#deployment-to-render)
- [Documentation index](#documentation-index)

---

## Architecture

```text
                         INTERNET
                            │
                            ▼
        ┌──────────────────────────────────────┐
        │  React frontend (Next.js App Router) │
        │  /  /about  /beliefs  /what-we-do    │
        │  /publications  /events  /sermons    │
        │  /announcements  /media  /contact    │
        │  /admin/login  /admin/dashboard …    │
        └────────────────┬─────────────────────┘
                         │ HTTPS · REST · JSON
                         ▼
        ┌──────────────────────────────────────┐
        │  Node.js API layer (route handlers)  │
        │  authentication · authorisation      │
        │  validation · sanitisation · CRUD    │
        │  rate limiting · audit · errors      │
        └────────────────┬─────────────────────┘
                         │ pooled TLS connection (Drizzle ORM)
                         ▼
        ┌──────────────────────────────────────┐
        │  PostgreSQL                          │
        │  administrators · admin_sessions     │
        │  events · announcements · sermons    │
        │  media · contact_messages            │
        │  audit_logs                          │
        └──────────────────────────────────────┘
```

The browser never talks to PostgreSQL. Every database access happens in the Node layer
(`src/app/api/**` route handlers and server components), which is the Express-equivalent backend
in the Next.js runtime: one Node process, one origin, one deployment on Render.

**Why Next.js instead of separate Vite + Express services?** The requested capabilities —
REST API, HTTP-only session cookies, CSRF, SSR-rendered SEO metadata, and a single Render web
service — are delivered with fewer moving parts and no cross-site cookie problems. The mapping is
one-to-one:

| Requested | Implemented as |
| --------- | -------------- |
| Express controllers/routes | `src/app/api/**/route.ts` + `src/lib/resource-http.ts` |
| Express middleware (helmet, CORS, auth) | `next.config.ts` headers, `src/proxy.ts`, `src/lib/auth.ts` |
| Prisma ORM | Drizzle ORM (`src/db/schema.ts`) with `npm run migrate` |
| `VITE_API_URL` | `NEXT_PUBLIC_API_URL` (same purpose, same rules) |
| Frontend build (`dist/`) | `npm run build` → server-rendered React |

---

## Technology stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React 19, Next.js 16 (App Router), Tailwind CSS 4 |
| Backend | Node.js, Next.js route handlers (REST) |
| Database | PostgreSQL 16 with Drizzle ORM + `pg` connection pooling |
| Auth | bcrypt password hashing, JWT session tokens (`jose`), database-backed revocable sessions |
| Validation | zod (server) + matching client-side validation |
| Sanitisation | `sanitize-html` allowlist on write and on render |
| Deployment | Render web service + Render PostgreSQL (`render.yaml` blueprint included) |

---

## Features

### Public website

* **Home** — hero with primary/secondary CTAs, welcome, mission & vision, beliefs preview,
  ministries preview, upcoming events, latest announcements, latest sermons, media gallery, contact CTA
* **About** — history timeline, mission, vision, core values, leadership, service times, location
* **What We Believe** — ten-point statement of faith with in-page navigation
* **What We Do** — ten ministries with responsive cards
* **Publications** — hub linking events, announcements, sermons and media with live counts
* **Events** — upcoming/past tabs, search, pagination, detail pages with registration links
* **Announcements** — search, pagination, sanitised rich-text detail pages
* **Sermons** — search, category filter, audio player, privacy-friendly video embeds
* **Media** — category filter, lazy-loaded responsive gallery
* **Contact** — church details, service times, validated form with honeypot and rate limiting

### Administrator portal (`/admin`)

* Secure sign-in with show/hide password, validation, loading and error states
* Dashboard: content statistics, unread message counter, quick actions, recent audit activity
* Full CRUD for events, announcements, sermons and media — search, status filter, category filter,
  pagination, publish/unpublish, preview, confirmation dialogs, optimistic updates, toasts
* Safe rich-text editor with formatting toolbar and sanitised preview
* Message centre: unread highlighting, status workflow (new → read → replied → archived), delete
* Settings: account details, password change (revokes all sessions), security summary
* Responsive sidebar with mobile drawer; all navigation is client-side (no full page reloads)

---

## Local development

```bash
# 1. install dependencies
npm install

# 2. configure the environment
cp .env.example .env
#    edit DATABASE_URL, JWT_SECRET, SESSION_SECRET

# 3. create the schema and sample content
npm run migrate
npm run seed

# 4. start the development server
npm run dev
```

Then open <http://localhost:3000> and <http://localhost:3000/admin/login>.

### Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Start the production server (binds to `process.env.PORT`, default 3000) |
| `npm run migrate` | Apply the schema to the database (`drizzle-kit push`) |
| `npm run seed` | Create the administrator and sample content (idempotent) |
| `npm run db:setup` | `migrate` followed by `seed` |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |

---

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env`.

### Server (secret — never exposed to the browser)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NODE_ENV` | yes (prod) | `development` or `production`; enables Secure cookies and HSTS |
| `PORT` | no | Injected by Render; defaults to 3000 |
| `DATABASE_URL` | **yes** | PostgreSQL connection string; TLS enabled automatically for managed hosts |
| `PG_POOL_MAX` | no | Maximum pooled connections (default 10) |
| `JWT_SECRET` | **yes (prod)** | Signing key for session tokens (`openssl rand -hex 32`) |
| `SESSION_SECRET` | recommended | Fallback signing key |
| `FRONTEND_URL` | **yes (prod)** | Origin allowed to call the API with credentials (CORS) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | seed only | Initial administrator, read by `npm run seed` |

### Browser-exposed (never put secrets here)

| Variable | Description |
| -------- | ----------- |
| `NEXT_PUBLIC_SITE_URL` | Public origin used for canonical URLs and Open Graph tags |
| `NEXT_PUBLIC_API_URL` | API base URL for the browser client (default `/api`; the equivalent of `VITE_API_URL`) |
| `NEXT_PUBLIC_CHURCH_NAME` / `_ADDRESS` / `_PHONE` / `_EMAIL` | Optional church profile overrides |

---

## Database setup

`npm run migrate` creates every table, enum, constraint and index from `src/db/schema.ts` — no
manual SQL is required and it works against a completely fresh database.

| Table | Purpose | Key indexes |
| ----- | ------- | ----------- |
| `administrators` | Portal accounts, lockout state | unique `email` |
| `admin_sessions` | Revocable sessions (FK → administrators, cascade) | unique `token_hash`, `administrator_id`, `expires_at` |
| `events` | Events | unique `slug`, `status`, `event_date`, `published_at` |
| `announcements` | News & notices | unique `slug`, `status`, `published_at` |
| `sermons` | Sermon archive | unique `slug`, `status`, `sermon_date`, `category` |
| `media` | Photo/video/livestream library | unique `slug`, `status`, `category`, `published_at` |
| `contact_messages` | Contact submissions | `status`, `created_at`, `email`, `fingerprint` |
| `audit_logs` | Administrator activity (FK → administrators, set null) | `administrator_id`, `created_at`, (`entity_type`,`entity_id`) |

Every content table supports `DRAFT`/`PUBLISHED` status, `published_at`, soft deletion via
`deleted_at`, and `created_at` / `updated_at` timestamps. Multi-statement operations (login,
password change) run inside PostgreSQL transactions.

`npm run seed` inserts a clearly-labelled sample data set: 6 events (upcoming, past and draft),
5 announcements, 5 sermons and 8 media items, plus the initial administrator. Re-running it never
duplicates rows.

---

## Administrator setup

Development credentials created by the seed (configure via environment variables):

```text
Email:    admin@church.local
Password: ChurchAdmin@2026!
```

These values live only in `.env` / `.env.example` and the seed script — never in the React bundle.

The seeded account is flagged `must_change_password`, so the portal shows a persistent banner
until the password is rotated in **Settings**. For production, set `ADMIN_EMAIL` and
`ADMIN_PASSWORD` in Render to real values before running `npm run seed`, then change the password
immediately after the first sign-in (all sessions are revoked when the password changes).

There is deliberately no "Admin" link on the public website — administrators navigate directly to
`/admin/login`, and admin pages are marked `noindex`.

---

## Project structure

```text
src/
├── app/
│   ├── (public)/            # public website route group (header + footer layout)
│   │   ├── page.tsx         # home
│   │   ├── about/ beliefs/ what-we-do/ publications/
│   │   ├── events/[slug]/ announcements/[slug]/ sermons/[slug]/ media/ contact/
│   ├── admin/
│   │   ├── login/           # unauthenticated sign-in page
│   │   └── (portal)/        # session-guarded layout + dashboard, events, announcements,
│   │                        # sermons, media, messages, settings
│   ├── api/                 # REST API (auth, events, announcements, sermons, media,
│   │                        # contact, messages, dashboard, health)
│   ├── layout.tsx           # root layout, SEO defaults
│   └── not-found.tsx
├── components/              # site header/footer, cards, UI primitives, contact form
│   └── admin/               # admin shell, resource manager, editor, toasts, dialogs
├── db/
│   ├── schema.ts            # Drizzle schema (tables, enums, indexes, relations)
│   ├── index.ts             # pooled database client
│   └── seed.ts              # idempotent seed
├── lib/
│   ├── api.ts               # response envelope + centralised error handling
│   ├── api-client.ts        # browser service layer (auth, content, messages, dashboard)
│   ├── auth.ts              # hashing, sessions, CSRF, guards
│   ├── audit.ts  logger.ts  rate-limit.ts  sanitize.ts  slug.ts
│   ├── queries.ts           # server-side read models for public pages
│   ├── resource.ts          # shared CRUD service for the four content types
│   ├── resource-http.ts     # HTTP handlers built on the CRUD service
│   ├── validation.ts        # zod schemas
│   └── site.ts              # church profile, beliefs, ministries, leadership
└── proxy.ts                 # CORS enforcement + admin route guard
docs/                        # API reference, deployment guide, checklist, test results
scripts/smoke-test.sh        # 63-check end-to-end verification suite
render.yaml                  # Render blueprint (web service + PostgreSQL)
```

---

## Security model

| Threat | Mitigation |
| ------ | ---------- |
| Credential theft | bcrypt (cost 12); hashes never returned or logged |
| Session hijacking | HTTP-only, SameSite=Lax, Secure-in-production cookie; token hash stored server-side; 8-hour expiry; revocation on logout and password change |
| CSRF | Double-submit token required on every non-GET admin request |
| Brute force | Account lock after 5 failures (15 minutes) + 10 attempts / 5 minutes / IP |
| Unauthorised API access | Every admin endpoint calls `requireAdmin()`; UI hiding is never the control |
| SQL injection | Drizzle parameterised queries exclusively; verified by injection probes |
| XSS | Allowlist sanitisation on write **and** render; CSP; no untrusted HTML rendered |
| Clickjacking | `X-Frame-Options: SAMEORIGIN`, CSP `frame-ancestors` |
| Spam | Honeypot field, rate limiting, duplicate fingerprint detection |
| Oversized payloads | Explicit body-size limits on every endpoint |
| Data leakage | Drafts, soft-deleted rows, hashes and internals never returned publicly; generic error messages |
| Cross-origin abuse | Requests from unlisted origins rejected with 403 |

Structured JSON logs record server errors, database errors, authentication failures and admin
operations, with automatic redaction of passwords, hashes, tokens, cookies and connection strings.

---

## Performance

* Server-rendered public pages with a single round trip and no client data waterfall
* Route-level code splitting; the heavy admin bundle never ships to public visitors
* Lazy-loaded, correctly sized images with `loading="lazy"` and `decoding="async"`;
  the hero image is prioritised for LCP
* Pagination everywhere; database indexes on every filtered/sorted column
* Debounced (350 ms) admin search with in-flight request cancellation
* Optimistic publish/unpublish and delete updates with rollback on failure
* Skeleton loaders for all asynchronous admin views
* PostgreSQL connection pooling with keep-alive and idle-error recovery
* Dashboard statistics computed in a single SQL round trip

---

## Testing

`scripts/smoke-test.sh` runs 63 automated checks against a production build: public pages,
draft isolation, authorisation, authentication, CSRF/CORS, the complete event lifecycle,
validation, SQL-injection and XSS probes, the contact form and honeypot, message workflow,
audit logging, soft deletion, logout and brute-force protection.

```bash
npm run build
npm start &
bash scripts/smoke-test.sh
# RESULTS: 63 passed, 0 failed
```

Full results, including the bug found and fixed during testing, are in
[`docs/TEST-RESULTS.md`](docs/TEST-RESULTS.md).

---

## Production build

```bash
npm install
npm run build     # optimised production build
npm start         # serves on $PORT (default 3000)
curl localhost:3000/api/health
```

The server binds to the port Render provides (`process.env.PORT`) and listens on all interfaces —
no localhost assumptions anywhere in the runtime configuration.

---

## Deployment to Render

Step-by-step instructions (database, web service, environment variables, migrations, seeding,
custom domain, HTTPS and troubleshooting) are in
[`docs/RENDER-DEPLOYMENT.md`](docs/RENDER-DEPLOYMENT.md).

Quick reference:

| Setting | Value |
| ------- | ----- |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Migrations | `npm run migrate` (Render shell) |
| Seed | `npm run seed` (Render shell) |

`render.yaml` is included as a Blueprint that provisions the PostgreSQL database and the web
service together, generating `JWT_SECRET` and `SESSION_SECRET` automatically.

---

## Documentation index

| Document | Contents |
| -------- | -------- |
| [`docs/API.md`](docs/API.md) | Every endpoint, parameters, status codes, response envelope |
| [`docs/RENDER-DEPLOYMENT.md`](docs/RENDER-DEPLOYMENT.md) | Full Render deployment walkthrough |
| [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) | Pre-launch verification checklist |
| [`docs/TEST-RESULTS.md`](docs/TEST-RESULTS.md) | Test suite results and coverage |
| [`.env.example`](.env.example) | Documented environment variables |
