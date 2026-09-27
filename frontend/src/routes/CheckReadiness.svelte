<script>
  import { push } from 'svelte-spa-router';
  import { documents } from '../lib/state/appState.svelte.js';
  import { DOCUMENT_LIBRARY } from '../lib/data/serviceData.js';
  import { evaluateRequirement, readinessWord, isValid, documentStatus } from '../lib/data/readiness.js';
  import StatusPill from '../lib/components/StatusPill.svelte';
  import { selectedServices, setActiveService, getActiveService } from '../lib/state/serviceState.svelte.js';

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

  let serviceData = $derived(selectedServices.map(service => {
    let evaluation;
    if (service.requirement.type === 'one_of') {
      evaluation = evaluateRequirement(documents, service.requirement);
    } else if (service.requirement.type === 'min_count') {
      evaluation = evaluateMinCount(documents, service.requirement);
    } else {
      // Fallback to one_of evaluation for unknown types
      evaluation = evaluateRequirement(documents, service.requirement);
    }
    const percent = Math.round(evaluation.bestPath.progress * 100);
    const word = readinessWord(evaluation.bestPath.progress, evaluation.satisfied);
    const hasHasOneOption = service.requirement.options.some(option => option.hasOne);
    return { service, evaluation, percent, word, hasHasOneOption };
  }));
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-xl font-bold text-ink">Check Your Readiness</h2>
    <p class="text-ink-soft">Select a service to see what you need before you go.</p>
  </div>

  <p class="text-xs font-semibold uppercase tracking-wide text-ink-faint">Government services</p>

  {#each serviceData as serviceData, index}
    <button
      onclick={() => {
        setActiveService(index);
        push('/app/assessment');
      }}
      class="flex w-full flex-col gap-4 rounded-2xl border border-line bg-paper-raised p-6 text-left shadow-sm transition hover:border-brand hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h3 class="text-lg font-bold text-ink">{serviceData.service.name}</h3>
        <p class="mt-1 max-w-md text-sm text-ink-soft">{serviceData.service.description}</p>
      </div>
      <div class="flex items-center gap-4">
        {#if serviceData.evaluation.satisfied}
          <StatusPill status="satisfied">
            {serviceData.percent}% &middot; {serviceData.word}
          </StatusPill>
        {:else if serviceData.hasHasOneOption}
          <StatusPill status="warning">
            Almost there
          </StatusPill>
        {:else}
          <StatusPill status={serviceData.percent >= 50 ? 'warning' : 'missing'}>
            {serviceData.percent}% &middot; {serviceData.word}
          </StatusPill>
        {/if}
        <span class="text-brand">&rarr;</span>
      </div>
    </button>
  {/each}

  <div class="rounded-2xl border border-dashed border-line-strong bg-paper-raised/60 p-6 text-center text-sm text-ink-faint">
    More service templates (Barangay Clearance, Passport, Business Permit) are on the roadmap.
  </div>
</div>
