<template>
  <div>
    <h2 class="text-lg font-semibold">
      {{ $t('component_schedule_title') }}
    </h2>

    <!-- Wann? -->
    <template v-if="schedule.type === 'flexible'">
      <Item variant="muted">
        <ItemMedia variant="icon">
          <InfinityIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{{ $t('component_schedule_anytime_title') }}</ItemTitle>
          <ItemDescription>{{ $t('component_schedule_anytime_description') }}</ItemDescription>
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
            {{ td(schedule.startDate!, { dateStyle: 'full', timeStyle: 'short' }) }}
          </ItemTitle>
          <ItemDescription>
            {{ td(schedule.startDate!, { dateStyle: 'medium', timeStyle: 'short' }) }}
          </ItemDescription>
        </ItemContent>
        <Badge variant="secondary" @click="downloadCalendar">
          <CalendarPlusIcon />
          {{ $t('component_schedule_add_to_calendar') }}
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
            {{ td(schedule.startDate!, { dateStyle: 'full', timeStyle: 'short' }) }}
          </ItemTitle>
          <ItemDescription>
            <span class="font-semibold">{{ td(schedule.startDate!, { dateStyle: 'short', timeStyle: 'short' }) }}</span>
            {{ $t('component_schedule_until') }}
            <span class="font-semibold">{{ td(schedule.endDate!, { dateStyle: 'short', timeStyle: 'short' }) }}</span>
          </ItemDescription>
        </ItemContent>
        <Badge variant="secondary" @click="downloadCalendar">
          <CalendarPlusIcon />
          {{ $t('component_schedule_add_to_calendar') }}
        </Badge>
      </Item>
    </template>

    <template v-if="schedule.slots">
      <div class="space-y-2 mt-4">
        <h3 class="text-sm font-medium">
          {{ $t('component_schedule_opening_hours') }}
        </h3>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="day in 7"
            :key="day"
            class="flex flex-col items-center text-xs text-muted-foreground"
            :class="{ 'text-primary font-semibold': hasSlot(day - 1) }"
          >
            <p>{{ getDayOfWeeklabel(day - 1) }}</p>
            <p>{{ getFormattedSlotTime(day - 1) }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Wie lange? -->
    <div class="space-y-2 mt-4">
      <h3 class="text-sm font-medium">
        {{ $t('component_schedule_estimated_duration') }}
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
          <ItemTitle>{{ $t('component_schedule_approximate_title') }}</ItemTitle>
          <ItemDescription>
            {{ $t('component_schedule_approximate_description') }}
          </ItemDescription>
        </ItemContent>
      </Item>
      <ItemSeparator v-if="schedule.isApproximate && schedule.repeatsAnnually" />
      <Item v-if="schedule.repeatsAnnually">
        <ItemMedia variant="icon">
          <CalendarClockIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{{ $t('component_schedule_repeats_title') }}</ItemTitle>
          <ItemDescription>
            {{ $t('component_schedule_repeats_description') }}
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

const { $t, td } = useI18n();

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
  if (!slot) return $t('component_schedule_closed') as string;
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