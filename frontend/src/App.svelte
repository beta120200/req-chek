<script>
  import { untrack } from "svelte";
  import Router, { router } from "svelte-spa-router";

  import Landing from "./routes/Landing.svelte";
  import Login from "./routes/Login.svelte";
  import Register from "./routes/Register.svelte";
  import Dashboard from "./routes/Dashboard.svelte";
  import CheckReadiness from "./routes/CheckReadiness.svelte";
  import Assessment from "./routes/Assessment.svelte";
  import Documents from "./routes/Documents.svelte";
  import DependencyMap from "./routes/DependencyMap.svelte";
  import PreparationRoute from "./routes/PreparationRoute.svelte";
  import IdCheck from "./routes/IdCheck.svelte";
  import RequirementsDirectory from "./routes/RequirementsDirectory.svelte";
  import Notifications from "./routes/Notifications.svelte";
  import Settings from "./routes/Settings.svelte";
  import Help from "./routes/Help.svelte";
  import NotFound from "./routes/NotFound.svelte";

  import Sidebar from "./lib/components/Sidebar.svelte";
  import Topbar from "./lib/components/Topbar.svelte";
  import ToastStack from "./lib/components/ToastStack.svelte";
  import GuestBanner from "./lib/components/GuestBanner.svelte";

  import { authState } from "./lib/state/authState.svelte.js";
  import { loadDocuments, resetUserData } from "./lib/state/appState.svelte.js";
  import {
    loadServices,
    resetServices,
  } from "./lib/state/serviceState.svelte.js";
  import { resetGuestData } from "./lib/state/guestState.svelte.js";

  const routes = {
    "/": Landing,
    "/login": Login,
    "/register": Register,
    "/app": Dashboard,
    "/app/check-readiness": CheckReadiness,
    "/app/assessment": Assessment,
    "/app/documents": Documents,
    "/app/dependency-map": DependencyMap,
    "/app/route": PreparationRoute,
    "/app/id-check": IdCheck,
    "/app/requirements": RequirementsDirectory,
    "/app/notifications": Notifications,
    "/app/settings": Settings,
    "/app/help": Help,
    "*": NotFound,
  };

  // The Landing/Login/Register routes render their own full-page
  // layouts; every /app/* route lives inside the app shell
  // (sidebar + topbar).
  let isAppRoute = $derived(router.location?.startsWith("/app") ?? false);

  // Guests AND members load their data (guests from the in-memory store, members from the database).
  // Re-runs on login / logout and starts each session from a clean slate.
  $effect(() => {
    if (!authState.ready) return;
    void authState.isGuest;
    untrack(() => {
      resetUserData();
      resetServices();
      resetGuestData();
      loadDocuments();
      loadServices();
    });
  });
</script>

{#if isAppRoute}
  <div class="flex min-h-screen bg-paper">
    <Sidebar />
    <div class="flex min-w-0 flex-1 flex-col">
      <Topbar />
      <GuestBanner />
      <main class="flex-1 overflow-y-auto p-4 md:p-8">
        <Router {routes} />
      </main>
    </div>
  </div>
{:else}
  <Router {routes} />
{/if}

<ToastStack />
