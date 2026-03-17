<template>
  <ComboboxRoot
    v-model="selectedCity"
    class="relative"
    :ignore-filter="true"
    :highlight-on-hover="true"
  >
    <ComboboxAnchor class="w-full flex bg-input/30 border border-border rounded-lg">
      <ComboboxInput
        v-model="search"
        class="w-full py-1 px-2 rounded-lg outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        :display-value="(val) => val?.place ?? ''"
        placeholder="Stadt eingeben..."
        autocomplete="off"
      />
      <ComboboxTrigger>
        <SearchIcon class="size-4" />
        <span class="sr-only">Stadt suchen</span>
      </ComboboxTrigger>
      <ComboboxCancel>
        <span class="sr-only">Suche abbrechen</span>
        <X class="size-4" />
      </ComboboxCancel>
    </ComboboxAnchor>
    <ComboboxContent class="w-full">
      <ComboboxViewport>
        <ComboboxEmpty class="p-4 text-center text-sm text-muted-foreground">
          Keine Ergebnisse gefunden.
        </ComboboxEmpty>
        <ComboboxItem
          v-for="result in results"
          :key="result._id"
          :value="result"
          class="cursor-pointer hover:bg-accent rounded-md"
        >
          <div class="flex items-center gap-2">
            <MapPin class="size-4" />
            <span>{{ result.place }}</span> <span class="text-sm text-muted-foreground">({{ result.zipcode }})</span>
          </div>
          <ComboboxItemIndicator class="absolute right-2">
            <Check class="size-4" />
          </ComboboxItemIndicator>
        </ComboboxItem>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxRoot>
</template>

<script lang="ts" setup>
import { refDebounced } from '@vueuse/core';
import { Check, MapPin, SearchIcon, X } from 'lucide-vue-next';
import { ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from 'reka-ui';

const props = defineProps<{
    selectedCity: GeoDBEntry | undefined;
}>();

const emits = defineEmits<{
    'update:selectedCity': [value: GeoDBEntry | undefined];
}>();

const selectedCity = ref(props.selectedCity);
const search = ref('');
const results = ref<GeoDBEntry[]>([]);
const debouncedSearch = refDebounced(search, 500);

watch(debouncedSearch, async (newValue) => {
    if (newValue.length < 3) {
        results.value = [];
        return;
    }

    const response = await $fetch('/api/v1/app/geo/searchCity', {
        method: 'GET',
        query: { query: newValue },
    });

    results.value = response ?? [];
});

watch(selectedCity, (newValue) => {
    emits('update:selectedCity', newValue ?? undefined);
});
</script>