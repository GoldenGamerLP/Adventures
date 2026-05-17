<template>
  <main class="mx-auto max-w-6xl space-y-4 p-0 sm:space-y-6 sm:p-4">
    <header class="sticky top-0 z-1001 border-b border-border/60 bg-background/80 py-1 px-2 text-shadow-xs text-shadow-accent-foreground backdrop-blur-lg supports-[backdrop-filter]:bg-background/70">
      <div class="flex items-start gap-2">
        <AppNavigationGoBackButton :variant="'ghost'" :size="'icon'" class="shrink-0" />

        <h1
          :style="{ 'view-transition-name': `adventure-title-${adventure._id}` }"
          class="scroll-m-20 text-left text-3xl font-extrabold tracking-tight text-balance line-clamp-1"
        >
          {{ adventure.title }}
        </h1>
      </div>
    </header>

    <section class="overflow-hidden rounded-2xl">
      <AppMiscImageScrollGallery
        :picture-ids="adventure.pictureIds"
        :style="{ 'view-transition-name': `adventure-image-${adventure._id}` }"
        @click-image="openLightbox"
      />
    </section>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-[66%_34%]">
      <!-- Description and Quick Actions -->
      <section class="rounded-xl border bg-card p-6 text-card-foreground shadow-sm md:col-span-2">
        <div class="flex flex-col gap-3 border-b border-border pb-2.5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="scroll-m-20 text-2xl font-semibold tracking-tight">
              {{ $t('component_adventures_view_description_title') }}
            </h2>
            <p class="text-sm text-muted-foreground">
              {{ $t('component_adventures_view_description_description') }}
            </p>
          </div>

          <div class="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
            <AppPlaylistsAddToPlaylistDialog :adventure="adventure" />
            <AppAdventuresLikeButton
              :is-liked="adventure.isLikedByUser"
              :adventure-id="adventure._id"
              :likes-count="adventure.likesCount"
            />
            <Button
              variant="ghost"
              size="icon"
              :disabled="!isSharingSupported"
              @click="openShareDialog"
            >
              <Share2 class="size-5" />
              <span class="sr-only">{{ $t('component_adventures_share_sr') }}</span>
            </Button>
            <LazyAppAdventuresEditButton v-if="isOwner" :adventure="adventure" />
          </div>
        </div>

        <div class="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <Signal class="size-4" aria-hidden="true" />
              {{ getDifficultyLabel(adventure.difficulty) }}
            </Badge>
            <Badge variant="outline">
              <Clock3 class="size-4" aria-hidden="true" />
              {{ durationLabel }}
            </Badge>
            <Badge variant="outline">
              <component :is="categoryConfig.icon" class="size-4" aria-hidden="true" />
              {{ $t(categoryConfig.labelKey) }}
            </Badge>
            <Badge variant="outline">
              <Eye class="size-4" aria-hidden="true" />
              {{ $tc('common_views_plural', { count: adventure.viewCount.totalViews }) }}
            </Badge>
          </div>

          <AppMiscTextWrapper>
            <p class="leading-7 not-first:mt-6 whitespace-pre-wrap">
              {{ adventure.description }}
            </p>
          </AppMiscTextWrapper>
        </div>
      </section>

      <!-- Tags -->
      <section class="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h2 class="scroll-m-20 text-2xl font-semibold tracking-tight">
          {{ $t('component_adventures_view_tags_title') }}
        </h2>
        <p class="text-sm text-muted-foreground mb-6">
          {{ $t('component_adventures_view_tags_description') }}
        </p>

        <AppAdventuresTagsSelectorGraphic :selected-tags="adventure.tags" />
      </section>

      <!-- Schedule -->
      <section class="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h2 class="scroll-m-20 text-2xl font-semibold tracking-tight">
          {{ $t('component_adventures_view_schedule_title') }}
        </h2>
        <p class="text-sm text-muted-foreground mb-6">
          {{ $t('component_adventures_view_schedule_description') }}
        </p>

        <AppAdventuresEventScheduleGraphic :schedule="adventure.schedule" />
      </section>

      <!-- Location -->
      <aside
        class="h-fit rounded-xl border bg-card p-6 text-card-foreground shadow-sm md:row-start-2 md:col-start-2 md:row-span-4 md:sticky md:top-12"
      >
        <h2 class="scroll-m-20 text-2xl font-semibold tracking-tight">
          {{ $t('component_adventure_view_location_title') }}
        </h2>
        <p class="text-sm text-muted-foreground mb-6">
          {{ adventure.location?.displayname || $t('common_no_location') }}
        </p>

        <LazyLMap
          :zoom="14"
          :center="adventure.location?.coordinates"
          :use-global-leaflet="false"
          class="h-40 w-full overflow-hidden rounded-md sm:h-56 aspect-square"
        >
          <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base" name="OpenStreetMap" />
          <LMarker :lat-lng="adventure.location!.coordinates">
            <LIcon class-name="flex! size-10! items-center justify-center rounded-full bg-secondary/50">
              <MapPinnedIcon class="size-5 text-secondary-foreground" aria-hidden="true" />
            </LIcon>
          </LMarker>
          <LMarker v-if="geolocation" :lat-lng="[geolocation.location.latitude, geolocation.location.longitude]">
            <LIcon class-name="flex! size-10! items-center justify-center rounded-full bg-secondary/50">
              <HouseHeartIcon class="size-5 text-secondary-foreground" aria-hidden="true" />
            </LIcon>
          </LMarker>
        </LazyLMap>

        <!-- Icon Information -->
        <div class="mt-3 space-y-2">
          <div class="flex items-center tracking-wide font-semibold">
            <div class="rounded-full bg-secondary/50 p-2">
              <MapPinnedIcon class="text-secondary-foreground size-4.5" aria-hidden="true" />
            </div>
            <p class="ml-2 text-xs text-muted-foreground line-clamp-1">
              {{ adventure.location ? adventure.location.displayname : $t('common_no_location') }}
            </p>
          </div>
          <div v-if="geolocation" class="flex items-center tracking-wide font-semibold">
            <div class="rounded-full bg-secondary/50 p-2">
              <HouseHeartIcon class="text-secondary-foreground size-4.5" aria-hidden="true" />
            </div>
            <p class="ml-2 text-xs text-muted-foreground line-clamp-1">
              {{ $t('component_adventures_your_location') }}
            </p>
          </div>
        </div>

        <Separator class="mt-2" />
        <DropdownMenu>
          <DropdownMenuTrigger as-child class="w-full mt-3">
            <Button class="w-full" variant="secondary">
              {{ $t('component_adventures_view_routeplanner_open') }}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="bottom" class="w-78">
            <DropdownMenuItem as-child>
              <NuxtLink
                :to="`https://google.com/maps/search/${encodeURIComponent(adventure.location?.displayname || '')}`"
                target="_blank"
                rel="noopener"
                :external="true"
              >
                Google Maps
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem as-child>
              <NuxtLink
                :to="`https://www.openstreetmap.org/search?query=${encodeURIComponent(adventure.location?.displayname || '')}`"
                target="_blank"
                rel="noopener"
                :external="true"
              >
                OpenStreetMap
              </NuxtLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>

      <!-- Source Information -->
      <section class="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h2 class="scroll-m-20 text-2xl font-semibold tracking-tight">
          {{ $t('component_adventure_view_source_title') }}
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ $t('component_adventure_view_source_description') }}
        </p>

        <NuxtLink
          v-if="adventure.source.provider === 'user'"
          :to="`/profile/${adventure.author._id}`"
          class="flex items-center gap-3 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-accent"
        >
          <Avatar class="h-10 w-10 sm:h-11 sm:w-11">
            <AvatarImage
              v-if="adventure.author.profilePictureId"
              :src="toPicturePath(adventure.author.profilePictureId)"
              :alt="adventure.author.name"
            />
            <AvatarFallback>
              {{ adventure.author.name?.charAt(0).toUpperCase() }}
            </AvatarFallback>
          </Avatar>
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium">
              {{ adventure.author.name }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ $t('common_view_profile') }}
            </p>
          </div>
          <ChevronRightIcon class="size-4.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </NuxtLink>

        <div
          v-if="adventureSourceIsReview(adventure.source)"
          class="mt-4 rounded-xl border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground"
        >
          {{ $t('component_adventures_view_imported_from_wikipedia_at', {
            date: td(adventure.createdAt, { dateStyle: 'medium', timeStyle: 'short' }),
            author: adventure.author.name,
            source: adventure.source.wikipediaPageId,
            attribution: adventure.source.attribution || 'N/A'
          }) }}
        </div>

        <div
          v-if="adventureSourceIsUser(adventure.source)"
          class="mt-4 rounded-xl border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground"
        >
          {{ $t('component_adventures_view_created_at', {
            date: td(adventure.createdAt, {
              dateStyle: 'medium', timeStyle:
                'short'
            })
          }) }}
        </div>
      </section>

      <section class="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h2 class="scroll-m-20 text-2xl font-semibold tracking-tight">
          {{ $t('component_adventure_view_similar_title') }}
        </h2>
        <p class="text-sm text-muted-foreground mb-4">
          {{ $t('component_adventure_view_similar_description') }}
        </p>

        <LazyAppAdventuresSimilarAdventures
          :adventure-id="adventure._id"
          :location="adventure.location"
          :hydrate-on-visible="true"
        />
      </section>
    </div>
  </main>

  <LazyAppMiscLightbox ref="lightboxRef" :images="adventure.pictureIds" />
</template>

<script lang="ts" setup>
import type { AdventureSource, AdventureWithMeta, UserAdventureSource, WikipediaAdventureSource } from '#shared/types/AdventureTypes';
import { formatDurationRange } from '#shared/utils/SharedUtils';
import { useShare } from '@vueuse/core';
import {
  ChevronRightIcon,
  Clock3,
  Eye,
  HouseHeartIcon,
  MapPinnedIcon,
  Share2,
  Signal,
  TreePine
} from 'lucide-vue-next';
import type Lightbox from '../misc/Lightbox.vue';

const props = defineProps<{
  adventure: AdventureWithMeta;
}>();

const lightboxRef = ref<InstanceType<typeof Lightbox>>();
const { $t, td } = useI18n();
const route = useRoute();
const { geolocation } = useGeoLocation();

const { share, isSupported: isSharingSupported } = useShare({
  title: `${props.adventure.title} - Abenteuer entdecken`,
  text: 'Schau dir dieses Abenteuer an!',
  url: route.fullPath,
});

const categoryConfigMap = {
  indoor: { labelKey: 'component_adventures_category_indoor', icon: TreePine },
  outdoor: { labelKey: 'component_adventures_category_outdoor', icon: TreePine },
  mixed: { labelKey: 'component_adventures_category_mixed', icon: TreePine },
} as const;

const categoryConfig = computed(() => categoryConfigMap[props.adventure.category]);

const durationLabel = computed(() => formatDurationRange(props.adventure.schedule.estimatedDuration));

const isOwner = computed(() => {
  const currentUserId = useUser().value?._id;

  if (!currentUserId) {
    return false;
  }

  if (props.adventure.source.provider === 'user') {
    return props.adventure.source.userId === currentUserId;
  }

  return props.adventure.source.review?.reviewerId === currentUserId;
});

const adventureSourceIsUser = (source: AdventureSource): source is UserAdventureSource => source.provider === 'user';
const adventureSourceIsReview = (source: AdventureSource): source is WikipediaAdventureSource => source.provider === 'wikipedia';

const openShareDialog = () => {
  share();
};

const openLightbox = (index: number) => {
  lightboxRef.value?.open(index);
};

const getDifficultyLabel = (difficulty: string): string => {
  const labels: Record<string, string> = {
    easy: $t('component_search_filter_difficulty_easy'),
    medium: $t('component_search_filter_difficulty_medium'),
    hard: $t('component_search_filter_difficulty_hard'),
  };

  return labels[difficulty] || difficulty;
};
</script>