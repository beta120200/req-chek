<script>
  import { push } from 'svelte-spa-router';
  import { createResource } from '../lib/api/resource.svelte.js';
  import { setActiveService } from '../lib/state/serviceState.svelte.js';
  import StatusPill from '../lib/components/StatusPill.svelte';
  import AuthRequired from '../lib/components/AuthRequired.svelte';

  const readiness = createResource('/api/check-readiness');

  async function openAssessment(service) {
    if (service.id !== readiness.data?.activeServiceId) await setActiveService(service.id);
    push('/app/assessment');
  }

  function pillStatus(r) {
    if (r.satisfied) return 'satisfied';
    return r.percent >= 50 ? 'warning' : 'missing';
  }
</script>

<div class="space-y-6">
  {#if readiness.needsLogin}
    <AuthRequired feature="Check Readiness" />
  {:else if readiness.loading}
    <div class="py-8 text-center">
      <p class="text-sm text-ink-soft">Loading readiness data...</p>
    </div>
  {:else if readiness.error}
    <div class="py-8 text-center">
      <p class="text-sm text-bad">{readiness.error}</p>
    </div>
  {:else if readiness.data}
    <div>
      <h2 class="text-xl font-bold text-ink">Check Your Readiness</h2>
      <p class="text-ink-soft">Select a service to see what you need before you go.</p>
    </div>

    <p class="text-xs font-semibold uppercase tracking-wide text-ink-faint">Government services</p>

    {#if readiness.data.selectedServices.length > 0}
      {#each readiness.data.selectedServices as service (service.id)}
        <button
          onclick={() => openAssessment(service)}
          class="flex w-full flex-col gap-4 rounded-2xl border border-line bg-paper-raised p-6 text-left shadow-sm transition hover:border-brand hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h3 class="text-lg font-bold text-ink">{service.name}</h3>
            <p class="mt-1 max-w-md text-sm text-ink-soft">{service.description}</p>
          </div>
          <div class="flex items-center gap-4">
            {#if service.requirement}
              <StatusPill status={pillStatus(service.readiness)}>
                {service.readiness.percent}% &middot; {service.readiness.word}
              </StatusPill>
            {:else}
              <StatusPill status="missing">0% &middot; Not Started</StatusPill>
            {/if}
            <span class="text-brand">&rarr;</span>
          </div>
        </button>
      {/each}
    {:else}
      <div class="rounded-2xl border border-dashed border-line-strong bg-paper-raised/60 p-6 text-center text-sm text-ink-faint">
        No services selected. Use "Add a Service" in the sidebar to start tracking one.
      </div>
    {/if}

    <div class="rounded-2xl border border-dashed border-line-strong bg-paper-raised/60 p-6 text-center text-sm text-ink-faint">
      More service templates (Barangay Clearance, Passport, Business Permit) are on the roadmap.
    </div>
  {/if}
</div>
