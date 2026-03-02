<template>
  <div class="space-y-6">
    <!-- Event Type Toggle -->
    <div class="space-y-3">
      <Label class="text-sm font-medium">Zeitpunkt</Label>
      <ToggleGroup v-model="eventScheduleModel.type" type="single" variant="outline">
        <ToggleGroupItem value="flexible" class="flex items-center gap-2 px-3 py-2">
          <InfinityIcon class="h-4 w-4" />
          <span class="hidden sm:inline">Jederzeit</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="single" class="flex items-center gap-2 px-3 py-2">
          <CalendarIcon class="h-4 w-4" />
          <span class="hidden sm:inline">Termin</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="range" class="flex items-center gap-2 px-3 py-2">
          <CalendarRange class="h-4 w-4" />
          <span class="hidden sm:inline">Zeitraum</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <!-- Date Selection (only for single/range) -->
    <div v-if="eventScheduleModel.type === 'single' || eventScheduleModel.type === 'range'" class="space-y-4">
      <!-- Start Date -->
      <div class="space-y-2">
        <Label class="text-sm">
          {{ eventScheduleModel.type === 'range' ? 'Startdatum' : 'Datum' }}
        </Label>
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              class="w-full justify-start text-left font-normal"
              :class="[
                !eventScheduleModel.startDate && 'text-muted-foreground'
              ]"
            >
              <CalendarIcon class="mr-2 h-4 w-4" />
              {{ formattedStartDate || 'Datum wählen' }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <Calendar
              :model-value="(startDateValue as any)"
              :min-value="(minDate as any)"
              @update:model-value="onStartDateChange"
            />
          </PopoverContent>
        </Popover>
      </div>

      <!-- Time (optional) -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label class="text-sm">Uhrzeit</Label>
          <Switch v-model="hasTime" size="sm" />
        </div>
        <!-- TODO: Replace this with: https://reka-ui.com/docs/components/time-field -->
        <div v-if="hasTime" class="flex gap-2">
          <NativeSelect v-model="startHour" class="flex-1">
            <NativeSelectOption v-for="h in 24" :key="h - 1" :value="String(h - 1).padStart(2, '0')">
              {{ String(h - 1).padStart(2, '0') }}:00
            </NativeSelectOption>
          </NativeSelect>
          <NativeSelect v-model="startMinute" class="flex-1">
            <NativeSelectOption v-for="m in ['00', '15', '30', '45']" :key="m" :value="m">
              :{{ m }}
            </NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      <!-- End Date (only for range) -->
      <div v-if="eventScheduleModel.type === 'range'" class="space-y-2">
        <Label class="text-sm">Enddatum</Label>
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              class="w-full justify-start text-left font-normal"
              :class="[
                !eventScheduleModel.endDate && 'text-muted-foreground'
              ]"
            >
              <CalendarIcon class="mr-2 h-4 w-4" />
              {{ formattedEndDate || 'Enddatum wählen' }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <Calendar
              :model-value="(endDateValue as any)"
              :min-value="(startDateValue as any)"
              @update:model-value="onEndDateChange"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>

    <!-- Duration Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <Label class="text-sm font-medium">Geschätzte Dauer</Label>
        <span class="text-sm text-muted-foreground">
          {{ formattedDuration }}
        </span>
      </div>

      <!-- Duration Presets -->
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="(preset, key) in DURATION_PRESETS"
          :key="key"
          type="button"
          variant="outline"
          size="sm"
          :class="[
            isPresetActive(key) && 'border-primary bg-primary/10'
          ]"
          @click="applyPreset(key)"
        >
          {{ preset.label }}
        </Button>
      </div>

      <!-- Custom Duration Slider -->
      <div class="space-y-4 pt-2">
        <div class="space-y-2">
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>Min: {{ formatDuration(eventScheduleModel.estimatedDuration.min) }}</span>
            <span>Max: {{ formatDuration(eventScheduleModel.estimatedDuration.max) }}</span>
          </div>
          <Slider
            v-model="durationSliderValues"
            :min="15"
            :max="720"
            :step="15"
            class="w-full"
            @update:model-value="onDurationChange"
          />
        </div>

        <!-- Quick Adjust Buttons -->
        <div class="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            :disabled="eventScheduleModel.estimatedDuration.min <= 15"
            @click="adjustDuration(-15, 'min')"
          >
            <Minus class="h-4 w-4" />
          </Button>
          <span class="text-sm font-medium min-w-24 text-center">
            {{ formattedDuration }}
          </span>
          <Button
            variant="ghost"
            size="icon"
            :disabled="eventScheduleModel.estimatedDuration.max >= 720"
            @click="adjustDuration(15, 'max')"
          >
            <Plus class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Approximate Toggle -->
    <div class="flex items-center justify-between rounded-lg border p-3">
      <div class="space-y-0.5">
        <Label class="text-sm font-medium">Ungefähre Angaben</Label>
        <p class="text-xs text-muted-foreground">
          Zeigt an, dass Zeit/Dauer flexibel sind
        </p>
      </div>

      <Switch v-model="eventScheduleModel.isApproximate" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { CalendarDate } from '@internationalized/date';
import { getLocalTimeZone, parseDate, today } from '@internationalized/date';
import {
  Calendar as CalendarIcon,
  CalendarRange,
  InfinityIcon,
  Minus,
  Plus,
} from 'lucide-vue-next';
import type { DateValue } from 'reka-ui';
import {
  type DurationPreset,
  type EventSchedule,
  DURATION_PRESETS,
  formatDuration,
  formatDurationRange
} from '~~/shared/types/EventTypes';

const eventScheduleModel = defineModel({
    type: Object as () => EventSchedule,
    required: true,
});

// Time handling
const hasTime = ref(!!eventScheduleModel.value.startTime);
const startHour = ref(eventScheduleModel.value.startTime?.split(':')[0] || '10');
const startMinute = ref(eventScheduleModel.value.startTime?.split(':')[1] || '00');

watch([hasTime, startHour, startMinute], () => {
    if (hasTime.value) {
        eventScheduleModel.value.startTime = `${startHour.value}:${startMinute.value}`;
    } else {
        eventScheduleModel.value.startTime = undefined;
    }
});

// Date handling with @internationalized/date
const minDate = computed(() => today(getLocalTimeZone()));

const startDateValue = ref<CalendarDate | undefined>(
    eventScheduleModel.value.startDate ? parseDate(eventScheduleModel.value.startDate.split('T')[0]!) : undefined
);

const endDateValue = ref<CalendarDate | undefined>(
    eventScheduleModel.value.endDate ? parseDate(eventScheduleModel.value.endDate.split('T')[0]!) : undefined
);

const formattedStartDate = computed(() => {
    if (!eventScheduleModel.value.startDate) return '';
    const date = new Date(eventScheduleModel.value.startDate);
    return date.toLocaleDateString('de-DE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
});

const formattedEndDate = computed(() => {
    if (!eventScheduleModel.value.endDate) return '';
    const date = new Date(eventScheduleModel.value.endDate);
    return date.toLocaleDateString('de-DE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
});

const onStartDateChange = (date: DateValue | undefined) => {
    if (!date) return;
    eventScheduleModel.value.startDate = date.toString();
    startDateValue.value = date as CalendarDate;

    // Reset end date if it's before start date
    if (endDateValue.value && 'compare' in date && date.compare(endDateValue.value as any) > 0) {
        endDateValue.value = undefined;
        eventScheduleModel.value.endDate = undefined;
    }
};

const onEndDateChange = (date: DateValue | undefined) => {
    if (!date) return;
    eventScheduleModel.value.endDate = date.toString();
    endDateValue.value = date as CalendarDate;
};

// Duration handling
const durationSliderValues = toRef([
    eventScheduleModel.value.estimatedDuration.min,
    eventScheduleModel.value.estimatedDuration.max,
]);

const formattedDuration = computed(() =>
    formatDurationRange(eventScheduleModel.value.estimatedDuration)
);

const onDurationChange = (values: number[] | undefined) => {
    if (!values || values.length < 2) return;
    // Ensure min <= max
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0]!;
    const max = sorted[1]!;
    eventScheduleModel.value.estimatedDuration = { min, max };
};

const adjustDuration = (amount: number, target: 'min' | 'max') => {
    const current = eventScheduleModel.value.estimatedDuration[target];
    const newValue = Math.max(15, Math.min(720, current + amount));

    if (target === 'min') {
        eventScheduleModel.value.estimatedDuration.min = Math.min(
            newValue,
            eventScheduleModel.value.estimatedDuration.max
        );
    } else {
        eventScheduleModel.value.estimatedDuration.max = Math.max(
            newValue,
            eventScheduleModel.value.estimatedDuration.min
        );
    }

    durationSliderValues.value = [
        eventScheduleModel.value.estimatedDuration.min,
        eventScheduleModel.value.estimatedDuration.max,
    ];
};

// Presets
const isPresetActive = (key: string): boolean => {
    const preset = DURATION_PRESETS[key as DurationPreset];
    return (
        eventScheduleModel.value.estimatedDuration.min === preset.min &&
        eventScheduleModel.value.estimatedDuration.max === preset.max
    );
};

const applyPreset = (key: string) => {
    const preset = DURATION_PRESETS[key as DurationPreset];
    eventScheduleModel.value.estimatedDuration = { min: preset.min, max: preset.max };
    durationSliderValues.value = [preset.min, preset.max];
};
</script>
