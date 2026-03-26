<template>
  <div class="max-w-2xl mx-auto w-full">
    <nav class="sticky top-0 mt-1 bg-background z-10 flex flex-col gap-2 pt-2 pb-1 border-b border-b-muted">
      <div class="flex items-center mx-2 sm:mx-0">
        <h1 class="font-semibold inline-flex items-center gap-1 mr-auto tracking-widest">
          <img :src="computedIcon" class="size-8" alt="" />
          <span>{{ $t('common_app_name') }}</span>
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
              <span class="sr-only">{{ $t('sr_open_drafts') }}</span>
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
              <span class="sr-only">{{ $t('sr_open_profile_settings') }}</span>
            </NuxtLink>
          </Button>

          <LazyAppMiscThemeToggle v-if="!user" variant="ghost" />
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
          <EmptyTitle>{{ $t('error_load_adventures') }}</EmptyTitle>
          <EmptyDescription class="text-xs">
            {{ error }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            size="sm"
            :disabled="pending"
            @click="refreshAndReload"
          >
            {{ $t('common_actions_retry') }}
          </Button>
        </EmptyContent>
      </Empty>

      <!-- Empty State -->
      <Empty v-else-if="!adventures?.length">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchAlert />
          </EmptyMedia>
          <EmptyTitle>{{ $t('empty_no_adventures_title') }}</EmptyTitle>
          <EmptyDescription>
            {{ $t('empty_no_adventures_description') }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            size="sm"
            :disabled="pending"
            @click="refreshAndReload()"
          >
            {{ $t('common_actions_reset_filters') }}
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
import { refDebounced } from '@vueuse/core';
import { BookMarkedIcon, SearchAlert, UserCog } from 'lucide-vue-next';
import { FETCH_KEY_FOR_YOU_PAGE } from '~~/shared/constants/Constants';
import type { AdventureWithMeta } from '~~/shared/types/AdventureTypes';

const { $t } = useI18n();

definePageMeta({
  layout: 'navigation-bar'
});

useHead({
  title: () => $t('title') as string,
  meta: [
    {
      name: 'description',
      content: $t('meta_description') as string,
    },
    {
      name: 'keywords',
      content: $t('meta_keywords') as string,
    },
  ],
});

useSeoMeta({
  ogTitle: () => $t('title') as string,
  ogDescription: () => $t('meta_description') as string,
  ogImage: '/white_adventures_logo.webp',
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
const { data: adventures, pending, error, refresh } = useFetch<AdventureWithMeta[]>('/api/v1/app/adventures/', {
  key: FETCH_KEY_FOR_YOU_PAGE,
  query: refDebounced(mask, 1500),
  watch: false,
});

const refreshAndReload = () => {
  resetFilters();
  refresh();
};
</script>