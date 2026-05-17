<template>
  <div v-if="status === 'idle' || status === 'pending'" class="flex flex-row overflow-x-auto gap-3">
    <div v-for="i in 3" :key="i" class="w-64 animate-pulse">
      <Skeleton class="w-full h-40 rounded-lg mb-2" />
      <Skeleton class="w-full h-6 rounded-lg mb-1" />
      <Skeleton class="w-full h-4 rounded-lg" />
    </div>
  </div>

  <div
    v-else-if="similarAdventures?.length === 0"
    class="flex flex-col items-center justify-center gap-2 w-full py-8"
  >
    <SearchAlertIcon class="w-12 h-12 text-muted-foreground" />
    <p class="text-center text-muted-foreground">
      {{ $t('component_adventure_view_similar_empty') }}
    </p>
  </div>

  <div v-else class="relative">
    <div ref="scrollcontainer" class="flex w-full snap-x snap-mandatory gap-x-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
      <div v-for="adventure in similarAdventures" :key="adventure._id" class="relative shrink-0 snap-start">
        <NuxtLink
          :to="{ name: 'adventures-adventureId', params: { 'adventureId': adventure._id } }"
          class="block w-64 rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition hover:bg-accent/50 hover:shadow-md"
        >
          <img
            :src="toPicturePath(adventure.pictureIds[0])"
            :alt="adventure.title"
            loading="lazy"
            class="w-full h-40 object-cover rounded-lg"
            :style="{ 'view-transition-name': `adventure-image-${adventure._id}` }"
          />
          <h3
            class="text-lg font-semibold mt-2 line-clamp-1"
            :style="{ 'view-transition-name': `adventure-title-${adventure._id}` }"
          >
            {{ adventure.title }}
          </h3>
          <p class="text-sm text-muted-foreground line-clamp-1">
            {{ adventure.description }}
          </p>
        </NuxtLink>
      </div>
    </div>
    <Button
      variant="outline"
      size="icon"
      class="absolute -right-4 top-1/2 -translate-y-1/2 z-10"
      :disabled="!canGoNext"
      :aria-label="$t('component_adventure_view_similar_next')"
      @click="scrollToImage(activeIndex + 1)"
    >
      <ChevronRightIcon aria-hidden="true" />
      <span class="sr-only">{{ $t('component_adventure_view_similar_next') }}</span>
    </Button>
    <Button
      variant="outline"
      size="icon"
      class="absolute -left-4 top-1/2 -translate-y-1/2 z-10"
      :disabled="!canGoPrevious"
      :aria-label="$t('component_adventure_view_similar_previous')"
      @click="scrollToImage(activeIndex - 1)"
    >
      <ChevronLeftIcon aria-hidden="true" />
      <span class="sr-only">{{ $t('component_adventure_view_similar_previous') }}</span>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, SearchAlertIcon } from 'lucide-vue-next';

const props = defineProps<{
    adventureId: string;
    location: GeoLocation;
}>();

const { $t } = useI18n();


const { data: similarAdventures, status } = await useFetch("/api/v1/app/adventures/recommendations/findSimilar", {
    method: "get",
    query: {
        adventureId: props.adventureId,
        radius: 150, // 150 km radius
        limit: 3, // max 3 similar adventures
        location: props.location.coordinates,
    },
    lazy: true,
    server: false,
});

const scrollcontainer = ref<HTMLDivElement>();
const activeIndex = ref(0);

// Scroll zu bestimmtem Bild (mobile)
const scrollToImage = (index: number) => {
    if (activeIndex.value < 0 || activeIndex.value >= (similarAdventures.value?.length || 0)) return;
    if (!scrollcontainer.value) return;

    activeIndex.value = index;

    const children = scrollcontainer.value.children;
    if (children[index]) {
        (children[index] as HTMLElement).scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest',
        });
    }
};

const canGoNext = computed(() => {
    return activeIndex.value < (similarAdventures.value?.length || 0) - 1; // max 3 similar adventures
});

const canGoPrevious = computed(() => {
    return activeIndex.value > 0;
});
</script>

<style scoped>
.scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.scrollbar-none::-webkit-scrollbar {
    display: none;
}
</style>