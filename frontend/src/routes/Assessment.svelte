<script>
  import { push } from 'svelte-spa-router';
  import { service as ALL_SERVICES } from '../lib/data/serviceData.js';
  import { documents } from '../lib/state/appState.svelte.js';
  import { DOCUMENT_LIBRARY } from '../lib/data/serviceData.js';
  import { evaluateRequirement, readinessWord, isValid, documentStatus } from '../lib/data/readiness.js';
  import { selectedServices, getActiveService } from '../lib/state/serviceState.svelte.js';
  import ReadinessRing from '../lib/components/ReadinessRing.svelte';
  import StatusPill from '../lib/components/StatusPill.svelte';

  // Use the user-selected service for backward compatibility
  let activeService = getActiveService();

  // Function to evaluate a requirement of type 'min_count'
  function evaluateMinCount(documents, requirement) {
    const { options, minCount } = requirement;
    const paths = options.map(option => {
      const steps = [];
      if (option.dependsOn) {
        steps.push({
          docId: option.dependsOn,
          name: DOCUMENT_LIBRARY[option.dependsOn].name,
          held: isValid(documents, option.dependsOn),
          status: documentStatus(documents, option.dependsOn),
          role: 'prerequisite',
        });
      }
      steps.push({
        docId: option.docId,
        name: option.name,
        held: isValid(documents, option.docId),
        status: documentStatus(documents, option.docId),
        role: 'target',
      });

      const completed = steps.filter(s => s.held).length;
      return {
        option,
        steps,
        completed,
        total: steps.length,
        progress: completed / steps.length,
        satisfied: isValid(documents, option.docId),
        expiringSoon: documentStatus(documents, option.docId) === 'expiring',
      };
    });

    const satisfiedCount = paths.filter(p => p.satisfied).length;
    const satisfied = satisfiedCount >= minCount;

    // Determine bestPath: the option with the highest progress, or the first if none
    let bestPath = paths[0];
    if (paths.length > 0) {
      bestPath = paths.reduce((prev, current) =>
        (current.progress > prev.progress) ? current : prev
      );
    }

    return {
      satisfied,
      bestPath,
      paths,
    };
  }

  let evaluation = $derived(
    activeService.requirement.type === 'one_of'
      ? evaluateRequirement(documents, activeService.requirement)
      : activeService.requirement.type === 'min_count'
      ? evaluateMinCount(documents, activeService.requirement)
      : evaluateRequirement(documents, activeService.requirement) // fallback
  );
  let percent = $derived(
    activeService.requirement.type === 'one_of'
      ? Math.round(evaluation.bestPath.progress * 100)
      : activeService.requirement.type === 'min_count'
      ? Math.min(100, Math.round((evaluation.paths.filter(p => p.satisfied).length / activeService.requirement.minCount) * 100))
      : Math.round(evaluation.bestPath.progress * 100)
  );
  let word = $derived(readinessWord(evaluation.bestPath.progress, evaluation.satisfied));
</script>

<div class="space-y-6">
  <button
    onclick={() => push('/app/check-readiness')}
    class="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand"
  >
    <svg viewBox="0 0 24 24" width="15" height="15"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Back to services
  </button>

  <div class="flex flex-col gap-4 rounded-2xl border border-line bg-paper-raised p-6 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 class="text-xl font-bold text-ink">{activeService.name}</h2>
      <p class="text-ink-soft">{activeService.requirement.minCount || 1} requirement &middot; {activeService.office}</p>
    </div>
    <ReadinessRing percent={percent} satisfied={evaluation.satisfied} size={104} label="{percent}%" sublabel={word} />
  </div>

  <div class="flex flex-wrap gap-3">
    <button
      onclick={() => push('/app/dependency-map')}
      class="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft"
    >
      View Dependency Map
    </button>
    <button
      onclick={() => push('/app/route')}
      class="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft"
    >
      View Preparation Route
    </button>
  </div>

  <h3 class="text-sm font-bold uppercase tracking-wide text-ink-faint">Requirement status</h3>

  <div class="rounded-2xl border border-line bg-paper-raised p-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h4 class="font-bold text-ink">{activeService.requirement.name}</h4>
        <p class="mt-1 max-w-xl text-sm text-ink-soft">{activeService.requirement.why}</p>
      </div>
      <StatusPill status={evaluation.satisfied ? 'satisfied' : 'missing'}>
        {evaluation.satisfied ? 'Satisfied' : 'Not yet satisfied'}
      </StatusPill>
    </div>

    <p class="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">
      Accepted IDs &mdash; any {activeService.requirement.minCount || 1} satisfies this requirement
    </p>

    <div class="mt-3 grid gap-3 sm:grid-cols-3">
      {#each evaluation.paths as path}
        {@const isRecommended = path.option.id === evaluation.bestPath.option.id && !evaluation.satisfied}
        <div
          class="rounded-xl border p-4 {path.satisfied ? 'border-good-line bg-good-soft/40' : isRecommended ? 'border-accent bg-accent-soft/40' : 'border-line bg-paper'}"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-ink">{path.option.name}</span>
            {#if path.satisfied}
              <StatusPill status="satisfied">Have it</StatusPill>
            {:else if isRecommended}
              <StatusPill status="warning">Recommended</StatusPill>
            {:else}
              {#if evaluation.satisfied}
                <StatusPill status="neutral">Not Needed</StatusPill>
              {:else}
                <StatusPill status="missing">Missing</StatusPill>
              {/if}
            {/if}
          </div>
          <ul class="mt-3 space-y-1.5 text-sm">
            {#each path.steps as step}
              <li class="flex items-center gap-2 {step.held ? 'text-good' : 'text-ink-soft'}">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border {step.held ? 'border-good bg-good-soft' : 'border-line-strong'}">
                  {#if step.held}
                    <svg viewBox="0 0 24 24" width="9" height="9"><path d="M4 12.5 9.5 18 20 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {/if}
                </span>
                {step.role === 'prerequisite' ? `Prerequisite: ${step.name}` : step.name}
              </li>
            {/each}
          </ul>
          <p class="mt-3 text-xs text-ink-faint">{path.option.note}</p>
        </div>
      {/each}
    </div>
  </div>
</div>
