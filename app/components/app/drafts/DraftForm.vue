<template>
  <div class="mx-auto max-w-4xl w-full min-h-screen">
    <!-- Sticky Header with Save Status -->
    <header class="sticky top-0 z-10 bg-background/95 backdrop-blur">
      <div class="flex items-center justify-between p-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-semibold line-clamp-1">
            {{ values.title || 'Neues Adventure' }}
          </h1>
          <p class="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <!-- Save Status Indicator -->
            <span v-if="isSaving" class="flex items-center gap-1">
              <Loader2 class="h-3 w-3 animate-spin" />
              Speichern...
            </span>
            <span v-else-if="lastSaved" class="flex items-center gap-1 text-primary">
              <CheckCircle class="h-3 w-3" />
              Gespeichert
            </span>
            <span v-else class="flex items-center gap-1">
              <Circle class="h-3 w-3" />
              Nicht gespeichert
            </span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Delete Draft -->
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="ghost" size="icon">
                <Trash2 class="h-4 w-4 text-destructive" />
                <span class="sr-only">Entwurf löschen</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Entwurf löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Dieser Entwurf und alle hochgeladenen Bilder werden unwiderruflich gelöscht.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction class="bg-destructive" @click="deleteDraft">
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="ghost" size="icon" as-child>
            <NuxtLink to="/adventures/drafts">
              <X class="h-5 w-5" />
              <span class="sr-only">Schließen</span>
            </NuxtLink>
          </Button>
        </div>
      </div>

      <!-- Progress Bar -->
      <Progress :model-value="completionPercent" />
    </header>

    <main class="p-4 sm:p-6 pb-32">
      <form class="space-y-6" @submit.prevent="onSubmit">
        <!-- Bilder -->
        <FormField v-slot="{ componentField }" name="pictureIds">
          <FormItem>
            <FormControl>
              <AppDraftsImagesForm v-bind="componentField" :draft-id="draftId" :draft-pictures="draftData?.pictures" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Basis Info -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <FileText class="h-5 w-5" />
              Informationen
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <FormField v-slot="{ componentField }" name="title">
              <FormItem>
                <FormLabel>Titel </FormLabel>
                <FormControl>
                  <Input type="text" placeholder="z.B. Wanderung zum Sonnenaufgang" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="description">
              <FormItem>
                <FormLabel>Beschreibung </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Beschreibe dein Abenteuer..."
                    v-bind="componentField"
                    rows="4"
                    class="resize-none"
                  />
                </FormControl>
                <FormDescription>
                  {{ (values.description?.length || 0) }}/1000 Zeichen
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ field, handleChange, }" name="tags">
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagsSelector
                    :max="MAX_SELECTORS_SELECTED"
                    :model-value="field.value"
                    @update:model-value="handleChange"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </CardContent>
        </Card>

        <!-- Details -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Settings class="h-5 w-5" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField v-slot="{ componentField }" name="difficulty">
                <FormItem>
                  <FormLabel>Schwierigkeit </FormLabel>
                  <FormControl>
                    <ToggleGroup
                      variant="outline"
                      type="single"
                      class="grid grid-cols-3 w-full"
                      v-bind="componentField"
                    >
                      <ToggleGroupItem value="easy" class="data-[state=on]:bg-green-500/20">
                        Leicht
                      </ToggleGroupItem>
                      <ToggleGroupItem value="medium" class="data-[state=on]:bg-yellow-500/20">
                        Mittel
                      </ToggleGroupItem>
                      <ToggleGroupItem value="hard" class="data-[state=on]:bg-red-500/20">
                        Schwer
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="category">
                <FormItem>
                  <FormLabel>Kategorie</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      variant="outline"
                      type="single"
                      class="grid grid-cols-2 w-full"
                      v-bind="componentField"
                    >
                      <ToggleGroupItem value="outdoor">
                        <Sun class="h-4 w-4 mr-1" />
                        Outdoor
                      </ToggleGroupItem>
                      <ToggleGroupItem value="indoor">
                        <Home class="h-4 w-4 mr-1" />
                        Indoor
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <Separator />

            <!-- Location (unchanged but with better UX) -->
            <FormField v-slot="{ field, setValue, value }" name="location">
              <FormItem>
                <FormLabel>Standort </FormLabel>
                <FormControl>
                  <div class="space-y-3">
                    <!-- Location Search -->

                    <div>
                      <div class="relative">
                        <Input v-model="searchQuery" placeholder="Ort suchen..." />
                        <div class="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 v-if="searchIsLoading" class="h-4 w-4 animate-spin" />
                          <MapPin v-else class="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      <ol class="mt-2 flex flex-wrap gap-4">
                        <li v-for="location in foundLocations" :key="location.name">
                          <Badge
                            variant="secondary"
                            :class="cn('cursor-pointer', isGeoLocationSame(location, value) ? 'border-primary bg-primary/10' : '')"
                            @click="setValue(location)"
                          >
                            <component :is="isGeoLocationSame(location, value) ? MapPinCheck : MapPin" />
                            <span class="max-w-32 line-clamp-1">
                              {{ location.displayname }}
                            </span>
                          </Badge>
                        </li>
                        <li v-if="value && foundLocations.length == 0">
                          <Badge variant="secondary" class="border-primary bg-primary/10">
                            <MapPinCheck />
                            <span class="max-w-32 line-clamp-1">
                              {{ value.displayname }}
                            </span>
                          </Badge>
                        </li>
                      </ol>
                    </div>

                    <!-- Map Preview -->
                    <div class="h-48 sm:h-64 w-full rounded-lg overflow-hidden border bg-muted mt-4">
                      <template v-if="field.value?.coordinates">
                        <LMap
                          :zoom="13"
                          :center="field.value.coordinates"
                          class="h-full w-full z-0"
                          :use-global-leaflet="false"
                          @ready="setMap"
                        >
                          <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <LMarker :lat-lng="field.value.coordinates" />
                        </LMap>
                      </template>
                      <template v-else>
                        <div class="h-full flex flex-col items-center justify-center text-muted-foreground">
                          <MapPin class="h-8 w-8 mb-2" />
                          <p class="text-sm">
                            Suche einen Ort oder klicke auf die Karte
                          </p>
                        </div>
                      </template>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </CardContent>
        </Card>

        <!-- Zeitplanung -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Clock class="h-5 w-5" />
              Zeitplanung
            </CardTitle>
            <CardDescription>
              Wann findet das Adventure statt und wie lange dauert es?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField v-slot="{ field, handleChange }" name="schedule">
              <FormItem>
                <FormControl>
                  <AppDraftsEventScheduleForm :model-value="field.value" @update:model-value="handleChange" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </CardContent>
        </Card>

        <!-- Settings -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Cog class="h-5 w-5" />
              Weitere Einstellungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField v-slot="{ componentField }" name="visibility">
              <FormItem class="flex items-center justify-between rounded-lg border p-4 flex-wrap">
                <div class="space-y-0.5">
                  <FormLabel class="font-medium">
                    Sichtbarkeit
                  </FormLabel>
                  <p class="text-xs text-muted-foreground">
                    Andere können dieses Adventure entdecken
                  </p>
                </div>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    v-bind="componentField"
                    class="flex flex-nowrap overflow-x-hidden"
                  >
                    <ToggleGroupItem value="private">
                      <EyeOffIcon />
                      Privat
                    </ToggleGroupItem>
                    <ToggleGroupItem value="public">
                      <EyeIcon />
                      Öffentlich
                    </ToggleGroupItem>
                    <ToggleGroupItem value="unlisted">
                      <BookKeyIcon />
                      Nicht gelistet
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormControl>
              </FormItem>
            </FormField>
          </CardContent>
        </Card>
      </form>
    </main>

    <!-- Mobile Footer -->
    <footer class="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 sm:hidden z-10">
      <div class="max-w-4xl mx-auto flex gap-2">
        <Button
          type="submit"
          class="flex-1"
          :disabled="isPublishing"
          @click="onSubmit"
        >
          <Loader2 v-if="isPublishing" class="h-4 w-4 mr-2 animate-spin" />
          <Send v-else class="h-4 w-4 mr-2" />
          Veröffentlichen
        </Button>
        <Button
          type="button"
          variant="outline"
          :disabled="isSaving"
          @click="saveNow"
        >
          <Loader2 v-if="isSaving" class="h-4 w-4 animate-spin" />
          <Save v-else class="h-4 w-4" />
        </Button>
      </div>
    </footer>

    <!-- Desktop Footer -->
    <div class="hidden sm:block max-w-4xl mx-auto px-6 pb-6">
      <Separator class="mb-6" />
      <div class="flex items-center justify-between">
        <Button type="button" variant="ghost" as-child>
          <NuxtLink to="/adventures/drafts">
            Abbrechen
          </NuxtLink>
        </Button>
        <div class="flex gap-2">
          <Button
            type="button"
            variant="outline"
            :disabled="isSaving"
            @click="saveNow"
          >
            <Loader2 v-if="isSaving" class="h-4 w-4 mr-2 animate-spin" />
            <Save v-else class="h-4 w-4 mr-2" />
            Speichern
          </Button>
          <Button type="submit" :disabled="isPublishing || !lastSaved" @click="onSubmit">
            <Loader2 v-if="isPublishing" class="h-4 w-4 mr-2 animate-spin" />
            <Send v-else class="h-4 w-4 mr-2" />
            Veröffentlichen
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { toTypedSchema } from '@vee-validate/zod';
import { refDebounced, useDebounceFn } from '@vueuse/core';
import type { LeafletMouseEvent, Map } from 'leaflet';
import {
  BookKeyIcon,
  CheckCircle, Circle, Clock,
  Cog,
  EyeIcon,
  EyeOffIcon,
  FileText,
  Home,
  Loader2,
  MapPin,
  MapPinCheck,
  Save, Send,
  Settings,
  Sun,
  Trash2,
  X
} from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { cn } from '~/lib/utils';
import { MAX_SELECTORS_SELECTED } from '~~/shared/constants/Constants';
import { DraftFormSchema } from '~~/shared/schema/DraftSchema';
import type { GeoLocation } from '~~/shared/types/GeoTypes';
import { calculateCompletionPercent } from '~~/shared/utils/SharedUtils';
import TagsSelector from './TagsSelector.vue';

const props = defineProps<{
  draftId: string
  draftData: AdventureDraftWithPictures
}>();

const { handleSubmit, setValues, values, setFieldValue, meta, errors } = useForm({
  validationSchema: toTypedSchema(DraftFormSchema),
  initialValues: {
    ...props.draftData.formData,
    pictureIds: props.draftData.pictureIds,
  }
});

// Save state
const isSaving = ref(false);
const isPublishing = ref(false);
const lastSaved = ref<Date | null>(null);

// Location search
const searchQuery = ref('');
const searchIsLoading = ref(false);
const foundLocations = shallowRef<GeoLocation[]>([]);
const debouncedSearchQuery = refDebounced(searchQuery, 500);
const currentMap = shallowRef<Map>();

// Completion progress
const completionPercent = computed(() => {
  if (!values) return 0;
  return calculateCompletionPercent({ pictureIds: values.pictureIds || [], formData: values });
});

// Auto-save (debounced)
const autoSave = useDebounceFn(async () => {
  if (!meta.value.touched) return;
  await saveNow();
}, 3500);

// Watch for form changes
watch(values, () => {
  lastSaved.value = null;

  autoSave();
}, { deep: true });

// Manual save
const saveNow = async () => {
  isSaving.value = true;
  try {
    await $fetch(`/api/v1/app/adventures/drafts/${props.draftId}/save`, {
      method: 'POST',
      body: {
        formData: {
          title: values.title,
          description: values.description,
          tags: values.tags,
          difficulty: values.difficulty,
          category: values.category,
          location: values.location,
          schedule: values.schedule,
          visibility: values.visibility,
        },
        pictureIds: values.pictureIds,
      },
    });
    lastSaved.value = new Date();
  } catch (err) {
    console.error('Speichern fehlgeschlagen:', err);
  } finally {
    isSaving.value = false;
  }
};

// Publish
const onSubmit = handleSubmit(async () => {
  isPublishing.value = true;
  try {
    // Save first
    await saveNow();

    // Then publish
    const adventureId = await $fetch(`/api/v1/app/adventures/drafts/${props.draftId}/publish`, {
      method: 'POST',
    });

    await navigateTo(`/adventures/${adventureId}`);
  } catch (err) {
    console.error('Veröffentlichung fehlgeschlagen:', err);
  } finally {
    isPublishing.value = false;
  }
});

// Delete draft
const deleteDraft = async () => {
  try {
    await $fetch(`/api/v1/app/adventures/drafts/${props.draftId}`, { method: 'DELETE' });
    await navigateTo('/adventures/drafts');
  } catch (err) {
    console.error('Löschen fehlgeschlagen:', err);
  }
};

// Location search
watch(debouncedSearchQuery, async (query) => {
  if (query.length < 3) {
    foundLocations.value = [];
    return;
  }

  searchIsLoading.value = true;
  try {
    foundLocations.value = await $fetch<GeoLocation[]>('/api/v1/app/geo/searchAddress', {
      params: { address: query },
    });
  } finally {
    searchIsLoading.value = false;
  }
});

const isGeoLocationSame = (first: GeoLocation, second: GeoLocation) => {
  if (!first || !second) return;
  return first.coordinates.toString() === second.coordinates.toString();
}

// Map click handler
const setMap = (map: Map) => {
  currentMap.value = map;
  map.on('click', async (e: LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;

    const response = await $fetch('/api/v1/app/geo/resolveLatLon', {
      method: 'GET',
      query: {
        latitude: lat,
        longitude: lng,
      }
    });

    setFieldValue('location', {
      displayname: response.city,
      coordinates: [lat, lng],
      name: response.state,
      type: 'Point',
    });
  });
};
</script>