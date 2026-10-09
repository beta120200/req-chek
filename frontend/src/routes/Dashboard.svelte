<script>
  import { push } from "svelte-spa-router";
  import { authState } from "../lib/state/authState.svelte.js";
  import { activity, setActivity } from "../lib/state/activityState.svelte.js";
  import {
    addService,
    setActiveService,
  } from "../lib/state/serviceState.svelte.js";
  import { createResource } from "../lib/api/resource.svelte.js";
  import ReadinessRing from "../lib/components/ReadinessRing.svelte";
  import StatusPill from "../lib/components/StatusPill.svelte";

  // GET /api/dashboard works for guests (service catalog) and members (their data).
  const dashboard = createResource("/api/dashboard", { requireAuth: false });

  let data = $derived(dashboard.data);
  let active = $derived(data?.active ?? null);
  let activeService = $derived(active?.service ?? null);
  let readiness = $derived(active?.readiness ?? null);
  let selected = $derived(data?.selectedServices ?? []);

  $effect(() => {
    setActivity(data?.activity ?? []);
  });

  async function switchService(serviceId) {
    if (serviceId === data?.activeServiceId) return;
    await setActiveService(serviceId);
    await dashboard.reload();
  }

  async function addFromDashboard(service) {
    const result = await addService(service);
    if (result.ok) await dashboard.reload();
  }

  /** Pill for one accepted-document path on the active service. */
  function pathPill(path) {
    if (path.satisfied) {
      return path.expiringSoon
        ? { status: "warning", label: "Expiring soon" }
        : { status: "satisfied", label: "Have it" };
    }
    const prereq = path.steps.find((s) => s.role === "prerequisite");
    if (prereq && !prereq.held)
      return { status: "warning", label: "Prereq needed" };
    return { status: "missing", label: "Missing" };
  }
</script>

<div class="space-y-6">
  {#if dashboard.loading}
    <div class="py-8 text-center">
      <p class="text-sm text-ink-soft">Loading dashboard...</p>
    </div>
  {:else if dashboard.error}
    <div class="py-8 text-center">
      <p class="text-sm text-bad">{dashboard.error}</p>
      <button
        onclick={dashboard.reload}
        class="mt-3 rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft"
        >Try again</button
      >
    </div>
  {:else if data}
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2 class="text-xl font-bold text-ink">Good day, {authState.name}.</h2>
        <p class="text-ink-soft">Know what you need before you go.</p>
      </div>
      {#if activeService}
        <button
          onclick={() => push("/app/check-readiness")}
          class="inline-flex items-center gap-2 self-start rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          <svg viewBox="0 0 24 24" width="16" height="16"
            ><path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            /></svg
          >
          Check Readiness
        </button>
      {/if}
    </div>

    {#if !activeService}
      <div class="rounded-2xl border border-dashed border-line-strong bg-paper-raised/60 p-6">
        <h3 class="font-bold text-ink">Pick a service to start</h3>
        <p class="mt-1 text-sm text-ink-soft">
          Choose a service to track. You can add more later from the sidebar.
        </p>
        {#if data.services.length > 0}
          <div class="mt-4 space-y-3">
            {#each data.services as service (service.id)}
              <div
                class="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper p-4"
              >
                <div>
                  <p class="font-semibold text-ink">{service.name}</p>
                  <p class="text-sm text-ink-soft">{service.tagline}</p>
                </div>
                <button
                  onclick={() => addFromDashboard(service)}
                  class="shrink-0 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                  >Add</button
                >
              </div>
            {/each}
          </div>
        {:else}
          <div class="py-4 text-center">
            <p class="text-sm text-ink-soft">
              No services available. Use "Add a Service" in the sidebar to start tracking one.
            </p>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Service Tabs -->
      {#if selected.length > 1}
        <div class="mb-4 flex space-x-2 overflow-x-auto pb-1">
          {#each selected as service (service.id)}
            <button
              class={`rounded-t-lg px-4 py-2 text-sm font-medium
                     ${
                       service.id === data.activeServiceId
                         ? "bg-brand text-white"
                         : "border border-line bg-paper text-ink hover:bg-brand-soft"
                     }`}
              onclick={() => switchService(service.id)}
            >
              {service.name}
            </button>
          {/each}
        </div>
      {/if}

      <!-- STATS -->
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-line bg-paper-raised p-4">
          <p
            class="text-xs font-semibold uppercase tracking-wide text-ink-faint"
          >
            Tracked service
          </p>
          <p class="mt-1 text-lg font-bold text-ink">{activeService.name}</p>
        </div>
        <div class="rounded-xl border border-line bg-paper-raised p-4">
          <p
            class="text-xs font-semibold uppercase tracking-wide text-ink-faint"
          >
            Documents on hand
          </p>
          <p class="mt-1 text-lg font-bold text-ink">
            {data.stats.documentsHeld}
          </p>
        </div>
        <div class="rounded-xl border border-line bg-paper-raised p-4">
          <p
            class="text-xs font-semibold uppercase tracking-wide text-ink-faint"
          >
            Requirement status
          </p>
          <p
            class="mt-1 text-lg font-bold {readiness?.satisfied
              ? 'text-good'
              : 'text-ink'}"
          >
            {activeService.requirement ? readiness?.word : "No Requirement"}
          </p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div class="rounded-2xl border border-line bg-paper-raised p-6">
          <div
            class="flex flex-col items-center gap-6 sm:flex-row sm:items-start"
          >
            <ReadinessRing
              percent={readiness?.percent ?? 0}
              satisfied={readiness?.satisfied ?? false}
              size={148}
              label="{readiness?.percent ?? 0}%"
              sublabel={readiness?.word ?? ""}
            />
            <div class="flex-1 space-y-3 text-center sm:text-left">
              <p
                class="text-sm font-semibold uppercase tracking-wide text-ink-faint"
              >
                {activeService.name}
              </p>
              <p class="text-ink-soft">
                {#if !activeService.requirement}
                  No requirement defined
                {:else if readiness?.satisfied}
                  Your {activeService.requirement.name} requirement is satisfied
                  — you're ready to go.
                {:else}
                  Still needed for {activeService.requirement.name}.
                {/if}
              </p>
              <div class="flex flex-wrap justify-center gap-2 sm:justify-start">
                <button
                  onclick={() => push("/app/assessment")}
                  class="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  View Full Assessment
                </button>
                <button
                  onclick={() => push("/app/route")}
                  class="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft"
                >
                  See Preparation Route
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 space-y-2 border-t border-line pt-5">
            {#if active.paths.length > 0}
              {#each active.paths as path (path.option.id)}
                {@const pill = pathPill(path)}
                <div
                  class="flex items-center justify-between rounded-lg bg-paper px-3 py-2"
                >
                  <span class="text-sm font-medium text-ink"
                    >{path.option.name}</span
                  >
                  <StatusPill status={pill.status}>{pill.label}</StatusPill>
                </div>
              {/each}
            {:else}
              <div class="py-4 text-center">
                <p class="text-sm text-ink-soft">
                  No requirement options available
                </p>
              </div>
            {/if}
          </div>
        </div>

        <div class="space-y-4">
          <div class="rounded-2xl border border-line bg-paper-raised p-5">
            <h3 class="font-bold text-ink">Shortcuts</h3>
            <div class="mt-3 space-y-2">
              {#each [["/app/documents", "My Documents"], ["/app/dependency-map", "Dependency Map"], ["/app/requirements", "Requirements Directory"]] as [path, label]}
                <button
                  onclick={() => push(path)}
                  class="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink hover:border-brand hover:bg-brand-soft"
                >
                  {label}
                  <span class="text-ink-faint">&rarr;</span>
                </button>
              {/each}
            </div>
          </div>

          <div class="rounded-2xl border border-line bg-paper-raised p-5">
            <h3 class="font-bold text-ink">Recent activity</h3>
            {#if activity.items.length === 0}
              <p class="mt-2 text-sm text-ink-faint">
                Nothing yet — try adding a document.
              </p>
            {:else}
              <ul class="mt-3 space-y-2.5">
                {#each activity.items as entry (entry.id)}
                  <li class="text-sm">
                    <p class="text-ink">{entry.title}</p>
                    <p class="text-xs text-ink-faint">{entry.time}</p>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
