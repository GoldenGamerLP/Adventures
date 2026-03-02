<template>
  <NuxtLink
    :to="{ name: 'adventures-adventureId', params: { 'adventureId': adventure._id }, query: useRoute().query }"
    class="border rounded-lg border-border flex flex-col overflow-hidden"
  >
    <Carousel v-slot="{ carouselApi }" class="relative w-full">
      <CarouselContent>
        <CarouselItem v-for="picture in adventure.pictureIds" :key="picture">
          <img
            :src="toPicturePath(picture)"
            alt="Adventure Image"
            loading="lazy"
            class="w-full h-72 object-cover rounded-t-lg"
          />
        </CarouselItem>
      </CarouselContent>
      <ol
        v-if="(carouselApi?.scrollSnapList().length || 0) > 1"
        class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-50"
      >
        <li v-for="(_, index) in carouselApi?.scrollSnapList()" :key="index" class="inline-block">
          <button
            variant="outline"
            size="icon"
            class="size-2.5 p-0 rounded-full"
            :aria-label="`Bild ${index + 1} von ${carouselApi?.scrollSnapList().length}`"
            :class="carouselApi?.selectedScrollSnap() === index ? 'bg-muted' : 'bg-muted/50'"
          >
          </button>
        </li>
      </ol>
    </Carousel>
    <ol class="flex gap-2 mt-1.5 ml-1.5 flex-nowrap overflow-x-auto pb-1 noscrollbar">
      <li v-for="tag in adventure.tags" :key="tag" class="inline-block">
        <Badge variant="secondary" class="text-xs capitalize">
          {{ tag }}
        </Badge>
      </li>
    </ol>
    <div class="flex items-center justify-between">
      <div class="p-2">
        <h2
          class="text-lg font-semibold line-clamp-1 max-w-sm"
          :style="{ 'view-transition-name': `adventure-title-${adventure._id}` }"
        >
          {{ adventure.title }}
        </h2>
        <p class="text-muted-foreground line-clamp-1 max-w-sm">
          {{ adventure.description }}
        </p>
      </div>
      <div class="p-4 pt-0">
        <AppAdventuresLikeButton :is-liked="adventure.isLikedByUser" :adventure-id="adventure._id" />
      </div>
    </div>
    <!-- Author, Map, Difficulty, Indoor/outdoor -->
    <div
      class="border-t border-t-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground gap-4"
    >
      <div class="flex items-center shrink-0 gap-1">
        <Eye class="size-4" />
        <span>{{ adventure.viewCount.totalViews }} Aufrufe</span>
      </div>
      <div v-if="adventure.location" class="flex items-center gap-1 shrink-0">
        <MapPin class="size-4" />
        <span v-if="adventure.location.distance">{{ formatDistance(adventure.location?.distance) }}
          Entfernung</span>
      </div>
      <div v-if="adventure.schedule" class="flex items-center gap-1 shrink-0">
        <Clock class="size-4" />
        <span>
          {{ adventure.schedule.type === 'single'
            ? 'Festes Datum'
            : 'Flexibler Zeitpunkt' }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script lang="ts" setup>
import { formatDistance, toPicturePath } from "#shared/utils/SharedUtils";
import { Clock, Eye, MapPin } from 'lucide-vue-next';

import type { AdventureWithMeta } from '~~/shared/types/AdventureTypes';

defineProps<{
  adventure: AdventureWithMeta;
}>();
</script>

<style scoped>
.noscrollbar {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}
</style>