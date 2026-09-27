# ReqCheck (Svelte 5 + Tailwind CSS mockup)

A frontend-only mockup of ReqCheck, rebuilt from the original vanilla HTML/CSS/JS
prototype using **Svelte 5 (runes)**, **Tailwind CSS v4**, and
**[svelte-spa-router](https://svelte-spa-router.italypaleale.me/) v5** (the
version built specifically for Svelte 5's runes API).

There is no backend — all data lives in in-memory reactive state
(`src/lib/state/*.svelte.js`) and resets on page reload (or via the
in-app "Reset demo data" actions).

## Service template

This mockup ships with **one** fully-modeled service: **Voter's ID**.

- **Primary Identification** requirement — satisfied by **any one** of:
  - **National ID (PhilSys)** — depends on **PSA Birth Certificate**
  - **PWD ID** — depends on **Certificate of Disability**
  - **Student's ID** — no prerequisite

Toggling or editing documents on **My Documents** updates the readiness
percentage, the recommended path, the Dependency Map, the Preparation
Route, and the Requirements Directory everywhere else in the app, live.
The demo seeds a Student's ID that's valid but **expiring soon**, so you
can see the expiry-warning behavior immediately.

## Feature parity with the original prototype

- **Landing page** with hero, "how it works", service preview, final CTA
- **Login page** (`/login`) and **Signup page** (`/register`) — fully
  separate pages (not tabs) with real guest/member separation, see below
- **Dashboard** — readiness ring, summary cards, requirement breakdown,
  shortcuts, recent activity feed
- **Check Readiness** — service picker (one live template)
- **Assessment** — full breakdown of all three accepted-ID paths
- **My Documents** — add/edit/remove document details via modals, search,
  filter by status, sort, confirm-delete modal
- **ID Expiration Check** — simulated "OCR" flow: choose an ID type,
  upload/preview an image, "analyze" it, and save the detected expiry
  back to your document inventory
- **Dependency Map** — clickable prerequisite tree with a detail panel
- **Preparation Route** — ordered stepper toward the recommended path
- **Requirements Directory** — every requirement/document with source +
  last-verified date, searchable and filterable by status
- **Notifications** — expiry warnings, a "requirement changed" demo
  (with detail modal), bell dropdown with unread badge
- **Settings** — account row, notification toggle, reset demo data
- **Help** — FAQ
- **Sidebar**: collapsible (desktop), mobile drawer, "Add a Service"
  modal (shows the one live template + upcoming placeholders)
- **Topbar**: notification bell dropdown, user menu dropdown
- **Toasts** for actions (add/edit/remove document, reset, etc.)

## Guest vs. Member

This mockup treats **guest** and **member** as genuinely different, demonstrable
modes — not just a display name:

- **Guest** — the default. You can use every page, but your document
  inventory lives in memory only and is lost on reload. A dismissible banner
  reminds guests to create an account.
- **Member** — created via the **Signup page** (`/register`) or the **Login
  page** (`/login`). Accounts (name, email, password) and each member's
  document inventory are saved to **this browser's `localStorage`**, so a
  member's progress survives a reload or a log-out/log-in cycle. Logging in
  checks the email/password against what was registered; a wrong password or
  unknown email shows an inline error instead of silently succeeding.

There's no real backend — this is all client-side `localStorage`, which is
enough to demo the distinction convincingly. (Passwords are stored in plain
text purely to simulate "an account exists" — never do that in a real
product.) The Settings page and the topbar user menu both show which mode
you're in, a Guest/Member badge, and what it means for your data.

## Getting started

```sh
npm install
npm run dev
```

Then open the printed local URL. Build for production with `npm run build`
(output goes to `dist/`).

## Project structure

```
src/
  App.svelte                     # Router table + app shell (sidebar/topbar) + toasts
  app.css                        # Tailwind v4 import + design tokens (@theme)
  lib/
    data/
      serviceData.js             # Voter's ID service + document library (the data model)
      readiness.js                # Pure readiness/route/status logic (no state)
    state/                        # Svelte 5 runes ($state) modules, shared across components
      appState.svelte.js          # Document inventory + CRUD + per-member persistence
      authState.svelte.js         # Guest/member accounts, backed by localStorage
      notificationState.svelte.js # Notifications (seeded from documents + a demo change)
      activityState.svelte.js     # Recent-activity feed
      toastState.svelte.js        # Ephemeral toast stack
      uiState.svelte.js           # Mobile sidebar / collapse state
    components/
      Sidebar.svelte, Topbar.svelte, Modal.svelte, ToastStack.svelte
      AddServiceModal.svelte, GuestBanner.svelte, AuthLayout.svelte
      ReadinessRing.svelte, StatusPill.svelte, DependencyNode.svelte
  routes/
    Landing.svelte, Login.svelte, Register.svelte  # separate pages, sharing AuthLayout
    Dashboard.svelte, CheckReadiness.svelte, Assessment.svelte
    Documents.svelte, IdCheck.svelte
    DependencyMap.svelte, PreparationRoute.svelte
    RequirementsDirectory.svelte, Notifications.svelte, Settings.svelte, Help.svelte
    NotFound.svelte
```

## Routing

Routes are hash-based (`#/app/...`) via svelte-spa-router 5.x, which requires
Svelte 5. Navigation uses `push()` and every click handler is Svelte 5's
`onclick={...}` (no `on:click`). See `src/App.svelte` for the full route table.

## Adding another service later

`src/lib/data/serviceData.js` is intentionally the only place service-specific
data lives. Add a new object shaped like `service` (with its own
`requirement.options`, each with an optional `dependsOn`), and the readiness
engine in `readiness.js` will evaluate it the same way. The "Add a Service"
modal (`UPCOMING_SERVICES`) is where new templates would surface once built.
