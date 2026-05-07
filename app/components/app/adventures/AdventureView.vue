<template>
  <main
    class="mx-auto flex w-full max-w-3xl flex-col gap-3 px-3 pb-8 pt-2 sm:max-w-4xl sm:px-4 sm:pt-3 lg:max-w-5xl lg:px-8"
  >
    <header class="">
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

    <section class="rounded-2xl border bg-card p-3 shadow-sm sm:p-4 lg:p-5">
      <div class="flex flex-wrap items-start justify-between gap-2.5 border-b border-border pb-2.5">
        <div class="space-y-0.5">
          <h2 class="scroll-m-20 text-2xl font-semibold tracking-tight">
            {{ $t('component_adventures_description_title') }}
          </h2>
          <p class="text-sm text-muted-foreground">
            Eine kompakte Übersicht mit den wichtigsten Informationen zum Abenteuer.
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-1">
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
        <div class="flex flex-wrap items-center gap-1">
          <Badge variant="secondary">
            <Signal />
            {{ getDifficultyLabel(adventure.difficulty) }}
          </Badge>
          <Badge variant="outline">
            <Clock3 />
            {{ durationLabel }}
          </Badge>
          <Badge variant="outline">
            <component :is="categoryConfig.icon" />
            {{ $t(categoryConfig.labelKey) }}
          </Badge>
          <Badge variant="outline">
            <Eye />
            {{ $tc('component_adventures_views_count', { count: adventure.viewCount.totalViews }) }}
          </Badge>
        </div>

        <p class="leading-7 not-first:mt-6 whitespace-pre-wrap max-h-64 overflow-y-auto">
          {{ adventure.description }}
        </p>
      </div>
    </section>

    <div class="grid gap-4 md:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-6">
      <div class="flex flex-col gap-4 lg:gap-6">
        <section class="rounded-2xl border bg-card p-3 shadow-sm sm:p-4 lg:p-6">
          <div class="mb-2.5 flex items-center justify-between gap-2.5 sm:mb-3">
            <div class="space-y-0.5">
              <h2 class="scroll-m-20 text-2xl font-semibold tracking-tight">
                Tags
              </h2>
              <p class="text-sm text-muted-foreground">
                Aktivitäten und Themen dieses Abenteuers.
              </p>
            </div>
          </div>

          <AppAdventuresTagsSelectorGraphic :selected-tags="adventure.tags" />
        </section>

        <section class="rounded-2xl border bg-card p-3 shadow-sm sm:p-4 lg:p-6 order-1 lg:order-0">
          <div class="mb-2.5 flex items-center justify-between gap-2.5 sm:mb-3">
            <div class="space-y-0.5">
              <h2 class="scroll-m-20 text-2xl font-semibold tracking-tight">
                {{ $t('component_schedule_title') }}
              </h2>
              <p class="text-sm text-muted-foreground">
                Öffnungszeiten, Dauer und Wiederholungen auf einen Blick.
              </p>
            </div>
          </div>

          <AppAdventuresEventScheduleGraphic :schedule="adventure.schedule" />
        </section>

        <section class="rounded-2xl border bg-card p-3 shadow-sm sm:p-4 lg:p-6 order-3 lg:order-0">
          <div class="mb-3 flex items-center justify-between gap-3 sm:mb-4">
            <div class="space-y-0.5">
              <h2 class="scroll-m-20 text-2xl font-semibold tracking-tight">
                Quelle
              </h2>
              <p class="text-sm text-muted-foreground">
                Informationen zur Herkunft dieses Abenteuers und seinem Ersteller.
              </p>
            </div>
          </div>

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
            <ChevronRightIcon class="size-4.5 shrink-0 text-muted-foreground" />
          </NuxtLink>

          <div
            v-if="adventureSourceIsReview(adventure.source)"
            class="mt-4 rounded-xl border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground"
          >
            {{ $t('component_adventures_imported_from_wikipedia_at', {
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
            {{ $t('component_adventures_created_at', {
              date: td(adventure.createdAt, {
                dateStyle: 'medium', timeStyle:
                  'short'
              })
            }) }}
          </div>
        </section>
      </div>

      <aside class="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start lg:gap-6">
        <section class="rounded-2xl border bg-card p-3 shadow-sm sm:p-4 lg:p-6">
          <div class="mb-3 flex items-center justify-between gap-3 sm:mb-4">
            <div class="space-y-0.5">
              <h2 class="text-base font-semibold">
                Adventure Standort
              </h2>
              <p class="text-xs text-muted-foreground sm:text-sm">
                {{ adventure.location?.displayname || 'Kein Standort angegeben' }}
              </p>
            </div>
          </div>

          <LazyLMap
            :zoom="14"
            :center="adventure.location?.coordinates"
            :use-global-leaflet="false"
            style="height: 14rem; width: 100%;"
            class="overflow-hidden rounded"
          >
            <LTileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              layer-type="base"
              name="OpenStreetMap"
            />
            <LMarker :lat-lng="adventure.location!.coordinates">
              <LIcon class-name="flex! size-10! items-center justify-center rounded-full bg-background/30">
                <MapPinnedIcon class="size-5 text-black" />
              </LIcon>
            </LMarker>
            <LMarker v-if="geolocation" :lat-lng="[geolocation.location.latitude, geolocation.location.longitude]">
              <LIcon class-name="flex! size-10! items-center justify-center rounded-full bg-background/30">
                <HouseHeartIcon class="size-5 text-black" />
              </LIcon>
            </LMarker>
          </LazyLMap>

          <!-- Icon Information -->
          <div class="flex flex-wrap items-center gap-1.5 pt-3">
            <div class="flex items-center tracking-wide font-semibold">
              <div class="rounded-full bg-primary p-2">
                <MapPinnedIcon class="text-primary-foreground size-4.5" />
              </div>
              <span class="ml-2 text-xs text-muted-foreground line-clamp-1">
                {{ adventure.location ? adventure.location.displayname : 'Kein Standort' }}
              </span>
            </div>
            <div v-if="geolocation" class="flex items-center tracking-wide font-semibold">
              <div class="rounded-full bg-primary p-2">
                <HouseHeartIcon class="text-primary-foreground size-4.5" />
              </div>
              <span class="ml-2 text-xs text-muted-foreground line-clamp-1">
                {{ $t('component_adventures_your_location') }}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger as-child class="w-full mt-3">
              <Button class="w-full" variant="default">
                Routenplaner öffnen
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom" class="w-48">
              <DropdownMenuLabel>Anbieter</DropdownMenuLabel>
              <DropdownMenuSeparator />
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
        </section>
      </aside>
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
  Globe,
  HouseHeartIcon,
  Lock,
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
const { $t, td, t } = useI18n();
const route = useRoute();
const { geolocation } = useGeoLocation();

const { share, isSupported: isSharingSupported } = useShare({
  title: `${props.adventure.title} - Abenteuer entdecken`,
  text: 'Schau dir dieses Abenteuer an!',
  url: route.fullPath,
});

const difficultyConfigMap = {
  easy: { labelKey: 'component_search_filter_difficulty_easy', icon: Signal },
  medium: { labelKey: 'component_search_filter_difficulty_medium', icon: Signal },
  hard: { labelKey: 'component_search_filter_difficulty_hard', icon: Signal },
} as const;

const categoryConfigMap = {
  indoor: { labelKey: 'component_adventures_category_indoor', icon: TreePine },
  outdoor: { labelKey: 'component_adventures_category_outdoor', icon: TreePine },
  mixed: { labelKey: 'component_adventures_category_mixed', icon: TreePine },
} as const;

const visibilityConfigMap = {
  public: { label: 'Öffentlich', icon: Globe, class: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  private: { label: 'Privat', icon: Lock, class: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400' },
  unlisted: { label: 'Nicht gelistet', icon: Eye, class: 'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300' },
} as const;

const difficultyConfig = computed(() => difficultyConfigMap[props.adventure.difficulty]);
const categoryConfig = computed(() => categoryConfigMap[props.adventure.category]);
const visibilityConfig = computed(() => visibilityConfigMap[props.adventure.visibility]);

const authorLabel = computed(() => {
  if (props.adventure.source.provider === 'user') {
    return t('component_adventures_author_prefix', { name: props.adventure.author.name });
  }

  return `${props.adventure.source.provider} · ${props.adventure.source.wikipediaPageId}`;
});

const locationSummary = computed(() => {
  const location = props.adventure.location;
  if (!location) {
    return '';
  }

  return location.address?.city
    || location.address?.town
    || location.address?.village
    || location.displayname.split(',')[0]?.trim()
    || location.displayname;
});

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
    easy: 'Leicht',
    medium: 'Mittel',
    hard: 'Schwer',
  };

  return labels[difficulty] || difficulty;
};
</script>