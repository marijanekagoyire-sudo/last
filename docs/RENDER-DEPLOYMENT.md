# Render Deployment Guide

The application ships as a single Node service (React frontend + REST API) plus a managed
PostgreSQL database. This is the simplest, most reliable Render topology: one origin means no
cross-site cookie issues for administrator sessions and no CORS surprises.

> Deploying the API separately is also supported — see *Split deployment* at the end.

---

## Step 1 — Push the project to GitHub

```bash
git init
git add .
git commit -m "Church management system"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

`.env` is ignored by git. Never commit real secrets.

## Step 2 — Create the Render PostgreSQL database

Render Dashboard → **New → PostgreSQL**.

* Name: `church-db`
* Region: same region you will use for the web service
* Plan: Free or Starter

When it is ready, copy the **Internal Database URL**.

## Step 3 — Store the database connection string

You will paste the Internal Database URL into the web service as `DATABASE_URL` in the next step.
Never hard-code it in the repository.

## Step 4 — Create the backend/web service

Render Dashboard → **New → Web Service** → connect the repository.

| Setting | Value |
| ------- | ----- |
| Runtime | Node |
| Root directory | *(leave blank — the project root)* |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Environment variables:

| Key | Value |
| --- | ----- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Internal Database URL from Step 2 |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | `https://<service>.onrender.com` (update after the first deploy) |
| `FRONTEND_URL` | same as `NEXT_PUBLIC_SITE_URL` |
| `NEXT_PUBLIC_API_URL` | `/api` |
| `PG_POOL_MAX` | `5` |
| `ADMIN_EMAIL` | production administrator email |
| `ADMIN_PASSWORD` | strong one-time password (changed at first sign-in) |
| `ADMIN_NAME` | administrator display name |

Alternatively commit the included `render.yaml` and use **New → Blueprint**, which creates the
database and the web service together.

## Step 5 — Deploy and verify the API

After the deploy finishes:

```bash
curl https://<service>.onrender.com/api/health
# {"ok":true,"status":"ok","database":"connected", ...}
```

## Step 6 — Frontend service

The frontend is served by the same web service, so nothing further is required. Because Next.js
renders the public pages on the server there is no static `dist/` directory and no SPA rewrite
rule to configure — deep links such as `/events/annual-thanksgiving-service-2026` resolve
correctly out of the box.

## Step 7 — Run migrations against the production database

Open the service **Shell** in Render (or run locally with `DATABASE_URL` pointing at the
External Database URL):

```bash
npm run migrate
```

## Step 8 — Create the production administrator

```bash
npm run seed
```

The seed reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` from the environment, marks the
account with `must_change_password`, and inserts the sample content. To create only the
administrator on a production site, delete the sample rows afterwards from the Render psql shell.

## Step 9 — Confirm CORS and origins

`FRONTEND_URL` (and `NEXT_PUBLIC_SITE_URL`) define the origins allowed to call the API with
credentials. Requests from any other origin receive `403`. Update both variables whenever the
public URL changes, then redeploy.

## Step 10 — Test the administrator portal

1. Visit `https://<service>.onrender.com/admin/login`
2. Sign in with the credentials from Step 4
3. Follow the banner prompt to change the password (all sessions are revoked, sign in again)

## Step 11 — Test CRUD and the contact form

Create, publish, edit and delete one record of each type and confirm the public pages update.
Submit the contact form and confirm the message appears in **Messages** with unread styling.

## Step 12 — Custom domain

Render Dashboard → service → **Settings → Custom Domains** → add `www.yourchurch.org` and follow
the DNS instructions. Then update:

* `NEXT_PUBLIC_SITE_URL=https://www.yourchurch.org`
* `FRONTEND_URL=https://www.yourchurch.org`

and redeploy so canonical URLs, Open Graph tags and CORS use the new origin.

## Step 13 — HTTPS verification

Render provisions and renews TLS certificates automatically. Confirm the padlock, that
`http://` redirects to `https://`, and that the `Strict-Transport-Security` header is present.

---

## Split deployment (optional)

To host the API on a different Render service from the site:

1. Deploy this repository twice (same build/start commands).
2. On the frontend service set `NEXT_PUBLIC_API_URL=https://<api-service>.onrender.com/api`.
3. On the API service set `FRONTEND_URL=https://<frontend-service>.onrender.com`.
4. Because the session cookie is `SameSite=Lax`, host both services under the same registrable
   domain (for example `www.yourchurch.org` and `api.yourchurch.org`) so administrator sessions
   continue to work.

---

## Troubleshooting

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| Deploy succeeds but health check fails | `DATABASE_URL` missing or wrong | Re-copy the Internal Database URL; confirm the database is in the same region |
| `relation "events" does not exist` | Migrations not run | Run `npm run migrate` in the Render shell |
| Login works locally but not in production | Cookies blocked | Ensure HTTPS, and that `FRONTEND_URL` matches the browser origin exactly |
| Browser console shows `Origin not allowed` | CORS | Add the exact origin to `FRONTEND_URL` and redeploy |
| Slow first request after idle | Free plan cold start | Upgrade the plan or accept the delay |
| Port binding error | Hard-coded port | The app always uses `process.env.PORT`; do not override the start command |
