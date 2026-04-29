<template>
  <div class="max-w-2xl mx-auto w-full">
    <nav class="sticky top-0 mt-1 bg-background z-10 flex flex-col gap-2 pt-2 pb-1 border-b border-b-muted h-26">
      <div class="flex items-center mx-2 sm:mx-0">
        <h1 class="font-semibold inline-flex items-center gap-1 mr-auto tracking-widest">
          <img :src="computedIcon" class="size-8" alt="" />
          <span>{{ $t('common_app_name') }}</span>
        </h1>

        <!-- Action Buttons -->
        <div class="flex items-center gap-1">
          <!-- Create Adventure Button -->
          <Button v-if="user" variant="ghost" size="icon" as-child>
            <NuxtLink :to="{ name: 'adventures-drafts' }">
              <BookMarkedIcon />
              <span class="sr-only">{{ $t('sr_open_drafts') }}</span>
            </NuxtLink>
          </Button>

          <Button v-if="user" variant="ghost" size="icon" as-child>
            <NuxtLink :to="{ name: 'profile' }">
              <UserCog />
              <span class="sr-only">{{ $t('sr_open_profile_settings') }}</span>
            </NuxtLink>
          </Button>

          <LazyAppMiscThemeToggle v-if="!user" variant="ghost" />
          <LazyAppAuthCredentialsActionDrawer v-if="!user" />
        </div>
      </div>
      <section class="flex items-center gap-2 mx-2 py-1.5 sm:mx-0 overflow-x-auto touch-pan-x">
        <AppNavigationPillnavShowChangeLocation />
        <AppAdventuresNavigationAdventureSearch />
        <AppAdventuresNavigationMaskPills />
      </section>
    </nav>

    <main>
      <!-- Loading State -->
      <div v-if="isFetchingNewAdventures && !accumulatedAdventures.length" class="mt-6 space-y-4">
        <AppAdventuresNavigationAdventureSkeleton v-for="i in 3" :key="i" />
      </div>

      <!-- Error State -->
      <Empty v-else-if="hasError">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchAlert />
          </EmptyMedia>
          <EmptyTitle>{{ $t('error_load_adventures') }}</EmptyTitle>
          <EmptyDescription class="text-xs">
            {{ errorMessage }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" :disabled="isFetchingNewAdventures" @click="resetFilters">
            {{ $t('common_actions_reset_filters') }}
          </Button>
        </EmptyContent>
      </Empty>

      <!-- Empty State -->
      <Empty v-else-if="!accumulatedAdventures.length && !isFetchingNewAdventures">
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
          <Button variant="outline" size="sm" :disabled="isFetchingNewAdventures" @click="resetFilters">
            {{ $t('common_actions_reset_filters') }}
          </Button>
        </EmptyContent>
      </Empty>

      <!-- Adventures List -->
      <div v-else ref="listElement" class="mt-3">
        <div class="relative w-full" :style="{
          height: `${totalSize}px`,
        }">
          <div v-for="virtualRow in virtualRows" :key="String(virtualRow.key)" class="absolute top-0 left-0 w-full"
            :style="{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }">
            <div v-if="accumulatedAdventures[virtualRow.index]">
              <LazyAppAdventuresNavigationAdventureDisplay :adventure="accumulatedAdventures[virtualRow.index]!" />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { useWindowVirtualizer } from '@tanstack/vue-virtual';
import { BookMarkedIcon, SearchAlert, UserCog } from 'lucide-vue-next';

//TODO: wenn fetchingadventures und liste ist leer body attribute ändern sodass man beim laden nicht scroll kann
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

const searchMaskObject = useSearchMask();
const { resetFilters, fetchNextPage } = searchMaskObject;
const { mask, accumulatedAdventures, isFetchingNewAdventures, hasNextPage, hasError, errorMessage } = searchMaskObject;

const user = useUser();
const { currentColorMode } = useColorMode();

const rowVirtualizerOptions = computed(() => ({
  count: hasNextPage.value ? accumulatedAdventures.value.length + 1 : accumulatedAdventures.value.length,
  estimateSize: () => 545,
  overscan: 3,
}));

const rowVirtualizer = useWindowVirtualizer(rowVirtualizerOptions);
const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

watchEffect(() => {
  const [lastItem] = [...virtualRows.value].reverse();

  if (!lastItem) {
    return;
  }

  if (
    lastItem.index >= accumulatedAdventures.value.length - 1
    && hasNextPage.value
    && !isFetchingNewAdventures.value
  ) {
    fetchNextPage();
  }
});

onMounted(() => {
  fetchNextPage(true);
})

const computedIcon = computed(() => {
  if (currentColorMode.value === 'dark') {
    return '/white_adventures_logo.webp';
  } else {
    return '/black_adventures_logo.webp';
  }
});
</script>