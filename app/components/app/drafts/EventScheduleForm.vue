<template>
  <div class="space-y-8">
    <!-- Event Type Toggle -->
    <div class="space-y-3">
      <Label class="text-sm font-medium">Zeitpunkt</Label>
      <ToggleGroup v-model="eventScheduleModel.type" type="single" variant="outline">
        <ToggleGroupItem value="flexible">
          <InfinityIcon />
          Jederzeit
        </ToggleGroupItem>
        <ToggleGroupItem value="single">
          <CalendarIcon />
          Termin
        </ToggleGroupItem>
        <ToggleGroupItem value="range">
          <CalendarRange />
          Zeitraum
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <div v-if="eventScheduleModel.type === 'single'">
      <CalendarRoot v-slot="{ weekDays, grid }" :min-value="today(getLocalTimeZone())" :week-starts-on="1"
        :model-value="computedDateRange.start"
        @update:model-value="(date?: DateValue) => computedDateRange = { start: date, end: undefined }">
        <CalendarHeader class="flex items-center justify-between">
          <CalendarPrev
            class="inline-flex items-center cursor-pointer text-foreground justify-center rounded-md bg-transparent w-7 h-7 hover:bg-muted active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-foreground">
            <ChevronLeftIcon />
          </CalendarPrev>
          <CalendarHeading class="text-sm text-foreground font-medium" />

          <CalendarNext
            class="inline-flex items-center cursor-pointer text-foreground justify-center rounded-md bg-transparent w-7 h-7 hover:bg-muted active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-foreground">
            <ChevronRightIcon />
          </CalendarNext>
        </CalendarHeader>
        <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <CalendarGrid v-for="month in grid" :key="month.value.toString()"
            class="w-full border-collapse select-none space-y-1">
            <CalendarGridHead>
              <CalendarGridRow class="mb-1 grid w-full grid-cols-7">
                <CalendarHeadCell v-for="day in weekDays" :key="day" class="rounded-md text-xs text-green8">
                  {{ day }}
                </CalendarHeadCell>
              </CalendarGridRow>
            </CalendarGridHead>
            <CalendarGridBody class="grid">
              <CalendarGridRow v-for="(weekDates, index) in month.rows" :key="`weekDate-${index}`"
                class="grid grid-cols-7">
                <CalendarCell v-for="weekDate in weekDates" :key="weekDate.toString()" :date="weekDate"
                  class="relative text-center text-sm">
                  <CalendarCellTrigger :day="weekDate" :month="month.value"
                    class="relative flex items-center justify-center rounded-full whitespace-nowrap text-sm font-normal text-foreground w-8 h-8 outline-none focus:shadow-[0_0_0_2px] focus:shadow-muted-foreground data-[outside-view]:text-foreground/30 data-[selected]:!bg-muted data-[selected]:text-primary hover:bg-accent data-[highlighted]:bg-muted data-[unavailable]:pointer-events-none data-[unavailable]:text-primary/30 data-[unavailable]:line-through before:absolute before:top-[2px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-foreground data-[today]:before:block data-[today]:before:bg-primary data-[today]:bg-muted " />
                </CalendarCell>
              </CalendarGridRow>
            </CalendarGridBody>
          </CalendarGrid>
        </div>
      </CalendarRoot>
    </div>

    <!-- Date Selection (only for range) -->
    <div v-if="eventScheduleModel.type === 'range'" class="space-y-4">
      <RangeCalendarRoot v-slot="{ weekDays, grid }" fixed-weeks :week-starts-on="1"
        :min-value="today(getLocalTimeZone())" :model-value="computedDateRange"
        @update:valid-model-value="(range: DateRange) => computedDateRange = range">
        <RangeCalendarHeader class="flex items-center justify-between">
          <RangeCalendarPrev
            class="inline-flex items-center cursor-pointer text-foreground justify-center rounded-md bg-transparent w-7 h-7 hover:bg-muted active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-foreground">
            <ChevronLeftIcon />
          </RangeCalendarPrev>
          <RangeCalendarHeading class="text-sm text-foreground font-medium" />
          <RangeCalendarNext
            class="inline-flex items-center cursor-pointer text-foreground justify-center rounded-md bg-transparent w-7 h-7 hover:bg-muted active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-foreground">
            <ChevronRightIcon />
          </RangeCalendarNext>
        </RangeCalendarHeader>
        <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <RangeCalendarGrid v-for="month in grid" :key="month.value.toString()"
            class="w-full border-collapse select-none space-y-1">
            <RangeCalendarGridHead>
              <RangeCalendarGridRow class="mb-1 grid w-full grid-cols-7">
                <RangeCalendarHeadCell v-for="day in weekDays" :key="day"
                  class="rounded-md text-xs text-muted-foreground">
                  {{ day }}
                </RangeCalendarHeadCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridHead>
            <RangeCalendarGridBody class="grid">
              <RangeCalendarGridRow v-for="(weekDates, index) in month.rows" :key="`weekDate-${index}`"
                class="grid grid-cols-7">
                <RangeCalendarCell v-for="weekDate in weekDates" :key="weekDate.toString()" :date="weekDate">
                  <RangeCalendarCellTrigger :day="weekDate" :month="month.value"
                    class="relative flex items-center justify-center rounded-full whitespace-nowrap text-sm font-normal text-foreground w-8 h-8 outline-none focus:shadow-[0_0_0_2px] focus:shadow-muted-foreground data-[outside-view]:text-foreground/30 data-[selected]:!bg-muted data-[selected]:text-primary hover:bg-accent data-[highlighted]:bg-muted data-[unavailable]:pointer-events-none data-[unavailable]:text-primary/30 data-[unavailable]:line-through before:absolute before:top-[2px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-foreground data-[today]:before:block data-[today]:before:bg-primary data-[today]:bg-muted " />
                </RangeCalendarCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridBody>
          </RangeCalendarGrid>
        </div>
      </RangeCalendarRoot>
    </div>

    <template v-if="eventScheduleModel.type === 'single' || eventScheduleModel.type === 'range'">
      <!-- Öffnungszeiten -->
      <div class="space-y-4">
        <div>
          <Label class="text-sm font-medium">Öffnungszeiten</Label>
          <p class="text-xs text-muted-foreground">
            Gib die Öffnungszeiten für dein Event an
          </p>
        </div>

        <ItemGroup v-if="filteredWeekDays.length" class="border rounded-lg">
          <template v-for="(currentDay, index) in filteredWeekDays" :key="currentDay.value">
            <Item>
              <ItemContent>
                <ItemTitle>{{ currentDay.label }}</ItemTitle>
                <ItemDescription class="text-xs text-muted-foreground">
                  {{ formatOpeningHoursForDay(currentDay.value) }}
                </ItemDescription>
              </ItemContent>
              <ItemActions class="flex flex-wrap gap-2">
                <Button v-for="(preset, key) in OPENING_HOURS_PRESETS" :key="key" type="button"
                  :variant="isOpeningHoursActive(currentDay.value, preset.hours) ? 'default' : 'outline'" size="sm"
                  @click="toggleOpeningHoursForDay(currentDay.value, preset.hours)">
                  {{ preset.label }}
                </Button>
              </ItemActions>
            </Item>
            <ItemSeparator v-if="index < filteredWeekDays.length - 1" />
          </template>
        </ItemGroup>
        <Empty v-else>
          <EmptyHeader>
            <CalendarIcon class="size-12 text-muted-foreground" />
            Keine Termine ausgewählt
          </EmptyHeader>
          <p class="text-center text-sm text-muted-foreground">
            Wähle einen Termin oder Zeitraum aus, um die Öffnungszeiten festzulegen
          </p>
        </Empty>
      </div>
    </template>

    <!-- Duration Section -->
    <div class="space-y-4">
      <div>
        <Label class="text-sm font-medium">Geschätzte Dauer</Label>
        <p class="text-xs text-muted-foreground">
          {{ formattedDuration }}
        </p>
      </div>

      <!-- Duration Presets -->
      <div class="flex flex-wrap gap-2">
        <Button v-for="(preset, key) in DURATION_PRESETS" :key="key" type="button"
          :variant="isDurationPresetActive(key) ? 'default' : 'outline'" size="sm" @click="applyPreset(key)">
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
          <Slider v-model="durationSliderValues" :min="15" :max="MAX_ADVENTURE_DURATION_MINUTES" :step="15"
            class="w-full" @update:model-value="onDurationChange" />
        </div>

        <!-- Quick Adjust Buttons -->
        <div class="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" :disabled="eventScheduleModel.estimatedDuration.min <= 15"
            @click="adjustDuration(-15, 'min')">
            <Minus class="h-4 w-4" />
          </Button>
          <span class="text-sm font-medium min-w-24 text-center">
            {{ formattedDuration }}
          </span>
          <Button variant="ghost" size="icon"
            :disabled="eventScheduleModel.estimatedDuration.max >= MAX_ADVENTURE_DURATION_MINUTES"
            @click="adjustDuration(15, 'max')">
            <Plus class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <ItemGroup class="border rounded-lg">
      <template v-if="eventScheduleModel.type === 'single' || eventScheduleModel.type === 'range'">
        <Item>
          <ItemContent>
            <ItemTitle>Jährliche Wiederholung</ItemTitle>
            <ItemDescription>
              Wiederholt das Event jedes Jahr am selben Datum (z.B. Geburtstage, Jahrestage)
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Switch v-model="eventScheduleModel.repeatsAnnually" />
          </ItemActions>
        </Item>
        <ItemSeparator />
      </template>
      <Item>
        <ItemContent>
          <ItemTitle>
            Ungefähre Angaben
          </ItemTitle>
          <ItemDescription>
            Zeigt an, dass Zeit/Dauer flexibel sind
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Switch v-model="eventScheduleModel.isApproximate" />
        </ItemActions>
      </Item>
    </ItemGroup>
  </div>
</template>

<script lang="ts" setup>
import { getDayOfWeek, getLocalTimeZone, parseDate, today } from '@internationalized/date';
import {
  Calendar as CalendarIcon,
  CalendarRange,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfinityIcon,
  Minus,
  Plus
} from 'lucide-vue-next';
import type { DateRange, DateValue } from 'reka-ui';
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot, RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot, useLocale } from 'reka-ui';
import { getDaysBetween } from 'reka-ui/date';
import { MAX_ADVENTURE_DURATION_MINUTES } from '~~/shared/constants/Constants';
import {
  type DurationPreset,
  type EventSchedule,
  DURATION_PRESETS,
  OPENING_HOURS_PRESETS,
  WEEK_DAYS
} from '~~/shared/types/EventTypes';

const eventScheduleModel = defineModel({
  type: Object as () => EventSchedule,
  required: true,
});
const currentLocale = useLocale();

const toggleOpeningHoursForDay = (day: number, hours: { from: number; to: number }) => {
  if (!eventScheduleModel.value.slots) {
    eventScheduleModel.value.slots = [];
  }

  const existingIndex = eventScheduleModel.value.slots.findIndex(slot => slot.dayOfWeek === day);
  if (existingIndex === -1) {
    eventScheduleModel.value.slots.push({ dayOfWeek: day, from: hours.from, to: hours.to });
    return;
  }

  const existingSlot = eventScheduleModel.value.slots[existingIndex];
  if (existingSlot && existingSlot.from === hours.from && existingSlot.to === hours.to) {
    // Remove slot if it matches the preset (toggle off)
    eventScheduleModel.value.slots.splice(existingIndex, 1);
  } else {
    // Update existing slot to match the preset
    eventScheduleModel.value.slots[existingIndex] = { dayOfWeek: day, from: hours.from, to: hours.to };
  }

};

const isOpeningHoursActive = (day: number, hours: { from: number; to: number }): boolean => {
  const slotIndex = eventScheduleModel.value.slots?.findIndex(slot => slot.dayOfWeek === day);
  if (slotIndex === -1) return false;
  const slot = eventScheduleModel.value.slots?.[slotIndex!];
  return slot?.from === hours.from && slot?.to === hours.to;
};

watch(() => eventScheduleModel.value.type, () => {
  // Clear date and slots when type changes
  eventScheduleModel.value.startDate = undefined;
  eventScheduleModel.value.endDate = undefined;
  eventScheduleModel.value.slots = [];
});

const computedDateRange = computed<DateRange>({
  get: () => {
    const { startDate, endDate } = eventScheduleModel.value;
    return {
      start: startDate ? parseDate(startDate!) : undefined,
      end: endDate ? parseDate(endDate!) : undefined,
    };
  },
  set: (range: DateRange) => {
    const { start, end } = range;
    eventScheduleModel.value.startDate = start ? start.toString() : undefined;
    eventScheduleModel.value.endDate = end ? end.toString() : undefined;
  },
});

const filteredWeekDays = computed(() => {
  const weekdays = new Set<number>();

  if (eventScheduleModel.value.type === 'single') {
    if (!eventScheduleModel.value.startDate) return [];
    const dayOfWeek = getDayOfWeek(parseDate(eventScheduleModel.value.startDate!), currentLocale.value, 'mon');
    weekdays.add(dayOfWeek);
  }

  if (eventScheduleModel.value.type === 'range') {
    if (!eventScheduleModel.value.startDate || !eventScheduleModel.value.endDate) return [];
    const startDay = getDayOfWeek(parseDate(eventScheduleModel.value.startDate!), currentLocale.value, 'mon');
    const daysBetween = getDaysBetween(
      parseDate(eventScheduleModel.value.startDate!),
      parseDate(eventScheduleModel.value.endDate!)
    );

    //Days between gibt Anzahl Tage zurück, nicht inklusive Endtag, daher +2  
    for (let i = 0; i < daysBetween.length + 2; i++) {
      weekdays.add(startDay + i % 7);
    }
  }

  return WEEK_DAYS.filter(day => weekdays.has(day.value));
});

const durationSliderValues = toRef([
  eventScheduleModel.value.estimatedDuration.min,
  eventScheduleModel.value.estimatedDuration.max,
]);

const formattedDuration = computed(() =>
  formatDurationRange(eventScheduleModel.value.estimatedDuration)
);

const formatOpeningHoursForDay = (day: number): string => {
  const slot = eventScheduleModel.value.slots?.find(slot => slot.dayOfWeek === day);
  if (!slot) return 'Keine Öffnungszeiten';

  return `Von ${formatRelativeTime(slot.from)} bis ${formatRelativeTime(slot.to)}`;
}

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
  const newValue = Math.max(15, Math.min(MAX_ADVENTURE_DURATION_MINUTES, current + amount));

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
const isDurationPresetActive = (key: string): boolean => {
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
