<script>
  const faqs = [
    {
      q: 'Does ReqCheck store my documents?',
      a: 'No. ReqCheck only records that you hold a document — for example, "I have a National ID" — never the file or scan itself.',
    },
    {
      q: 'How is the readiness percentage calculated?',
      a: "It's the share of the Primary Identification requirement's steps that are currently satisfied by valid, unexpired documents — following whichever accepted ID (National ID, PWD ID, or Student's ID) you're closest to completing.",
    },
    {
      q: 'What happens when a requirement changes?',
      a: 'ReqCheck flags it as a requirement update in Notifications and in the Requirements Directory, with the source and date it was last verified.',
    },
    {
      q: "Why does ReqCheck recommend one ID over another?",
      a: "It recommends whichever accepted ID you've made the most progress toward — for example, if you already have a PSA birth certificate, it'll point you toward the National ID path rather than starting a different ID from scratch.",
    },
    {
      q: 'Is this connected to a real government system?',
      a: 'No. Nothing is submitted to COMELEC or any other agency.',
    },
  ];
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-xl font-bold text-ink">Help</h2>
    <p class="text-ink-soft">Answers to common questions about ReqCheck.</p>
  </div>

  <div class="divide-y divide-line rounded-2xl border border-line bg-paper-raised">
    {#each faqs as item}
      <div class="p-5">
        <h4 class="font-semibold text-ink">{item.q}</h4>
        <p class="mt-1.5 text-sm text-ink-soft">{item.a}</p>
      </div>
    {/each}
  </div>
</div>
