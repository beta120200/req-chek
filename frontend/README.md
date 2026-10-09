# ReqCheck — frontend (Svelte 5 + Tailwind v4)

All data comes from the Express API (`../backend`). See the root `README.md` for setup and the API table.

```sh
cp .env.example .env   # set VITE_API_BASE_URL (default http://localhost:3000)
npm install
npm run dev            # http://localhost:5173
npm run build          # production build -> dist/
```

There is **no Vite proxy**. The browser calls `VITE_API_BASE_URL` directly, so the backend must list this
app's origin in `FRONTEND_URL` (CORS).

```
src/lib/api/client.js            # fetch wrapper: base URL, Bearer token, refresh-on-401, session storage
src/lib/api/resource.svelte.js   # createResource(path): loading/error/data for page views
src/lib/state/*.svelte.js        # auth, documents, services, notifications, activity, toasts, ui
src/routes/*.svelte              # pages
src/lib/components/*.svelte      # shared components (AuthRequired = sign-in prompt for guests)
```
