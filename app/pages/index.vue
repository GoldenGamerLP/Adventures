<template>
  <div class="max-w-2xl mx-auto w-full">
    <nav class="sticky top-0 mt-1 bg-background z-10 flex flex-col gap-2 pt-2 pb-1 border-b border-b-muted">
      <div class="flex items-center mx-2 sm:mx-0">
        <h1 class="font-semibold font-serif font-[Montserrat Bold] inline-flex items-center gap-1 mr-auto">
          <img :src="computedIcon" class="size-8" alt="" />
          <span>Adventures</span>
        </h1>

        <!-- Action Buttons -->
        <div class="flex items-center gap-1">
          <!-- Create Adventure Button -->
          <Button
            v-if="user"
            variant="ghost"
            size="icon"
            as-child
          >
            <NuxtLink :to="{ name: 'adventures-drafts' }">
              <BookMarkedIcon />
              <span class="sr-only">Entwürfe ansehen</span>
            </NuxtLink>
          </Button>

          <Button
            v-if="user"
            variant="ghost"
            size="icon"
            as-child
          >
            <NuxtLink :to="{ name: 'profile' }">
              <UserCog />
              <span class="sr-only">Profil Einstellungen</span>
            </NuxtLink>
          </Button>

          <LazyAppMiscThemeToggle v-if="!user" />
          <LazyAppAuthCredentialsActionDrawer v-if="!user" />
        </div>
      </div>
      <ol class="flex items-center gap-2 mx-2 sm:mx-0 flex-wrap">
        <li>
          <AppNavigationPillnavShowChangeLocation />
        </li>
        <AppAdventuresNavigationMaskPills />
        <li>
          <AppAdventuresNavigationAdventureSearch />
        </li>
      </ol>
    </nav>

    <main>
      <!-- Loading State -->
      <div v-if="pending" class="mt-6 space-y-4">
        <AppAdventuresNavigationAdventureSkeleton v-for="i in 3" :key="i" />
      </div>

      <!-- Error State -->
      <Empty v-else-if="error">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchAlert />
          </EmptyMedia>
          <EmptyTitle>Fehler beim Laden der Adventures</EmptyTitle>
          <EmptyDescription class="text-xs">
            {{ error }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" @click="refresh">
            Erneut laden
          </Button>
        </EmptyContent>
      </Empty>

      <!-- Empty State -->
      <Empty v-else-if="!adventures?.length">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchAlert />
          </EmptyMedia>
          <EmptyTitle>Keine Adventures gefunden</EmptyTitle>
          <EmptyDescription>
            Versuche, deine Filter anzupassen, um mehr Ergebnisse zu erhalten.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" @click="resetFilters()">
            Filter zurücksetzen
          </Button>
        </EmptyContent>
      </Empty>

      <!-- Adventures List -->
      <ol v-else class="mt-6 flex flex-col gap-4 mx-1 sm:mx-0">
        <li
          v-for="(adventure, index) in adventures"
          :key="adventure._id"
          :style="{ 'animation-delay': `${index * 100}ms`, 'animation-fill-mode': 'both' }"
          class="animate-in fade-in slide-in-from-bottom-8 duration-300"
        >
          <LazyAppAdventuresNavigationAdventureDisplay :adventure="adventure" />
        </li>
      </ol>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { BookMarkedIcon, SearchAlert, UserCog } from 'lucide-vue-next';
import { FETCH_KEY_FOR_YOU_PAGE } from '~~/shared/constants/Constants';
import type { AdventureWithMeta } from '~~/shared/types/AdventureTypes';

definePageMeta({
  layout: 'navigation-bar'
});

const { mask, resetFilters } = useSearchMask();
const user = useUser();
const { currentColorMode } = useColorMode();

const computedIcon = computed(() => {
  if (currentColorMode.value === 'dark') {
    return '/white_adventures_logo.webp';
  } else {
    return '/black_adventures_logo.webp';
  }
});

//TODO: SSR oder nicht ssr sodass die initale website schneller lädt und die adventures erst nachträglich geladen werden?
const { data: adventures, pending, error, refresh } = await useFetch<AdventureWithMeta[]>('/api/v1/app/adventures/', {
  key: FETCH_KEY_FOR_YOU_PAGE,
  query: mask,
  watch: false,
});
</script>