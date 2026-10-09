<script>
  import { createResource } from '../lib/api/resource.svelte.js';
  import { serviceState, setActiveService } from '../lib/state/serviceState.svelte.js';
  import AuthRequired from '../lib/components/AuthRequired.svelte';

  const preparation = createResource('/api/preparation');
  let steps = $derived(preparation.data ?? []);
  let activeService = $derived(serviceState.selected.find(s => s.id === serviceState.activeServiceId) ?? null);
</script>

<div class="space-y-6">
  {#if preparation.needsLogin}
    <AuthRequired feature="your Preparation Route" />
  {:else if preparation.loading}
    <div class="text-center py-8">
      <p class="text-sm text-ink-soft">Loading preparation route...</p>
    </div>
  {:else if preparation.code === 'no_service'}
    <div class="rounded-2xl border border-dashed border-line-strong bg-paper-raised/60 p-8 text-center text-sm text-ink-soft">
      You haven't added a service yet. Use "Add a Service" in the sidebar, then come back here.
    </div>
  {:else if preparation.error}
    <div class="text-center py-8">
      <p class="text-sm text-bad">{preparation.error}</p>
    </div>
  {:else}
    {#if activeService}
      <div class="mb-4">
        <div class="flex items-center gap-3 rounded-xl border border-line bg-paper-raised p-3">
          <div class="flex-1">
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Currently Selected Service
            </p>
            <p class="text-lg font-bold text-ink">{activeService.name}</p>
          </div>
        </div>
      </div>
    {/if}
    {#if serviceState.selected.length > 0}
      <div class="mb-4">
        <div>

          <select
            bind:value={serviceState.activeServiceId}
            onchange={async () => {
              if (serviceState.activeServiceId) {
                await setActiveService(serviceState.activeServiceId);
              }
            }}
            class="block w-48 rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:outline-none"
          >
            {#if serviceState.selected.length > 0}
              {#each serviceState.selected as service (service.id)}
                <option value={service.id}>
                  {service.name}
                </option>
              {/each}
            {/if}
          </select>
        </div>
      </div>
    {/if}
    <div>
      <h2 class="text-xl font-bold text-ink">Your Preparation Route</h2>
      <p class="text-ink-soft">
        An ordered sequence of what to obtain or complete next.
      </p>
    </div>

    <ol class="space-y-4">
      {#each steps as step, i (step.id)}
        <li class="flex gap-4">
          <div class="flex flex-col items-center">
            <span
              class={`
                flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold
                ${step.done ? 'bg-good text-white' : 'bg-brand-soft text-brand'}
              `}
            >
              {#if step.done}
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 12.5 9.5 18 20 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {:else}
                {step.order}
              {/if}
            </span>
            {#if i !== steps.length - 1}
              <span class="mt-1 h-full w-px flex-1 bg-line-strong"></span>
            {/if}
          </div>
          <div class="flex-1 rounded-xl border p-4 {step.done ? 'border-line bg-paper-raised opacity-80' : 'border-line bg-paper-raised'} {step.warning ? 'border-warn-line bg-warn-soft/40' : ''}">
            <p class="font-semibold text-ink">{step.title}</p>
            {#if step.detail}
              <p class="mt-1 text-sm text-ink-soft">{step.detail}</p>
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</div>