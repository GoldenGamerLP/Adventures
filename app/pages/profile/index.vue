<template>
  <div class="max-w-2xl mx-auto w-full">
    <Empty v-if="!userData">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchAlert />
        </EmptyMedia>
        <EmptyTitle>Dein Profil</EmptyTitle>
        <EmptyDescription>
          Es konnte kein Profil gefunden werden. Bitte logge dich ein, um dein Profil zu sehen.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
    <main v-else class="relative">
      <Button
        variant="default"
        size="icon"
        class="absolute top-4 left-4 z-20"
        as-child
      >
        <NuxtLink :to="{ name: 'index' }">
          <ChevronLeft />
          <span class="sr-only">Profil Einstellungen</span>
        </NuxtLink>
      </Button>
      <div class="w-full h-72 flex justify-center items-center sticky top-0">
        <AppProfileBackgroundImage v-model="userData" />
      </div>
      <div class="rounded-lg shadow p-2 bg-background -mt-8 z-10 relative">
        <header class="flex items-center gap-4 mb-4">
          <AppProfileImage v-model="userData" />
          <div class="min-w-0 flex-1">
            <h1 class="text-xl font-bold truncate">
              {{ userData.name }}
            </h1>
            <p v-if="userData.header" class="text-sm text-muted-foreground truncate">
              {{ userData.header }}
            </p>
          </div>
        </header>
        <RekaTabsRoot default-value="about" class="flex flex-col">
          <RekaTabsList class="relative shrink-0 flex mb-4 bg-accent p-2 rounded-lg text-sm" aria-label="Profile Tabs">
            <RekaTabsIndicator
              class="absolute px-8 left-0 h-0.5 bottom-0 w-[var(--reka-tabs-indicator-size)] translate-x-[var(--reka-tabs-indicator-position)] translate-y-[1px] rounded-tr-lg rounded-tl-lg transition-all duration-300"
            >
              <div class="bg-primary w-full h-full"></div>
            </RekaTabsIndicator>
            <RekaTabsTrigger
              value="about"
              class="flex-1 flex items-center justify-center data-[state=active]:text-primary data-[state=active]:font-medium"
            >
              Über
            </RekaTabsTrigger>
            <RekaTabsTrigger
              value="adventures"
              class="flex-1 flex items-center justify-center data-[state=active]:text-primary data-[state=active]:font-medium"
            >
              Abenteuer
            </RekaTabsTrigger>
            <RekaTabsTrigger
              value="seen_adventures"
              class="flex-1 flex items-center justify-center data-[state=active]:text-primary data-[state=active]:font-medium"
            >
              Angesehene Abenteuer
            </RekaTabsTrigger>
            <RekaTabsTrigger
              value="dangerZone"
              class="flex-1 flex items-center justify-center data-[state=active]:text-primary data-[state=active]:font-medium"
            >
              Einstellungen
            </RekaTabsTrigger>
          </RekaTabsList>
          <RekaTabsContent value="about">
            <div class="space-y-8">
              <AppProfileEditHeader :header="userData.header" @update:header="userData.header = $event" />

              <Separator />

              <AppProfileEditBiography
                :biography="userData.biography"
                @update:biography="userData.biography = $event"
              />

              <Separator />

              <AppProfileEditTags :tags="userData.tags" @update:tags="userData.tags = $event" />
            </div>
          </RekaTabsContent>
          <RekaTabsContent value="adventures">
            <LazyAppProfileAdventuresList :author-id="userData._id" />
          </RekaTabsContent>
          <RekaTabsContent value="seen_adventures">
            <LazyAppProfileAdventureVisitHistory />
          </RekaTabsContent>
          <RekaTabsContent value="dangerZone">
            Danger zone
            <AppAuthLogoutButton />
          </RekaTabsContent>
        </RekaTabsRoot>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ChevronLeft, SearchAlert } from 'lucide-vue-next';
import { TabsContent as RekaTabsContent, TabsIndicator as RekaTabsIndicator, TabsList as RekaTabsList, TabsRoot as RekaTabsRoot, TabsTrigger as RekaTabsTrigger } from 'reka-ui';
import type { UserProfileWithMeta } from '~~/shared/types/UserProfileTypes';

const user = useUser();

definePageMeta({
  layout: 'navigation-bar',
  middleware: 'auth-requirement',
});

const { data: userData, error } = await useFetch<UserProfileWithMeta>(`/api/v1/app/profile/${user.value?._id}/public`);
</script>