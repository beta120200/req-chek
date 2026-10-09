<script>
  import Logo from '../../assets/logo.svg';

  /**
   * 'full'    -> brand, link columns, disclaimer, bottom bar (landing page)
   * 'compact' -> disclaimer + one-line bottom bar (inside the app shell)
   * @type {{ variant?: 'full' | 'compact' }}
   */
  let { variant = 'full' } = $props();

  // Set this to your repository URL to show a "Source code" link; leave empty to hide it.
  const GITHUB_URL = '';

  const year = new Date().getFullYear();

  // svelte-spa-router is hash-based, so internal links are "#/path".
  const columns = [
    {
      title: 'Preparation',
      links: [
        { href: '#/app/check-readiness', label: 'Check readiness' },
        { href: '#/app/documents', label: 'My documents' },
        { href: '#/app/route', label: 'Preparation route' },
        { href: '#/app/dependency-map', label: 'Dependency map' },
      ],
    },
    {
      title: 'Information',
      links: [
        { href: '#/app/requirements', label: 'Requirements directory' },
        { href: '#/app/id-check', label: 'ID expiration check' },
        { href: '#/app/notifications', label: 'Notifications' },
        { href: '#/app/help', label: 'Help' },
      ],
    },
    {
      title: 'Account',
      links: [
        { href: '#/app', label: 'Dashboard' },
        { href: '#/login', label: 'Log in' },
        { href: '#/register', label: 'Create an account' },
        { href: '#/app/settings', label: 'Settings' },
      ],
    },
  ];

  const linkClass = 'text-sm text-ink-soft hover:text-brand focus-visible:text-brand';
</script>

{#if variant === 'full'}
  <footer class="border-t border-line bg-paper-raised">
    <div class="mx-auto max-w-6xl px-6 py-12">
      <div class="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div class="max-w-xs">
          <a href="#/" class="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
            <img src={Logo} alt="" class="h-7 w-7" />
            ReqCheck
          </a>
          <p class="mt-3 text-sm text-ink-soft">
            Know which documents a government service asks for, which ones you already hold, and what to get next.
          </p>
          <p class="mt-4 text-sm text-ink-soft">
            No account needed. Continue as a guest and your data stays in your browser session.
          </p>
        </div>

        {#each columns as col (col.title)}
          <nav aria-label={col.title}>
            <h2 class="text-sm font-bold text-ink">{col.title}</h2>
            <ul class="mt-3 space-y-2">
              {#each col.links as link (link.href)}
                <li><a href={link.href} class={linkClass}>{link.label}</a></li>
              {/each}
            </ul>
          </nav>
        {/each}
      </div>

      <div class="mt-10 rounded-xl border border-line bg-paper p-4">
        <p class="text-xs leading-relaxed text-ink-soft">
          <span class="font-semibold text-ink">Always confirm with the agency.</span>
          ReqCheck is an independent preparation tool and is not affiliated with any government office.
          Requirements change, so check the "last verified" date on each requirement and confirm the current
          list with the issuing office before you go.
        </p>
      </div>
    </div>

    <div class="border-t border-line">
      <div class="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {year} ReqCheck. All rights reserved.</p>
        <div class="flex flex-wrap items-center gap-x-5 gap-y-1">
          <a href="#/app/help" class="hover:text-brand">Help</a>
          {#if GITHUB_URL}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" class="hover:text-brand">Source code</a>
          {/if}
          <a href="#/" class="hover:text-brand" onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to top
          </a>
        </div>
      </div>
    </div>
  </footer>
{:else}
  <footer class="border-t border-line bg-paper-raised px-4 py-4 md:px-8">
    <div class="flex flex-col gap-2 text-xs text-ink-faint md:flex-row md:items-center md:justify-between">
      <p class="max-w-2xl">
        ReqCheck is an independent preparation tool. Confirm the current requirements with the issuing office before you go.
      </p>
      <div class="flex shrink-0 items-center gap-x-4">
        <a href="#/app/requirements" class="hover:text-brand">Requirements</a>
        <a href="#/app/help" class="hover:text-brand">Help</a>
        <span>&copy; {year} ReqCheck</span>
      </div>
    </div>
  </footer>
{/if}
