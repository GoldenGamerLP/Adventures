<template>
  <div class="max-w-2xl mx-auto w-full">
    <!-- Header with backdrop blur -->
    <header
      class="w-full sticky top-0 z-30 bg-background/80 backdrop-blur-sm py-2 flex items-center border-b border-border/50 h-18"
    >
      <Button variant="ghost" size="icon" as-child>
        <NuxtLink :to="{ name: 'index', query: $route.query }">
          <ChevronLeft class="h-5 w-5" />
          <span class="sr-only">Zurück zu Adventures</span>
        </NuxtLink>
      </Button>
      <div class="min-w-0 flex-1">
        <h1
          :style="{ 'view-transition-name': `adventure-title-${adventure?._id}` }"
          class="text-lg font-semibold ml-2 truncate"
        >
          {{ computedHeaderTitle }}
        </h1>
        <p class="text-sm text-muted-foreground ml-2 truncate">
          {{ computedHeaderDescription }}
        </p>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="!adventure && !error" class="p-4 space-y-4">
      <Skeleton class="h-64 w-full rounded-lg" />
      <Skeleton class="h-24 w-full" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle class="h-8 w-8 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>Adventure nicht gefunden</EmptyTitle>
          <EmptyDescription>
            Das angeforderte Adventure konnte nicht gefunden werden. Es könnte gelöscht worden sein oder die
            URL ist ungültig.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" @click="$router.go(0)">
            Seite neu laden
          </Button>
        </EmptyContent>
      </Empty>
    </div>

    <!-- Main Content -->
    <main v-else-if="adventure" class="relative">
      <!-- Gallery Section -->
      <div class="z-0 sticky top-18">
        <AppAdventuresDynamicGallery :images="adventure.pictureIds" />
      </div>

      <!-- Content Section - overlaps gallery with solid background -->
      <div class="relative -mt-8 rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div
          class="absolute -top-12 inset-x-0 bg-linear-to-b from-transparent via-background to-background h-32 z-10"
          aria-hidden="true"
        ></div>
        <div class="space-y-6 px-4 py-6 z-20 relative">
          <!-- Quick Info Bar -->
          <div class="flex items-center justify-between gap-4 pb-4 border-b border-border">
            <div class="flex items-center gap-4 text-sm text-muted-foreground">
              <span v-if="adventure.difficulty" class="flex items-center gap-1">
                <Signal class="h-4 w-4" />
                {{ getDifficultyLabel(adventure.difficulty) }}
              </span>
              <span v-if="adventure.location" class="flex items-center gap-1">
                <MapPin class="h-4 w-4" />
                <span class="line-clamp-1 max-w-48">{{ adventure.location.displayName }}</span>
              </span>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1">
              <AppAdventuresLikeButton
                :is-liked="adventure.isLikedByUser"
                :adventure-id="adventure._id"
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

          <!-- Description -->
          <section>
            <h2 class="text-lg font-semibold mb-2">
              Beschreibung
            </h2>
            <p class="text-base text-muted-foreground whitespace-pre-line leading-relaxed">
              {{ adventure.description }}
            </p>
          </section>

          <!-- Tags -->
          <section v-if="adventure.tags?.length">
            <h2 class="text-lg font-semibold mb-2">
              Tags
            </h2>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="tag in adventure.tags"
                :key="tag"
                variant="secondary"
                class="text-sm capitalize"
              >
                {{ tag }}
              </Badge>
            </div>
          </section>

          <!-- Eventschedule -->
          <section v-if="adventure.schedule">
            <AppAdventuresEventScheduleGraphic :schedule="adventure.schedule" />
          </section>

          <!-- Author Card -->
          <section class="pt-4 border-t border-border">
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
          </section>

          <!-- Map Preview (if location exists) -->
          <section v-if="adventure.location?.coordinates" class="pt-4">
            <h2 class="text-lg font-semibold mb-2">
              Standort
            </h2>
            <div class="h-48 rounded-lg overflow-hidden border border-border">
              <ClientOnly>
                <LMap
                  :zoom="13"
                  :center="adventure.location.coordinates"
                  class="h-full w-full"
                  :use-global-leaflet="false"
                >
                  <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LMarker :lat-lng="adventure.location.coordinates" />
                </LMap>
                <template #fallback>
                  <div class="h-full flex items-center justify-center bg-muted">
                    <MapPin class="h-8 w-8 text-muted-foreground" />
                  </div>
                </template>
              </ClientOnly>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import type { AdventureWithMeta } from '#shared/types/AdventureTypes';
import { toPicturePath } from "#shared/utils/SharedUtils";
import { useShare } from '@vueuse/core';
import {
  AlertCircle,
  ChevronLeft, ChevronRight,
  MapPin,
  Share2,
  Signal
} from 'lucide-vue-next';

const route = useRoute();
const adventureId = route.params.adventureId as string;

const { data: adventure, error } = await useFetch<AdventureWithMeta>(
    `/api/v1/app/adventures/${adventureId}`,
    {
        method: 'GET',
        query: route.query,
        deep: true,
    }
);

const computedHeaderDescription = computed(() => {
    if (!adventure.value) return 'Das Abenteuer konnte nicht geladen werden.';
    const parts = [];
    if (adventure.value.difficulty) {
        parts.push(getDifficultyLabel(adventure.value.difficulty));
    }

    if (adventure.value.location) {
        parts.push(adventure.value.location.displayName.slice(0, 20)); // Limit location name to 20 characters
    }

    if (adventure.value.author) {
        parts.push(`von ${adventure.value.author.name}`);
    }

    return parts.join(' • ');
});

const computedHeaderTitle = computed(() => {
    return adventure.value ? adventure.value.title : 'Adventure nicht gefunden';
});


const { share, isSupported: isSharingSupported } = useShare({
    title: `${adventure.value?.title} - Abenteuer entdecken`,
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
    return adventure.value?.authorId === useUser().value?._id;
});

useHead({
    titleTemplate: (titleChunk) => {
        return titleChunk ? `${titleChunk} | Abenteuer entdecken` : 'Abenteuer entdecken';
    },
    title: () => adventure.value ? adventure.value.title : 'Adventure nicht gefunden',
    meta: [
        {
            name: 'description',
            content: adventure.value ? adventure.value.description : 'Das angeforderte Abenteuer konnte nicht gefunden werden.',
        },
        {
            property: 'og:title',
            content: adventure.value ? adventure.value.title : 'Adventure nicht gefunden',
        },
        {
            property: 'og:description',
            content: adventure.value ? adventure.value.description : 'Das angeforderte Abenteuer konnte nicht gefunden werden.',
        },
        {
            property: 'og:image',
            content: adventure.value && adventure.value.pictureIds.length > 0
                ? toPicturePath(adventure.value.pictureIds[0])
                : undefined,
        },
    ],
})
</script>