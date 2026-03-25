<template>
  <div>
    <h2 class="text-lg font-semibold">
      Event Zeitplan
    </h2>

    <!-- Wann? -->
    <template v-if="schedule.type === 'flexible'">
      <Item variant="muted">
        <ItemMedia variant="icon">
          <InfinityIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Jederzeit</ItemTitle>
          <ItemDescription>Keine Datum/Uhrzeit nötig</ItemDescription>
        </ItemContent>
      </Item>
    </template>
    <template v-else-if="schedule.type === 'single'">
      <Item variant="muted">
        <ItemMedia variant="icon">
          <CalendarIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            <NuxtTime :datetime="schedule.startDate!" format="long" />
          </ItemTitle>
          <ItemDescription>
            <NuxtTime :datetime="schedule.startDate!" format="short" relative />
          </ItemDescription>
        </ItemContent>
        <Badge variant="secondary" @click="downloadCalendar">
          <CalendarPlusIcon />
          Zum Kalender hinzufügen
        </Badge>
      </Item>
    </template>
    <template v-else-if="schedule.type === 'range'">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <CalendarRange />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            <NuxtTime :datetime="schedule.startDate!" format="long" />
            &ndash;
            <NuxtTime :datetime="schedule.endDate!" format="long" />
          </ItemTitle>
          <ItemDescription>
            <NuxtTime :datetime="schedule.startDate!" format="short" relative />
            bis
            <NuxtTime :datetime="schedule.endDate!" format="short" relative />
          </ItemDescription>
        </ItemContent>
        <Badge variant="secondary" @click="downloadCalendar">
          <CalendarPlusIcon />
          Zum Kalender hinzufügen
        </Badge>
      </Item>
    </template>

    <template v-if="schedule.slots">
      <div class="space-y-2 mt-4">
        <h3 class="text-sm font-medium">
          Wöchentliche Öffnungszeiten
        </h3>
        <div class="grid grid-cols-7 gap-2">
          <div
            v-for="day in 7"
            :key="day"
            class="flex flex-col items-center text-xs text-muted-foreground"
            :class="{ 'text-primary font-semibold': hasSlot(day - 1) }"
          >
            <span>{{ getDayOfWeeklabel(day - 1) }}</span>
            <span class="text-center">{{ getFormattedSlotTime(day - 1) }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Wie lange? -->
    <div class="space-y-2 mt-4">
      <h3 class="text-sm font-medium">
        Geschätzte Dauer
      </h3>
      <div class="relative w-full pt-6 pb-2">
        <!-- Min/Max position labels -->
        <div
          class="absolute top-2 text-xs font-medium text-primary -translate-x-1/2 whitespace-nowrap"
          :style="{ left: durationBarPercent.midPer + '%' }"
        >
          {{ minLabel }} - {{ maxLabel }}
        </div>

        <!-- Bar row -->
        <div class="flex items-center w-full">
          <div class="flex flex-col items-center text-xs text-muted-foreground shrink-0 w-6">
            <FlagTriangleRightIcon class="size-4" />
          </div>
          <div class="flex-1 h-2 bg-border mx-2 rounded-full relative overflow-hidden">
            <div class="absolute inset-y-0 rounded-full bg-primary transition-all" :style="durationBarStyle"></div>
          </div>
          <div class="flex flex-col items-center text-xs text-muted-foreground shrink-0 w-6">
            <FlagTriangleLeftIcon class="size-4" />
          </div>
        </div>

        <!-- Scale labels -->
        <div class="flex justify-between mt-1 px-6 text-xs text-muted-foreground font-mono">
          <span>0h</span>
          <span>12h</span>
          <span>24h</span>
        </div>
      </div>
    </div>

    <ItemGroup class="border rounded-lg mt-4">
      <Item v-if="schedule.isApproximate">
        <ItemMedia variant="icon">
          <BadgeAlert />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Ungefähre Angaben</ItemTitle>
          <ItemDescription>
            Die angegebenen Daten sind ungefähre Angaben und können variieren.
          </ItemDescription>
        </ItemContent>
      </Item>
      <ItemSeparator v-if="schedule.isApproximate && schedule.repeatsAnnually" />
      <Item v-if="schedule.repeatsAnnually">
        <ItemMedia variant="icon">
          <CalendarClockIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Jährliche Wiederholung</ItemTitle>
          <ItemDescription>
            Dieses Event findet jedes Jahr am selben Datum statt.
          </ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  </div>
</template>

<script lang="ts" setup>
import {
  BadgeAlert,
  CalendarClockIcon,
  Calendar as CalendarIcon,
  CalendarPlusIcon,
  CalendarRange,
  FlagTriangleLeftIcon,
  FlagTriangleRightIcon,
  InfinityIcon
} from 'lucide-vue-next';
import { MAX_ADVENTURE_DURATION_MINUTES } from '~~/shared/constants/Constants';
import { formatDuration, scheduleToCalenderFormat } from '~~/shared/utils/SharedUtils';

// 24h — matching form slider max
const props = defineProps<{
  schedule: EventSchedule;
}>();

const minLabel = computed(() => formatDuration(props.schedule.estimatedDuration.min));
const maxLabel = computed(() => formatDuration(props.schedule.estimatedDuration.max));

const durationBarPercent = computed(() => {
  const dur = props.schedule.estimatedDuration;
  const leftPer = (dur.min / MAX_ADVENTURE_DURATION_MINUTES) * 100;
  const rightPer = ((dur.max) / MAX_ADVENTURE_DURATION_MINUTES) * 100;
  const midPer = Math.max(Math.min(leftPer + rightPer / 2, 90), 10);
  return { midPer };
});

const getDayOfWeeklabel = (dayOfWeek: number): string => {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  return days[dayOfWeek] || '';
};

const getFormattedSlotTime = (dayOfWeek: number) => {
  const slot = props.schedule.slots?.find(s => s.dayOfWeek === dayOfWeek);
  if (!slot) return 'Geschlossen';
  return `${formatRelativeTime(slot.from)} - ${formatRelativeTime(slot.to)}`;
}

const hasSlot = (dayOfWeek: number) => {
  return props.schedule.slots?.some(s => s.dayOfWeek === dayOfWeek);
}

const durationBarStyle = computed(() => {
  const dur = props.schedule.estimatedDuration;
  const left = (dur.min / MAX_ADVENTURE_DURATION_MINUTES) * 100;
  const width = ((dur.max - dur.min) / MAX_ADVENTURE_DURATION_MINUTES) * 100;
  return {
    left: `${left}%`,
    width: `${Math.max(width, 0.5)}%`,
  };
});

const downloadCalendar = () => {
  const rfc5545String = scheduleToCalenderFormat(props.schedule);

  const blob = new Blob([rfc5545String], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'adventure-event.ics';
  a.click();
  URL.revokeObjectURL(url);
}
</script>