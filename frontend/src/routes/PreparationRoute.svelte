<script>
  import { service } from '../lib/data/serviceData.js';
  import { documents } from '../lib/state/appState.svelte.js';
  import { buildRoute, evaluateRequirement } from '../lib/data/readiness.js';

  // Use the first service by default for backward compatibility
  const activeService = service[0];
  let steps = $derived(buildRoute(documents, activeService));
  let evaluation = $derived(evaluateRequirement(documents, activeService.requirement));
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-xl font-bold text-ink">Your Preparation Route</h2>
    <p class="text-ink-soft">
      An ordered sequence of what to obtain or complete next, based on
      <strong class="text-ink">{evaluation.bestPath.option.name}</strong> &mdash; the path closest to done.
    </p>
  </div>

  <ol class="space-y-4">
    {#each steps as step, i}
      <li class="flex gap-4">
        <div class="flex flex-col items-center">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold {step.done ? 'bg-good text-white' : 'bg-brand-soft text-brand'}"
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
</div>
