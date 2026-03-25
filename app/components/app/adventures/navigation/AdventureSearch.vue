<template>
  <Popover v-model:open="searchPopoverOpen">
    <PopoverTrigger as-child>
      <Button
        variant="secondary"
        size="icon"
        class="rounded-full"
        :class="hasActiveFilters && 'ring-2 ring-primary ring-offset-1'"
      >
        <SlidersHorizontalIcon />
        <span class="sr-only">{{ $t('component_search_filter_sr_open') }}</span>
      </Button>
    </PopoverTrigger>

    <PopoverContent class="p-0 w-72" :align="'start'">
      <!-- Header -->
      <div class="px-3 pt-3 pb-2">
        <h2 class="text-sm font-semibold">
          {{ $t('component_search_filter_title') }}
        </h2>
        <p class="text-xs text-muted-foreground">
          {{ $t('component_search_filter_subtitle') }}
        </p>
      </div>

      <Separator />

      <!-- Schnell-Filter -->
      <div class="p-1.5 space-y-0.5">
        <!-- Suchbegriff -->
        <div class="px-2 py-1.5">
          <div class="relative">
            <SearchIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              v-model.lazy="searchMask.query"
              :placeholder="$t('component_search_filter_search_placeholder') as string"
              class="pl-8 h-8 text-sm bg-muted/50 border-0 focus-visible:ring-1"
              @keydown.enter="applyAndClose"
            />
          </div>
        </div>

        <Separator class="my-1" />

        <!-- Schwierigkeit -->
        <p class="px-2 pt-1 text-xs font-medium text-muted-foreground">
          {{ $t('component_search_filter_difficulty') }}
        </p>
        <div class="flex items-center gap-1 px-2 pb-1">
          <Button
            v-for="opt in difficultyOptions"
            :key="opt.value"
            variant="outline"
            size="sm"
            class="flex-1 h-7 text-xs gap-1.5"
            :class="mask.difficulty === opt.value && 'border-primary bg-primary/10 text-primary'"
            @click="toggleDifficulty(opt.value)"
          >
            <component :is="opt.icon" class="size-3" />
            {{ opt.label }}
          </Button>
        </div>

        <Separator class="my-1" />

        <!-- Schnell-Optionen als Items -->
        <p class="px-2 pt-1 text-xs font-medium text-muted-foreground">
          {{ $t('component_search_filter_sort') }}
        </p>
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
          :class="mask.sort === opt.value && 'bg-accent text-accent-foreground'"
          @click="toggleSort(opt.value)"
        >
          <div
            class="flex items-center justify-center size-6 rounded-md bg-muted shrink-0"
            :class="mask.sort === opt.value && 'bg-primary/15 text-primary'"
          >
            <component :is="opt.icon" class="size-3.5" />
          </div>
          <div class="flex-1 text-left">
            <p class="text-xs font-medium leading-none">
              {{ opt.label }}
            </p>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{ opt.description }}
            </p>
          </div>
          <Check v-if="mask.sort === opt.value" class="size-3.5 text-primary shrink-0" />
        </button>
      </div>

      <Separator />

      <!-- Footer: Erweitert + Reset -->
      <div class="p-1.5 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          class="h-7 text-xs"
          :disabled="!hasActiveFilters"
          @click="resetAllFilters()"
        >
          <X class="size-3 mr-1" />
          {{ $t('component_search_filter_reset') }}
        </Button>

        <div class="flex items-center gap-1">
          <!-- Erweiterte Filter als Sheet -->
          <Button
            variant="outline"
            size="sm"
            class="h-7 text-xs"
            @click="openAdvanced()"
          >
            <Settings2 class="size-3 mr-1" />
            {{ $t('component_search_filter_advanced') }}
          </Button>
          <Button size="sm" class="h-7 text-xs" @click="applyAndClose()">
            {{ $t('component_search_filter_search') }}
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>

  <!-- Erweiterter Filter Sheet (Radius, Dauer, Tags) -->
  <Sheet v-model:open="extendedSearchOpen">
    <SheetContent side="bottom" class="max-w-2xl mx-auto rounded-t-2xl px-4 pb-8">
      <SheetHeader class="text-left pb-4">
        <SheetTitle>{{ $t('component_search_filter_sheet_title') }}</SheetTitle>
        <SheetDescription>
          {{ $t('component_search_filter_sheet_description') }}
        </SheetDescription>
      </SheetHeader>

      <div class="space-y-5">
        <!-- Radius -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">{{ $t('component_search_filter_radius') }}</label>
            <span class="text-xs font-mono text-muted-foreground">{{ mask.radius ?? 50 }} km</span>
          </div>
          <Slider
            v-model="radiusModel"
            :min="5"
            :max="200"
            :step="5"
          />
        </div>

        <!-- Dauer -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">{{ $t('component_search_filter_duration') }}</label>
            <span class="text-xs font-mono text-muted-foreground">
              {{ formatDuration(durationModel[0]!) }} – {{ formatDuration(durationModel[1]!) }}
            </span>
          </div>
          <Slider
            v-model="durationModel"
            :min="15"
            :max="1440"
            :step="15"
          />
        </div>

        <!-- Tags -->
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ $t('component_search_filter_tags') }}</label>
          <LazyAppDraftsTagsSelector v-model="tagsModel" :max="5" />
        </div>
      </div>

      <SheetFooter class="mt-6 flex-row gap-2">
        <Button variant="outline" class="flex-1" @click="extendedSearchOpen = false">
          {{ $t('component_search_filter_cancel') }}
        </Button>
        <Button class="flex-1" @click="applyAdvancedAndClose">
          {{ $t('component_search_filter_apply') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script lang="ts" setup>
import {
  Check,
  Clock,
  Dumbbell,
  Flame,
  MapPin,
  Mountain,
  SearchIcon,
  Settings2,
  SlidersHorizontalIcon,
  TrendingUp,
  X,
  Zap
} from 'lucide-vue-next';

const { $t } = useI18n();

const { mask, resetFilters, searchPopoverOpen: _sPO, extendedSearchOpen: _eSO, refreshSearch } = useSearchMask();
const extendedSearchOpen = toRef(_eSO);
const searchPopoverOpen = toRef(_sPO);
const searchMask = mask;

//Difficulty
const difficultyOptions = computed(() => [
  { value: 'easy', label: $t('component_search_filter_difficulty_easy') as string, icon: Zap },
  { value: 'medium', label: $t('component_search_filter_difficulty_medium') as string, icon: Mountain },
  { value: 'hard', label: $t('component_search_filter_difficulty_hard') as string, icon: Dumbbell },
] as const);

const toggleDifficulty = (val: 'easy' | 'medium' | 'hard') => {
  if (searchMask.value.difficulty === val) {
    searchMask.value.difficulty = undefined; // Schwierigkeit zurücksetzen, wenn erneut auf die gleiche Option geklickt wird
  } else {
    searchMask.value.difficulty = val;
  }
};

//Sortierung
const sortOptions = computed(() => [
  {
    value: 'near_me',
    label: $t('component_search_filter_sort_near_me_label') as string,
    description: $t('component_search_filter_sort_near_me_description') as string,
    icon: MapPin,
  },
  {
    value: 'recommended',
    label: $t('component_search_filter_sort_recommended_label') as string,
    description: $t('component_search_filter_sort_recommended_description') as string,
    icon: Flame,
  },
  {
    value: 'new',
    label: $t('component_search_filter_sort_new_label') as string,
    description: $t('component_search_filter_sort_new_description') as string,
    icon: Clock,
  },
  {
    value: 'popular',
    label: $t('component_search_filter_sort_popular_label') as string,
    description: $t('component_search_filter_sort_popular_description') as string,
    icon: TrendingUp,
  },
] as const);

const toggleSort = (val: "popular" | "new" | "recommended" | "near_me" | undefined) => {
  if (searchMask.value.sort === val) {
    searchMask.value.sort = undefined; // Sortierung zurücksetzen, wenn erneut auf die gleiche Option geklickt wird
  } else {
    searchMask.value.sort = val;
  }
};

// ── Advanced Sliders (Array-Binding für Slider-Komponente) ───────────────────
const radiusModel = computed<number[]>({
  get: () => [searchMask.value.radius ?? 50],
  set: ([val]) => { searchMask.value.radius = val; },
});

const durationModel = computed<number[]>({
  get: () => searchMask.value.duration ?? [15, 720],
  set: ([min, max]) => {
    if (!max || !min) return;
    searchMask.value.duration = [min, max];
  },
});

const tagsModel = computed<string[]>({
  get: () => searchMask.value.tags ?? [],
  set: (val) => { searchMask.value.tags = val; },
});

// ── Active Filters Badge ──────────────────────────────────────────────────────
const hasActiveFilters = computed(() => {
  return Object.entries(searchMask.value).some(([key, value]) => {
    if (key === 'location') return false; // Standortfilter nicht berücksichtigen
    if (Array.isArray(value)) return value.length > 0; // Bei Arrays prüfen,
    return value !== undefined; // Bei anderen Werten prüfen
  })
});

// ── Actions ───────────────────────────────────────────────────────────────────
const applyAndClose = () => {
  searchPopoverOpen.value = false;
  refreshSearch();
};

const resetAllFilters = () => {
  resetFilters();
  searchPopoverOpen.value = false;
  extendedSearchOpen.value = false;
  refreshSearch();
};

const openAdvanced = () => {
  searchPopoverOpen.value = false;
  extendedSearchOpen.value = true;
};

const applyAdvancedAndClose = () => {
  extendedSearchOpen.value = false;
  refreshSearch();
};
</script>