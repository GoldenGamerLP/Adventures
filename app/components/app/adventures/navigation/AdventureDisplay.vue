<template>
  <NuxtLink
    :to="{ name: 'adventures-adventureId', params: { 'adventureId': adventure._id }, query: useRoute().query }"
    class="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md"
    prefetch
  >
    <Carousel v-slot="{ carouselApi }" class="relative w-full">
      <CarouselContent>
        <CarouselItem v-for="picture in adventure.pictureIds" :key="picture">
          <img
            :src="toPicturePath(picture)"
            alt="Adventure Image"
            loading="lazy"
            class="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </CarouselItem>
      </CarouselContent>
      <div class="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-3">
        <AppAdventuresTagsSelectorGraphic :selected-tags="adventure.tags" class="max-w-[75%]" />
        <Badge
          variant="secondary"
          class="border border-background/60 bg-background/85 text-[11px] shadow-sm backdrop-blur"
        >
          <Eye class="size-3.5" />
          {{ adventure.viewCount.totalViews }}
        </Badge>
      </div>
      <div class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-card/90 to-transparent"></div>
      <ol
        v-if="(carouselApi?.scrollSnapList().length || 0) > 1"
        class="absolute bottom-2.5 left-1/2 z-30 flex -translate-x-1/2 gap-1.5 bg-muted/60 px-3 rounded-full"
      >
        <li v-for="(_, index) in carouselApi?.scrollSnapList()" :key="index" class="inline-block">
          <button
            class="size-2 rounded-full transition-all duration-200"
            :aria-label="`Bild ${index + 1} von ${carouselApi?.scrollSnapList().length}`"
            :class="carouselApi?.selectedScrollSnap() === index ? 'bg-primary w-4' : 'bg-muted-foreground'"
          ></button>
        </li>
      </ol>
    </Carousel>
    <div class="flex flex-col gap-3 p-4">
      <!-- Title row -->
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="mb-0.5 text-[11px] font-medium text-muted-foreground/60">
            von {{ adventure.author.name }}
          </p>
          <h2
            class="line-clamp-1 text-base font-semibold leading-snug"
            :style="{ 'view-transition-name': `adventure-title-${adventure._id}` }"
          >
            {{ adventure.title }}
          </h2>
          <p class="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {{ adventure.description }}
          </p>
        </div>
        <div class="shrink-0 pt-0.5">
          <AppAdventuresLikeButton
            :is-liked="adventure.isLikedByUser"
            :adventure-id="adventure._id"
            :likes-count="adventure.likesCount"
          />
        </div>
      </div>

      <!-- Meta tiles -->
      <div class="grid grid-cols-3 gap-2">
        <div class="rounded-lg border bg-muted/40 px-2.5 py-2">
          <div class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarDays class="size-3" />
            Datum
          </div>
          <p class="mt-1 line-clamp-1 text-xs font-semibold">
            {{ scheduleSummary }}
          </p>
        </div>

        <div class="rounded-lg border bg-muted/40 px-2.5 py-2">
          <div class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Timer class="size-3" />
            Dauer
          </div>
          <p class="mt-1 line-clamp-1 text-xs font-semibold">
            {{ formatDurationRange(adventure.schedule.estimatedDuration) }}
          </p>
        </div>

        <!-- Location tile: map popover or indoor/outdoor fallback -->
        <div>
          <Popover v-if="adventure.location?.coordinates">
            <PopoverTrigger as-child>
              <button
                type="button"
                class="w-full rounded-lg border bg-muted/40 px-2.5 py-2 text-left transition-colors hover:bg-muted/60"
                @click.stop.prevent
              >
                <div
                  class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  <MapPin class="size-3" />
                  {{ adventure.location.distance ? 'Entfernung' : 'Ort' }}
                </div>
                <p class="mt-1 line-clamp-1 text-xs font-semibold">
                  {{ adventure.location.distance
                    ? formatDistance(adventure.location.distance)
                    : shortLocation ?? '–' }}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent class="w-72 overflow-hidden p-0" side="top">
              <ClientOnly>
                <LMap
                  :zoom="13"
                  :center="adventure.location.coordinates"
                  class="h-44 aspect-square w-full"
                  style="z-index: 0"
                  :use-global-leaflet="false"
                >
                  <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LMarker :lat-lng="adventure.location.coordinates" />
                </LMap>
              </ClientOnly>
              <p class="line-clamp-2 px-3 py-2 text-xs text-muted-foreground">
                {{ adventure.location.displayname }}
              </p>
            </PopoverContent>
          </Popover>
          <div v-else class="rounded-lg border bg-muted/40 px-2.5 py-2">
            <div
              class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <MapPin class="size-3" />
              Bereich
            </div>
            <p class="mt-1 line-clamp-1 text-xs font-semibold">
              {{ categoryConfig.label }}
            </p>
          </div>
        </div>
      </div>

      <!-- Badge strip -->
      <div class="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
        <Badge variant="outline" :class="difficultyConfig.class">
          <Activity class="size-3" />
          {{ difficultyConfig.label }}
        </Badge>
        <Badge variant="outline">
          <component :is="categoryConfig.icon" class="size-3" />
          {{ categoryConfig.label }}
        </Badge>
        <Badge v-if="adventure.schedule.repeatsAnnually" variant="outline" class="gap-1">
          <Repeat2 class="size-3" />
          Jährl. wiederkehrend
        </Badge>
      </div>
    </div>
  </NuxtLink>
</template>

<script lang="ts" setup>
import { formatDistance, formatDurationRange, toPicturePath } from '#shared/utils/SharedUtils';
import {
  Activity,
  ArrowLeftRight,
  CalendarDays,
  Eye,
  Home,
  MapPin,
  Repeat2,
  Timer,
  TreePine,
} from 'lucide-vue-next';
import type { AdventureWithMeta } from '~~/shared/types/AdventureTypes';

const props = defineProps<{
  adventure: AdventureWithMeta;
}>();

// Difficulty
const difficultyConfigs = {
  easy: { label: 'Leicht', class: 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400' },
  medium: { label: 'Mittel', class: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  hard: { label: 'Schwer', class: 'border-red-500/20   bg-red-500/10   text-red-700   dark:text-red-400' },
} as const;
const difficultyConfig = computed(() => difficultyConfigs[props.adventure.difficulty]);

// Category
const categoryConfigs = {
  indoor: { label: 'Indoor', icon: Home },
  outdoor: { label: 'Outdoor', icon: TreePine },
  mixed: { label: 'Indoor & Outdoor', icon: ArrowLeftRight },
} as const;
const categoryConfig = computed(() => categoryConfigs[props.adventure.category]);

// Short location: prefer city/town over full Nominatim string
const shortLocation = computed(() => {
  const loc = props.adventure.location;
  if (!loc) return null;
  if (loc.address) {
    const place = loc.address.city ?? loc.address.town ?? loc.address.village ?? loc.address.suburb;
    if (place) return place;
  }
  return loc.displayname.split(',')[0]?.trim() ?? loc.displayname;
});

// Schedule summary with full written dates
const dateFormatter = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long' });

const scheduleSummary = computed(() => {
  const { schedule } = props.adventure;
  switch (schedule.type) {
    case 'single':
      return dateFormatter.format(new Date(schedule.startDate!));
    case 'range':
      return dateFormatter.formatRange(new Date(schedule.startDate!), new Date(schedule.endDate!));
    default:
      return "Flexible";
  }
});
</script>

<style scoped>
.noscrollbar {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}
</style>