# ReqCheck

Svelte 5 frontend + Express 5 backend, Supabase (Auth + Postgres).

```
backend/    Express API (Supabase Auth verifies every request)
frontend/   Svelte + Vite app (talks to the API only; never to Supabase directly)
database/   database_schema.sql (fresh install) and database_patch.sql (existing database)
```

## Setup

1. **Database** — Supabase SQL editor: run `database/database_schema.sql` on a fresh project, or
   `database/database_patch.sql` on the one you already have (safe to re-run).
2. **Backend** — `cd backend && cp .env.example .env`, fill in the Supabase values, `npm install`, `npm run dev`.
3. **Frontend** — `cd frontend && cp .env.example .env`, `npm install`, `npm run dev`.

`backend/.env`: `PORT`, `FRONTEND_URL` (comma-separated allowed origins), `SUPABASE_URL`,
`SUPABASE_SECRET_KEY` (service role, server only), `SUPABASE_PUBLISHABLE_KEY` (anon/publishable).
`frontend/.env`: `VITE_API_BASE_URL`, `VITE_PORT`.

## How auth works

The browser never talks to Supabase. `POST /api/auth/login` (or `/register`) returns a Supabase session;
the frontend keeps it in `localStorage` and sends `Authorization: Bearer <access_token>` on every request.
The backend verifies the token with `supabase.auth.getUser(token)`. On a 401 the frontend calls
`POST /api/auth/refresh` once and retries. Guests (no token) can only read the public catalog.

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` `/login` `/refresh` `/logout` | – | Supabase Auth through Express |
| GET | `/api/auth/me` | required | Current user |
| GET | `/api/dashboard` | optional | Catalog (guest) / tracked services, readiness, activity (member) |
| GET | `/api/requirements-directory` | optional | Requirements + documents (with status for members) |
| GET | `/api/check-readiness` | required | Tracked services + readiness |
| GET | `/api/assessment` `/preparation` `/dependency-map` | required | Views of the active service |
| GET/POST/DELETE | `/api/documents`, `DELETE /api/documents/:id` | required | Document inventory |
| GET/POST | `/api/add-service` | required | Available services / track one |
| PUT/DELETE | `/api/user-services/:id/active`, `/api/user-services/:id` | required | Switch / remove tracked service |
| POST | `/api/id-check` | required | OCR an ID photo (multipart `idImage` + `idType`) |
