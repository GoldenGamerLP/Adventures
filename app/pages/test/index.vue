<template>
  <div class="flex flex-col max-w-2xl mx-auto gap-4">
    <main class="grid md:grid-cols-[2fr_1fr] gap-4">
      <section class="bg-card border rounded p-4 col-span-2 h-72">
        <h2 class="text-2xl font-bold mb-4">
          Banner
        </h2>
        <p class="text-muted-foreground mb-4">
          Dies ist eine Testseite, um neue Funktionen zu testen.
        </p>
      </section>

      <section class="bg-card border rounded p-4 h-72">
        <h2 class="text-2xl font-bold mb-4">
          Hauptinhalt
        </h2>
        <p class="text-muted-foreground mb-4">
          Hier könnte der Hauptinhalt der Seite stehen.
        </p>
      </section>

      <section class="bg-card border rounded p-4 h-72">
        <h2 class="text-2xl font-bold mb-4">
          Sekundärer Inhalt
        </h2>
        <p class="text-muted-foreground mb-4">
          Hier könnte zusätzlicher Inhalt oder Funktionen stehen.
        </p>
      </section>

      <section class="bg-card border rounded p-4 h-72">
        <h2 class="text-2xl font-bold mb-4">
          Weitere Informationen
        </h2>
        <p class="text-muted-foreground mb-4">
          Hier könnten weitere Informationen oder Links zu verwandten Themen
          stehen.
        </p>
      </section>

      <!-- Sticky, sidebar on devices > md -->
      <aside
        class="bg-card border rounded p-4 md:row-start-2 md:col-start-2 md:row-span-4 md:sticky md:top-4 h-fit"
      >
        <h2 class="text-2xl font-bold mb-4">
          Sidebar
        </h2>
        <p class="text-muted-foreground mb-4">
          Hier könnte eine Sidebar mit zusätzlichen Informationen oder Links
          stehen.
        </p>
      </aside>

      <section class="bg-card border rounded p-4 h-72">
        <h2 class="text-2xl font-bold mb-4">
          Footer
        </h2>
        <p class="text-muted-foreground mb-4">
          Hier könnte der Footer der Seite stehen, mit Links zu Impressum,
          Datenschutz und anderen
          rechtlichen Informationen.
        </p>
      </section>
    </main>
  </div>
</template>