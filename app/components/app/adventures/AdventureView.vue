<template>
  <main>
    <header
      class="sticky top-0 bg-card text-card-foreground shadow-xl rounded-b-lg py-2 flex w-full z-20 max-w-3xl mx-auto border-b"
    >
      <AppNavigationGoBackButton :variant="'ghost'" :size="'icon'" />
      <div class="min-w-0 flex-1">
        <h1
          :style="{ 'view-transition-name': `adventure-title-${adventure?._id}` }"
          class="text-lg font-semibold ml-2 truncate"
        >
          {{ adventure.title }}
        </h1>
        <p class="text-sm text-muted-foreground ml-2 truncate">
          von {{ adventure.author.name }}
        </p>
      </div>
    </header>

    <section class="py-2 sticky top-18 max-w-2xl mx-auto w-full">
      <AppAdventuresDynamicGallery :images="adventure.pictureIds" />
    </section>

    <section class="max-w-2xl mx-auto w-full flex flex-col gap-6 py-4 px-4 bg-card rounded-lg shadow relative">
      <!-- Quick Info Bar -->
      <div class="flex items-center justify-between gap-4 pb-4 border-b border-border">
        <div class="flex items-center gap-4 text-sm text-muted-foreground">
          <span v-if="adventure.difficulty" class="flex items-center gap-1">
            <Signal class="h-4 w-4" />
            {{ getDifficultyLabel(adventure.difficulty) }}
          </span>
          <span v-if="adventure.location" class="flex items-center gap-1">
            <MapPin class="h-4 w-4" />
            <span class="line-clamp-1 max-w-48">{{ adventure.location.displayname }}</span>
          </span>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1">
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
            <Share2 class="h-5 w-5" />
            <span class="sr-only">Teilen</span>
          </Button>
          <LazyAppAdventuresEditButton v-if="isOwner" :adventure="adventure" />
        </div>
      </div>

      <AppAdventuresTagsSelectorGraphic :selected-tags="adventure.tags" />

      <div>
        <h2 class="text-lg font-semibold mb-2">
          Beschreibung
        </h2>
        <p class="text-base text-muted-foreground whitespace-pre-line leading-relaxed">
          {{ adventure.description }}
        </p>
      </div>

      <AppAdventuresEventScheduleGraphic :schedule="adventure.schedule" />

      <div v-if="adventure.location">
        <div class="mb-2">
          <h2 class="text-lg font-semibold">
            Standort
          </h2>
          <p class="text-muted-foreground text-sm">
            Der Standort des Events
          </p>
        </div>
        <div class="-mx-2.5 h-72 w-auto overflow-hidden border-y bg-muted sm:mx-0 sm:w-full sm:rounded-lg sm:border">
          <LMap
            :zoom="13"
            :center="adventure.location.coordinates"
            class="h-full w-full"
            :use-global-leaflet="false"
          >
            <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <LMarker :lat-lng="adventure.location.coordinates">
              <LIcon class-name="rounded-full size-10! flex! items-center justify-center bg-background/30">
                <MapPinnedIcon class="size-5 text-black" />
              </LIcon>
            </LMarker>
            <LMarker v-if="geolocation" :lat-lng="[geolocation.location.latitude, geolocation.location.longitude]">
              <LIcon class-name="rounded-full size-10! flex! items-center justify-center bg-background/30">
                <HouseHeartIcon class="size-5 text-black" />
              </LIcon>
            </LMarker>
          </LMap>
        </div>
        <div class="flex flex-wrap gap-2 text-sm mt-1">
          <div class="flex gap-2 text-muted-foreground items-center">
            <MapPinnedIcon class="size-4" />
            Event-Standort
          </div>
          <div v-if="geolocation" class="flex gap-2 text-muted-foreground items-center">
            <HouseHeartIcon class="size-4" />
            Dein Standort
          </div>
        </div>
      </div>

      <NuxtLink
        :to="`/profile/${adventure.author._id}`"
        class="flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-accent transition-colors"
      >
        <Avatar class="h-12 w-12">
          <AvatarImage
            v-if="adventure.author.profilePictureId"
            :src="toPicturePath(adventure.author.profilePictureId)"
            :alt="adventure.author.name"
          />
          <AvatarFallback>
            {{ adventure.author.name?.charAt(0).toUpperCase() }}
          </AvatarFallback>
        </Avatar>
        <div class="flex-1 min-w-0">
          <p class="font-medium truncate">
            {{ adventure.author.name }}
          </p>
          <p class="text-sm text-muted-foreground">
            Autor ansehen
          </p>
        </div>
        <ChevronRight class="h-5 w-5 text-muted-foreground shrink-0" />
      </NuxtLink>

      <div class="text-xs text-muted-foreground text-right">
        Erstellt am
        <NuxtTime :datetime="adventure.createdAt" />
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
import type { AdventureWithMeta } from '#shared/types/AdventureTypes';
import { toPicturePath } from "#shared/utils/SharedUtils";
import { useShare } from '@vueuse/core';
import {
  ChevronRight,
  HouseHeartIcon,
  MapPin,
  MapPinnedIcon,
  Share2,
  Signal
} from 'lucide-vue-next';

const props = defineProps<{
  adventure: AdventureWithMeta;
}>();

const { geolocation } = useGeoLocation();

const { share, isSupported: isSharingSupported } = useShare({
  title: `${props.adventure.title} - Abenteuer entdecken`,
  text: 'Schau dir dieses Abenteuer an!',
  url: useRoute().fullPath,
});

const openShareDialog = () => {
  share();
}


const getDifficultyLabel = (difficulty: string): string => {
  const labels: Record<string, string> = {
    easy: 'Leicht',
    medium: 'Mittel',
    hard: 'Schwer',
  };
  return labels[difficulty] || difficulty;
};

const isOwner = computed(() => {
  return props.adventure.authorId === useUser().value?._id;
});


</script>