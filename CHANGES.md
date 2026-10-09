# What was fixed

## Why the frontend could not use the Express routes
1. **Login never stored a token and no request sent one.** Every protected route correctly answered 401. The
   frontend now keeps the Supabase session and sends `Authorization: Bearer …` (with refresh-on-401).
2. `Login`/`Register` called async `login()`/`register()` **without `await`**, so login could never succeed.
3. Pages fetched relative URLs (`/api/...`) and relied on the Vite proxy; env var mismatch
   (`VITE_API_BASE_URL` in `.env.example` vs `VITE_API_URL` in code). Now one API client + `VITE_API_BASE_URL`; proxy removed.
4. `checkReadinessRoutes` was **never mounted**; `/api/auth/me` had **no auth middleware** (always 401);
   `/api/id-check` read `req.files` with no upload middleware installed (added multer).
5. `serviceState` used `require()` in an ES module (runtime crash); `Landing` called a non-existent `/api/services`.

## Supabase / backend bugs
- The shared service-role client was used for `signInWithPassword`/`signUp`, which swaps its credentials for the
  user's and breaks later queries. Auth now uses a separate isolated client; logout uses `auth.admin.signOut`.
- `.env.example` typo `SUPABSE_PUBLISHABLE_KEY` (old spelling still accepted). Added `FRONTEND_URL`; removed unused `express-session`.
- Dashboard mapped requirements by the requirement id instead of `service_id` → requirement always `null`.
- `requirement.type` read instead of `requirement_type` (min_count logic ignored); readiness showed 50% while satisfied.
- `document_library.lastVerified` doesn't exist in the schema (500 on the directory route).
- `onConflict` passed as an array; supabase-js needs `'user_id,document_id'`.
- ID check: tesseract.js v7 API was called the old way; dates were parsed with month/day inverted and the *first*
  date (birth date) was used; a failed OCR overwrote the user's saved document with `held:false`. Rewritten.
- Duplicate query/evaluation code in 5 route files → `backend/lib/` (`catalog.js`, `readiness.js`, `dates.js`, `idDates.js`, `activity.js`).
- Added: auth/error/404 handlers, input validation, `POST/PUT/DELETE` for tracked services (the DB could never be written before), activity logging.

## Database (`database/`)
- `user_documents.user_id` / `user_services.user_id` reference `public.users`, but nothing created that row on signup →
  every insert failed. Added a trigger on `auth.users` (plus a backend fallback).
- `requirement_options.id` is a primary key but the seed reused `national-id`, so NBI's National ID option was silently
  skipped by `ON CONFLICT DO NOTHING`. Fixed as `nbi-national-id`.

## Frontend bugs
- `RequirementsDirectory`: `$derived(() => …)` (needs `$derived.by`), plain `let` mixed with `$state` (loading flag never
  updated), and it filtered on a `status` the API never sent.
- `DependencyMap`: non-reactive state, `$state(() => …)`, and node-id collisions (`psa` was both an option and a document).
- `Documents`: only user rows were loaded so the library was empty; stray `$` in the delete dialog; modals crashed on null.
- `IdCheck`: crashed when the library wasn't loaded; file input nested inside a button; no auth header.
- CheckReadiness expected `progress/word/satisfied` the API didn't compute; the pills showed "undefined%".
- Notifications are now derived from real documents (expired / expiring soon).

## Behaviour change to be aware of
The old README promised guests could use every page with in-memory data. The API is per-user, so **guests now see the
public catalog and requirements directory; pages that need your data show a "Log in" prompt.**
