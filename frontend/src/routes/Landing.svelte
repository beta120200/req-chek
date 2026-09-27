<script>
  import { push } from 'svelte-spa-router';
  import { evaluateRequirement, readinessWord } from '../lib/data/readiness.js';
  import { service } from '../lib/data/serviceData.js';
  import { documents } from '../lib/state/appState.svelte.js';
  import ReadinessRing from '../lib/components/ReadinessRing.svelte';
  import StatusPill from '../lib/components/StatusPill.svelte';
  import Logo from '../assets/logo.svg';

  // Use the first service by default for backward compatibility
  const activeService = service[0];
  let evaluation = $derived(evaluateRequirement(documents, activeService.requirement));
  let percent = $derived(Math.round(evaluation.bestPath.progress * 100));
  let word = $derived(readinessWord(evaluation.bestPath.progress, evaluation.satisfied));

  const steps = [
    { num: '01', title: 'Choose a service', body: "Start with the Voter's ID template — more services are on the way." },
    { num: '02', title: 'Add your documents', body: 'Tell ReqCheck which documents you currently hold.' },
    { num: '03', title: 'Check your readiness', body: 'See exactly which requirement is satisfied, in progress, or missing.' },
    { num: '04', title: 'Follow your route', body: 'Get an ordered sequence of what to obtain next, and where.' },
  ];
</script>

<div class="min-h-screen bg-paper">
  <header class="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
      <a href="/" class="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
        <span class="flex h-7 w-7 items-center justify-center text-white">
          <img src="{Logo}" alt="reqcheck" />
        </span>
        ReqCheck
      </a>
      <nav class="ml-auto hidden gap-6 text-sm font-medium text-ink-soft sm:flex">
        <a href="#how-it-works" class="hover:text-ink">How It Works</a>
        <a href="#service" class="hover:text-ink">Service</a>
      </nav>
      <button
        onclick={() => push('/login')}
        class="rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:text-brand"
      >
        Log in
      </button>
      <button
        onclick={() => push('/app')}
        class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
      >
        Get Started
      </button>
    </div>
  </header>

  <main>
    <!-- HERO -->
    <section class="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_0.85fr]">
      <div>
        <h1 class="text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
          Know what you need<br />before you go.
        </h1>
        <p class="mt-5 max-w-xl text-lg font-medium text-ink">
          Check your documents. Understand your requirements. Know if you're ready.
        </p>
        <p class="mt-3 max-w-lg text-ink-soft">
          ReqCheck walks you through a service's requirement dependencies — what you need, what that
          depends on, and what to do first — before you leave the house.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <button
            onclick={() => push('/app/check-readiness')}
            class="rounded-lg bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-dark"
          >
            Check My Readiness
          </button>
          <a
            href="#service"
            class="rounded-lg border border-line-strong px-6 py-3 font-semibold text-ink hover:border-brand hover:bg-brand-soft"
          >
            Explore the Service
          </a>
        </div>
      </div>

      <!-- Progress -->
      <div class="flex justify-center">
        <div class="w-full max-w-xs rounded-2xl border border-line bg-paper-raised p-6 shadow-xl">
          <div class="flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <span class="h-2 w-2 rounded-full bg-accent"></span>
            {activeService.name}
          </div>
          <div class="mt-5 flex justify-center">
            <ReadinessRing percent={percent} satisfied={evaluation.satisfied} label="{percent}%" sublabel={word} />
          </div>
          <ul class="mt-5 space-y-2 text-sm">
            {#each evaluation.bestPath.steps as step}
              <li class="flex items-center gap-2 {step.held ? 'text-good' : 'text-ink-faint'}">
                <span class="flex h-4 w-4 items-center justify-center rounded-full border {step.held ? 'border-good bg-good-soft' : 'border-line-strong'}">
                  {#if step.held}
                    <svg viewBox="0 0 24 24" width="10" height="10"><path d="M4 12.5 9.5 18 20 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {/if}
                </span>
                {step.name}
              </li>
            {/each}
          </ul>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how-it-works" class="mx-auto max-w-6xl px-6 py-16">
      <h2 class="text-2xl font-extrabold tracking-tight text-ink">How ReqCheck works</h2>
      <ol class="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {#each steps as step}
          <li>
            <span class="text-sm font-bold text-accent">{step.num}</span>
            <h3 class="mt-2 font-bold text-ink">{step.title}</h3>
            <p class="mt-1.5 text-sm text-ink-soft">{step.body}</p>
          </li>
        {/each}
      </ol>
    </section>

    <!-- SERVICE -->
    <section id="service" class="mx-auto max-w-6xl px-6 py-16">
      <h2 class="text-2xl font-extrabold tracking-tight text-ink">Government services</h2>
      <p class="mt-1 text-ink-soft">This prototype ships with multiple fully-modeled service templates.</p>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        {#each service as svc}
          <button
            onclick={() => push('/app/check-readiness')}
            class="flex w-full flex-col gap-4 rounded-2xl border border-line bg-paper-raised p-6 text-left shadow-sm hover:border-brand hover:shadow-md"
          >
            <div>
              <h3 class="text-lg font-bold text-ink">{svc.name}</h3>
              <p class="mt-1 max-w-md text-sm text-ink-soft">{svc.description}</p>
            </div>
            <div class="flex items-center gap-4">
              <StatusPill status="missing">
                0% &middot; Not Started
              </StatusPill>
              <span class="text-brand">&rarr;</span>
            </div>
          </button>
        {/each}
      </div>
    </section>

    <!-- FINAL CTA -->
    <section class="border-t border-line bg-brand-soft/50 py-16 text-center">
      <h2 class="text-2xl font-extrabold tracking-tight text-ink">
        If you went there tomorrow, would you be ready?
      </h2>
      <button
        onclick={() => push('/app')}
        class="mt-6 rounded-lg bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-dark"
      >
        Check My Readiness
      </button>
      <p class="mt-4 text-sm text-ink-soft">
        or <button onclick={() => push('/register')} class="font-semibold text-brand hover:underline">create a free account</button> to save your progress
      </p>
    </section>
  </main>

  <footer class="border-t border-line py-10 text-center text-sm text-ink-faint">
    A personal document and requirement readiness checker &mdash; prototype UI, no backend.
  </footer>
</div>
