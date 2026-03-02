<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="max-w-2xl mx-auto w-full space-y-8">
      <div>
        <img src="/black_adventures_logo.webp" class="size-16 mx-auto mb-4" alt="Adventures Logo" />
        <div class="grid">
          <h1 class="text-2xl font-bold text-center">
            Nur für angemeldete Benutzer
          </h1>
          <p class="text-center text-muted-foreground">
            Bitte logge dich ein, um auf diese Seite zuzugreifen.
          </p>
        </div>
      </div>
      <Tabs default-value="login" class="w-full">
        <TabsList class="w-full">
          <TabsTrigger value="login">
            Anmelden
          </TabsTrigger>
          <TabsTrigger value="register">
            Registrieren
          </TabsTrigger>
        </TabsList>
        <TabsContent value="login" class="mt-4">
          <LazyAppAuthCredentialsLogin />
        </TabsContent>
        <TabsContent value="register" class="mt-4">
          <LazyAppAuthCredentialsRegister />
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
    layout: 'navigation-bar',
});
</script>