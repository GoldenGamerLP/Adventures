<template>
  <div>
    <NuxtLoadingIndicator color="false" class="bg-primary" />
    <NuxtRouteAnnouncer />
    <Toaster />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
@import 'vue-sonner/style.css';
</style>
