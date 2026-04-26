<template>
  <NuxtLink :to="{ name: 'adventures-adventureId', params: { 'adventureId': adventure._id }, query: useRoute().query }"
    class="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md"
    prefetch>
    <div class="relative">
      <AppMiscImageScrollGallery :picture-ids="adventure.pictureIds"
        :style="{ 'view-transition-name': `adventure-image-${adventure._id}` }" />
      <div class="absolute top-2 left-2">
        <AppAdventuresTagsSelectorGraphic :selected-tags="adventure.tags" />
      </div>
      <div class="absolute top-2 right-2 text-xs text-white/90 bg-black/50 px-2 py-1 rounded-lg">
        {{ $tc('component_adventures_views_count', { count: adventure.viewCount.totalViews }) }}
      </div>
    </div>

    <div class="flex flex-col gap-3 p-4">
      <!-- Title row -->
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <button v-if="adventure.source.provider === 'user'" class="text-xs font-medium text-muted-foreground p-0.5"
            @click.stop.prevent="goToAuthor()">
            {{ t('component_adventures_author_prefix', { name: adventure.author.name }) }}
          </button>
          <h2 class="line-clamp-1 text-base font-semibold leading-snug"
            :style="{ 'view-transition-name': `adventure-title-${adventure._id}` }">
            {{ adventure.title }}
          </h2>
          <p class="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {{ adventure.description }}
          </p>
        </div>
        <div class="shrink-0">
          <AppPlaylistsAddToPlaylistDialog :adventure="adventure" class="ml-auto" />
          <AppAdventuresLikeButton :is-liked="adventure.isLikedByUser" :adventure-id="adventure._id"
            :likes-count="adventure.likesCount" />
        </div>
      </div>

      <!-- Meta tiles -->
      <div class="grid grid-cols-3 gap-2">
        <div class="rounded-lg border bg-muted/40 px-2.5 py-2">
          <div class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarDays class="size-3" />
            {{ t('component_adventures_tile_date') }}
          </div>
          <p class="mt-1 line-clamp-1 text-xs font-semibold">
            {{ scheduleSummary }}
          </p>
        </div>

        <div class="rounded-lg border bg-muted/40 px-2.5 py-2">
          <div class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Timer class="size-3" />
            {{ t('component_adventures_tile_duration') }}
          </div>
          <p class="mt-1 line-clamp-1 text-xs font-semibold">
            {{ formatDurationRange(adventure.schedule.estimatedDuration) }}
          </p>
        </div>

        <!-- Location tile: map popover or indoor/outdoor fallback -->
        <div>
          <Popover v-if="adventure.location?.coordinates">
            <PopoverTrigger as-child>
              <button type="button"
                class="w-full rounded-lg border bg-muted/40 px-2.5 py-2 text-left transition-colors hover:bg-muted/60"
                @click.stop.prevent>
                <div
                  class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <MapPin class="size-3" />
                  {{ adventure.location.distance ? t('component_adventures_tile_distance') :
                    t('component_adventures_tile_location') }}
                </div>
                <p class="mt-1 line-clamp-1 text-xs font-semibold">
                  {{ adventure.location.distance
                    ? formatDistance(adventure.location.distance)
                    : shortLocation ?? t('common_untitled') }}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent class="w-72 overflow-hidden p-0" side="top">
              <ClientOnly>
                <LMap :zoom="13" :center="adventure.location.coordinates" class="h-44 aspect-square w-full"
                  style="z-index: 0" :use-global-leaflet="false">
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
              class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin class="size-3" />
              {{ t('component_adventures_tile_category') }}
            </div>
            <p class="mt-1 line-clamp-1 text-xs font-semibold">
              {{ t(categoryConfig.labelKey) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Badge strip -->
      <div class="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
        <Badge variant="outline" :class="difficultyConfig.class">
          <Activity class="size-3" />
          {{ t(difficultyConfig.labelKey) }}
        </Badge>
        <Badge variant="outline">
          <component :is="categoryConfig.icon" class="size-3" />
          {{ t(categoryConfig.labelKey) }}
        </Badge>
        <Badge v-if="adventure.schedule.repeatsAnnually" variant="outline" class="gap-1">
          <Repeat2 class="size-3" />
          {{ t('component_adventures_yearly_repeat') }}
        </Badge>
      </div>
    </div>
  </NuxtLink>
</template>

<script lang="ts" setup>
import { formatDistance, formatDurationRange } from '#shared/utils/SharedUtils';
import {
  Activity,
  CalendarDays,
  Home,
  MapPin,
  Repeat2,
  ScaleIcon,
  Timer,
  TreePine
} from 'lucide-vue-next';
import type { AdventureWithMeta } from '~~/shared/types/AdventureTypes';

const props = defineProps<{
  adventure: AdventureWithMeta;
}>();

const { t, getLocale } = useI18n();

const goToAuthor = () => {
  navigateTo({ name: 'profile-authorId', params: { authorId: props.adventure.author._id } });
};

// Difficulty
const difficultyConfigs = {
  easy: { labelKey: 'component_search_filter_difficulty_easy', class: 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400' },
  medium: { labelKey: 'component_search_filter_difficulty_medium', class: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  hard: { labelKey: 'component_search_filter_difficulty_hard', class: 'border-red-500/20   bg-red-500/10   text-red-700   dark:text-red-400' },
} as const;
const difficultyConfig = computed(() => difficultyConfigs[props.adventure.difficulty]);

// Category
const categoryConfigs = {
  indoor: { labelKey: 'component_adventures_category_indoor', icon: Home },
  outdoor: { labelKey: 'component_adventures_category_outdoor', icon: TreePine },
  mixed: { labelKey: 'component_adventures_category_mixed', icon: ScaleIcon },
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
const dateFormatter = new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'long' });

const scheduleSummary = computed(() => {
  const { schedule } = props.adventure;
  switch (schedule.type) {
    case 'single':
      return dateFormatter.format(new Date(schedule.startDate!));
    case 'range':
      return dateFormatter.formatRange(new Date(schedule.startDate!), new Date(schedule.endDate!));
    default:
      return t('component_adventures_schedule_flexible');
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