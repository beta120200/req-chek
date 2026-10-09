<script>
  import { push } from 'svelte-spa-router';
  import Logo from '../assets/logo.svg';
  import { api } from '../lib/api/client.js';
  import Footer from '../lib/components/Footer.svelte';

  // Public service catalog from the Express API (no login needed).
  /** @type {Array<{id: string, name: string, description: string}>} */
  let services = $state([]);
  let isLoading = $state(true);
  /** @type {string | null} */
  let error = $state(null);

  async function loadServices() {
    try {
      const data = await api.get('/api/dashboard', { auth: false });
      services = data.services ?? [];
    } catch (err) {
      console.error('Failed to load services:', err);
      error = 'Failed to load services. Please try again later.';
    } finally {
      isLoading = false;
    }
  }

  loadServices();

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
          ReqCheck helps you understand what documents you need for various government services.
        </p>
        {#if isLoading}
        <div class="mt-8 flex flex-wrap gap-3">
          <p class="text-sm text-ink-soft">Loading services...</p>
        </div>
        {:else if error}
        <div class="mt-8 flex flex-wrap gap-3">
          <p class="text-sm text-ink-soft">{error}</p>
        </div>
        {:else if services.length > 0}
        <div class="mt-8 flex flex-wrap gap-3">
          <p class="text-sm text-ink-soft">Available services: {services.length}</p>
        </div>
        {:else}
        <div class="mt-8 flex flex-wrap gap-3">
          <p class="text-sm text-ink-soft">No services available.</p>
        </div>
        {/if}
      </div>
    </section>

      <!-- SERVICES DISPLAY -->
      {#if !isLoading && !error}
      <section class="mx-auto max-w-6xl px-6 py-16">
        <h2 class="text-2xl font-extrabold tracking-tight text-ink">Available Services</h2>
        {#if services.length > 0}
        <div class="mt-6 space-y-4">
          {#each services as service (service.id)}
          <div class="border border-line rounded-lg p-4">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 p-4 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {service.id?.toUpperCase()?.slice(0, 2) ?? '??'}
              </div>
              <div>
                <h3 class="text-lg font-bold text-ink">{service.name}</h3>
                <p class="text-sm text-ink-soft">{service.description}</p>
              </div>
            </div>
          </div>
          {/each}
        </div>
        {:else}
        <p class="mt-4 text-sm text-ink-soft">No services found in the database.</p>
        {/if}
      </section>
      {/if}

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

      <!-- FINAL CTA -->
      <section class="border-t border-line bg-brand-soft/50 py-16 text-center">
        <h2 class="text-2xl font-extrabold tracking-tight text-ink">
          Ready to check your document requirements?
        </h2>
        <button
          onclick={() => push('/app')}
          class="mt-6 rounded-lg bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-dark"
        >
          Get Started
        </button>
        <p class="mt-4 text-sm text-ink-soft">
          Sign up to track your document progress and get personalized guidance.
        </p>
      </section>
    </main>

    <Footer />
</div>