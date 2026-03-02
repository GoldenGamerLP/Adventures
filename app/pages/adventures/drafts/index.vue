<template>
  <div class="max-w-4xl w-full mx-auto">
    <header class="sticky top-0 bg-background z-10 border-b border-b-border">
      <div class="flex items-center justify-between px-4 py-2">
        <div class="flex flex-col">
          <h1 class="text-xl sm:text-2xl font-semibold">
            Entwürfe
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            {{ drafts?.length || 0 }} von {{ DRAFT_CONFIG.MAX_DRAFTS_PER_USER }} Entwürfen
          </p>
        </div>
        <Button variant="ghost" size="icon" as-child>
          <NuxtLink to="/">
            <X class="h-5 w-5" />
            <span class="sr-only">Schließen</span>
          </NuxtLink>
        </Button>
      </div>
    </header>

    <main class="p-4 space-y-4">
      <!-- Limit Warning -->
      <Alert v-if="isAtLimit" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Limit erreicht</AlertTitle>
        <AlertDescription>
          Lösche oder veröffentliche Entwürfe, um neue zu erstellen.
        </AlertDescription>
      </Alert>

      <!-- Empty State -->
      <div v-if="!drafts?.length" class="flex flex-col items-center justify-center py-16 text-center">
        <FileText class="h-12 w-12 text-muted-foreground mb-4" />
        <h2 class="text-lg font-medium mb-2">
          Keine Entwürfe
        </h2>
        <p class="text-sm text-muted-foreground mb-6">
          Erstelle deinen ersten Entwurf für ein Abenteuer.
        </p>
        <AppDraftsCreateNewDraft :is-at-limit="isAtLimit" />
      </div>

      <!-- Draft List -->
      <template v-else>
        <ul class="space-y-2">
          <li v-for="draft in drafts" :key="draft._id">
            <Card class="hover:bg-accent/50 transition-colors group">
              <NuxtLink :to="`/adventures/drafts/${draft._id}`" class="flex gap-4 p-4">
                <!-- Thumbnail -->
                <div class="size-20 rounded-lg overflow-hidden shrink-0 bg-muted">
                  <img
                    v-if="draft.pictureIds?.length"
                    :src="toPicturePath(draft.pictureIds[0])"
                    :alt="draft.formData.title || 'Entwurf'"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <ImageOff class="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <h2 class="font-semibold line-clamp-1">
                      {{ draft.formData.title || 'Unbenannt' }}
                    </h2>
                    <!-- Progress Badge -->
                    <Badge variant="outline" class="shrink-0">
                      {{ getCompletionPercent(draft) }}%
                    </Badge>
                  </div>

                  <p class="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {{ draft.formData.description || 'Keine Beschreibung' }}
                  </p>

                  <!-- Meta -->
                  <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span class="flex items-center gap-1">
                      <Clock class="h-3 w-3" />
                      <NuxtTime :datetime="draft.updatedAt" relative />
                    </span>
                    <span :class="getExpiryClass(draft)" class="flex items-center gap-1">
                      <Timer class="h-3 w-3" />
                      Läuft ab
                      <NuxtTime :datetime="draft.expiresAt" relative />
                    </span>
                  </div>
                </div>

                <!-- Actions (visible on hover) -->
                <div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  <ChevronRight class="h-5 w-5 text-muted-foreground" />
                </div>
              </NuxtLink>
            </Card>
          </li>
        </ul>

        <!-- New Draft Button -->
        <AppDraftsCreateNewDraft :is-at-limit="isAtLimit" />
      </template>
    </main>
  </div>
</template>

<script lang="ts" setup>
import {
    X, FileText, ImageOff, Clock, Timer,
    ChevronRight, AlertCircle
} from 'lucide-vue-next';
import { DRAFT_CONFIG } from '~~/shared/constants/Constants';
import type { AdventureDraft } from '~~/shared/types/DraftTypes';
import { toPicturePath } from "#shared/utils/SharedUtils";

definePageMeta({
    layout: 'navigation-bar',
    middleware: 'auth-requirement',
});

const { data: drafts } = await useFetch<AdventureDraft[]>('/api/v1/app/adventures/drafts');

const isAtLimit = computed(() =>
    (drafts.value?.length || 0) >= DRAFT_CONFIG.MAX_DRAFTS_PER_USER
);

const getCompletionPercent = (draft: AdventureDraft): number => {
    const fields = ['title', 'description', 'location', 'difficulty'] as const;
    const filled = fields.filter(f => draft.formData[f]).length;
    const formProgress = (filled / fields.length) * 80;
    const pictureProgress = draft.pictureIds.length > 0 ? 20 : 0;
    return Math.round(formProgress + pictureProgress);
};

const getExpiryClass = (draft: AdventureDraft): string => {
    const hoursLeft = (new Date(draft.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursLeft < 2) return 'text-destructive';
    if (hoursLeft < 6) return 'text-destructive/80';
    return '';
};
</script>