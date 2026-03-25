<template>
  <div class="max-w-2xl w-full mx-auto">
    <header class="py-2 border-b flex items-center gap-1">
      <AppNavigationGoBackButton :variant="'ghost'" :size="'icon'" :force-href="true" />
      <div class="grid">
        <h1 class="text-xl sm:text-2xl font-semibold">
          Entwürfe
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ drafts?.length || 0 }} von {{ DRAFT_CONFIG.MAX_DRAFTS_PER_USER }} Entwürfen
        </p>
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

      <Empty v-if="!drafts?.length">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText class="h-12 w-12 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>Keine Entwürfe</EmptyTitle>
          <EmptyDescription>
            Erstelle deinen ersten Entwurf für ein Abenteuer.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <AppDraftsCreateNewDraft :is-at-limit="isAtLimit" />
        </EmptyContent>
      </Empty>

      <!-- Draft List -->
      <template v-else>
        <ItemGroup>
          <template v-for="(draft, index) in drafts" :key="draft._id">
            <NuxtLink :to="`/adventures/drafts/${draft._id}`" prefetch>
              <Item>
                <ItemMedia :variant="draft.pictureIds.length ? 'image' : 'icon'">
                  <img
                    v-if="draft.pictureIds.length"
                    :src="toPicturePath(draft.pictureIds[0])"
                    alt="Entwurf"
                    class="w-full h-full object-cover rounded"
                  />
                  <ImageOff v-else class="h-6 w-6 text-muted-foreground" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {{ draft.formData.title || 'Unbenannt' }}
                  </ItemTitle>
                  <ItemDescription>
                    {{ draft.formData.description || 'Keine Beschreibung' }}
                  </ItemDescription>
                  <div class="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
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
                </ItemContent>
              </Item>
            </NuxtLink>
            <ItemSeparator v-if="index < drafts.length - 1" />
          </template>
        </ItemGroup>

        <!-- New Draft Button -->
        <AppDraftsCreateNewDraft :is-at-limit="isAtLimit" />
      </template>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { toPicturePath } from "#shared/utils/SharedUtils";
import {
  AlertCircle,
  Clock,
  FileText, ImageOff,
  Timer
} from 'lucide-vue-next';
import { DRAFT_CONFIG } from '~~/shared/constants/Constants';
import type { AdventureDraft } from '~~/shared/types/DraftTypes';

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