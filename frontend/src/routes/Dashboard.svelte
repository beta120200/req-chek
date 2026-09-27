<script>
  import { push } from 'svelte-spa-router';
  import { service } from '../lib/data/serviceData.js';
  import { documents } from '../lib/state/appState.svelte.js';
  import { authState } from '../lib/state/authState.svelte.js';
  import { activity } from '../lib/state/activityState.svelte.js';
  import { evaluateRequirement, readinessWord, isValid } from '../lib/data/readiness.js';
  import { selectedServices, getActiveServiceIndex, setActiveService, getActiveService } from '../lib/state/serviceState.svelte.js';
  import ReadinessRing from '../lib/components/ReadinessRing.svelte';
  import StatusPill from '../lib/components/StatusPill.svelte';

  // Use the user-selected services, fallback to first service for backward compatibility
  const activeService = $derived(getActiveService());
  let evaluation = $derived(evaluateRequirement(documents, activeService.requirement));
  let percent = $derived(
    activeService.requirement.type === 'min_count'
      ? Math.round(
          (activeService.requirement.options.filter(function(option) {
            return isValid(documents, option.docId);
          }).length /
            activeService.requirement.minCount) *
            100
        )
      : Math.round(evaluation.bestPath.progress * 100)
  );
  let word = $derived(readinessWord(evaluation.bestPath.progress, evaluation.satisfied));

  let heldCount = $derived(Object.values(documents).filter((d) => d.held).length);
  let totalCount = $derived(Object.keys(documents).length);
</script>

<div class="space-y-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 class="text-xl font-bold text-ink">Good day, {authState.name}.</h2>
      <p class="text-ink-soft">Know what you need before you go.</p>
    </div>
    <button
      onclick={() => push('/app/check-readiness')}
      class="inline-flex items-center gap-2 self-start rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
    >
      <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      Check Readiness
    </button>
  </div>

  <!-- Service Tabs -->
  {#if selectedServices.length > 1}
    <div class="mb-4 flex space-x-2 overflow-x-auto pb-1">
      {#each selectedServices as service, index}
        <button
          class={`px-4 py-2 rounded-t-lg text-sm font-medium
                 ${getActiveServiceIndex() === index
                   ? 'bg-brand text-white'
                   : 'border border-line bg-paper text-ink hover:bg-brand-soft'}`}
          onclick={() => setActiveService(index)}
        >
          {service.name}
        </button>
      {/each}
    </div>
  {/if}
  
  <!-- STATS -->
  <div class="grid gap-4 sm:grid-cols-3">
    <div class="rounded-xl border border-line bg-paper-raised p-4">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-faint">Tracked service</p>
      <p class="mt-1 text-lg font-bold text-ink">{activeService.name}</p>
    </div>
    <div class="rounded-xl border border-line bg-paper-raised p-4">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-faint">Documents on hand</p>
      <p class="mt-1 text-lg font-bold text-ink">{heldCount}</p>
    </div>
    <div class="rounded-xl border border-line bg-paper-raised p-4">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-faint">Requirement status</p>
      <p class="mt-1 text-lg font-bold {evaluation.satisfied ? 'text-good' : 'text-ink'}">{word}</p>
    </div>
  </div>

  <div class="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
    <div class="rounded-2xl border border-line bg-paper-raised p-6">
      <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ReadinessRing percent={percent} satisfied={evaluation.satisfied} size={148} label="{percent}%" sublabel={word} />
        <div class="flex-1 space-y-3 text-center sm:text-left">
          <p class="text-sm font-semibold uppercase tracking-wide text-ink-faint">{activeService.name}</p>
          <p class="text-ink-soft">
            {#if evaluation.satisfied}
              {evaluation.bestPath.completed} of {evaluation.bestPath.total} steps completed
            {:else}
              {evaluation.bestPath.total - evaluation.bestPath.completed} of {evaluation.bestPath.total} steps needed
            {/if}
            for <strong class="text-ink">{activeService.requirement.name}</strong>
            via <strong class="text-ink">{evaluation.bestPath.option.name}</strong>.
          </p>
          {#if evaluation.bestPath.expiringSoon}
            <p class="text-sm font-semibold text-warn">
              Heads up — {evaluation.bestPath.option.name} is expiring soon.
            </p>
          {/if}
          <div class="flex flex-wrap justify-center gap-2 sm:justify-start">
            <button
              onclick={() => push('/app/check-readiness')}
              class="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              View Full Assessment
            </button>
            <button
              onclick={() => push('/app/route')}
              class="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft"
            >
              See Preparation Route
            </button>
          </div>
        </div>
      </div>

      <div class="mt-6 space-y-2 border-t border-line pt-5">
        {#each evaluation.bestPath.steps as step}
          <div class="flex items-center justify-between rounded-lg bg-paper px-3 py-2">
            <span class="text-sm font-medium text-ink">{step.name}</span>
            <StatusPill status={step.held ? (step.status === 'expiring' ? 'warning' : 'satisfied') : 'missing'}>
              {step.held ? (step.status === 'expiring' ? 'Expiring soon' : 'Satisfied') : 'Missing'}
            </StatusPill>
          </div>
        {/each}
      </div>
    </div>

    <div class="space-y-4">
      <div class="rounded-2xl border border-line bg-paper-raised p-5">
        <h3 class="font-bold text-ink">Shortcuts</h3>
        <div class="mt-3 space-y-2">
          <button
            onclick={() => push('/app/documents')}
            class="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink hover:border-brand hover:bg-brand-soft"
          >
            My Documents
            <span class="text-ink-faint">&rarr;</span>
          </button>
          <button
            onclick={() => push('/app/dependency-map')}
            class="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink hover:border-brand hover:bg-brand-soft"
          >
            Dependency Map
            <span class="text-ink-faint">&rarr;</span>
          </button>
          <button
            onclick={() => push('/app/requirements')}
            class="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink hover:border-brand hover:bg-brand-soft"
          >
            Requirements Directory
            <span class="text-ink-faint">&rarr;</span>
          </button>
        </div>
      </div>

      <div class="rounded-2xl border border-line bg-paper-raised p-5">
        <h3 class="font-bold text-ink">Recent activity</h3>
        {#if activity.items.length === 0}
          <p class="mt-2 text-sm text-ink-faint">Nothing yet — try toggling a document.</p>
        {:else}
          <ul class="mt-3 space-y-2.5">
            {#each activity.items as entry}
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
</div>
