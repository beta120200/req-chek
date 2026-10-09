<script>
  import { push } from 'svelte-spa-router';
  import { createResource } from '../lib/api/resource.svelte.js';
  import ReadinessRing from '../lib/components/ReadinessRing.svelte';
  import StatusPill from '../lib/components/StatusPill.svelte';
  import AuthRequired from '../lib/components/AuthRequired.svelte';

  const assessment = createResource('/api/assessment');
  let data = $derived(assessment.data);
</script>

<div class="space-y-6">
  {#if assessment.needsLogin}
    <AuthRequired feature="the Assessment" />
  {:else if assessment.loading}
    <div class="text-center py-8">
      <p class="text-sm text-ink-soft">Loading assessment data...</p>
    </div>
  {:else if assessment.code === 'no_service'}
    <div class="rounded-2xl border border-dashed border-line-strong bg-paper-raised/60 p-8 text-center text-sm text-ink-soft">
      You haven't added a service yet. Use "Add a Service" in the sidebar, then come back here.
    </div>
  {:else if assessment.error}
    <div class="text-center py-8">
      <p class="text-sm text-bad">{assessment.error}</p>
    </div>
  {:else if data}
    <button
      onclick={() => push('/app/check-readiness')}
      class="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand"
    >
      <svg viewBox="0 0 24 24" width="15" height="15"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Back to services
    </button>

    <div class="flex flex-col gap-4 rounded-2xl border border-line bg-paper-raised p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-xl font-bold text-ink">{data.service.name}</h2>
        <p class="text-ink-soft">{data.requirement?.minCount || 1} requirement &middot; {data.service.office}</p>
      </div>
      <ReadinessRing
        percent={data.percent}
        satisfied={data.evaluation.satisfied}
        size={104}
        label="{data.percent}%"
        sublabel={data.word}
      />
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

    {#if !data.requirement}
      <div class="rounded-2xl border border-dashed border-line-strong bg-paper-raised/60 p-6 text-center text-sm text-ink-soft">
        This service does not have a defined requirement yet.
      </div>
    {:else}
    <div class="rounded-2xl border border-line bg-paper-raised p-6">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 class="font-bold text-ink">{data.requirement.name}</h4>
          <p class="mt-1 max-w-xl text-sm text-ink-soft">{data.requirement.why}</p>
        </div>
        <StatusPill status={data.evaluation.satisfied ? 'satisfied' : 'missing'}>
          {data.evaluation.satisfied ? 'Satisfied' : 'Not yet satisfied'}
        </StatusPill>
      </div>

      <p class="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Accepted IDs &mdash; {data.requirement.minCount || 1} satisfies this requirement
      </p>

      <div class="mt-3 grid gap-3 sm:grid-cols-3">
        {#if data.evaluation.paths.length > 0}
          {#each data.evaluation.paths as path (path.option.id)}
            {@const isRecommended = path.option.id === data.evaluation.bestPath?.option.id && !data.evaluation.satisfied}
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
                  {#if data.evaluation.satisfied}
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
            </div>
          {/each}
        {:else}
          <div class="text-center py-4">
            <p class="text-sm text-ink-soft">No requirement options available</p>
          </div>
        {/if}
      </div>
    </div>
    {/if}
  {/if}
</div>