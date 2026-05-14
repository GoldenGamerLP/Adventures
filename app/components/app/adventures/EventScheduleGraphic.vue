<template>
  <div class="space-y-6">
    <section class="rounded-lg border bg-muted/20 p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <div class="rounded-lg bg-secondary/60 p-2 text-secondary-foreground">
            <component :is="scheduleMeta.icon" class="size-5" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h3 class="text-base font-semibold leading-tight">
              {{ scheduleMeta.title }}
            </h3>
            <p v-if="scheduleMeta.subtitle" class="text-sm text-muted-foreground">
              {{ scheduleMeta.subtitle }}
            </p>
          </div>
        </div>
        <Button
          v-if="canDownloadCalendar"
          variant="secondary"
          size="sm"
          type="button"
          class="gap-1 self-start sm:self-auto"
          @click="downloadCalendar"
        >
          <CalendarPlusIcon class="size-4" aria-hidden="true" />
          {{ $t('component_schedule_add_to_calendar') }}
        </Button>
      </div>

      <div v-if="schedule.type === 'range'" class="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div class="rounded-md border bg-background px-3 py-2">
          <p class="text-muted-foreground">{{ $t('component_schedule_start') }}</p>
          <p class="font-semibold text-foreground">
            {{ td(schedule.startDate!, { dateStyle: 'short', timeStyle: 'short' }) }}
          </p>
        </div>
        <div class="rounded-md border bg-background px-3 py-2">
          <p class="text-muted-foreground">{{ $t('component_schedule_end') }}</p>
          <p class="font-semibold text-foreground">
            {{ td(schedule.endDate!, { dateStyle: 'short', timeStyle: 'short' }) }}
          </p>
        </div>
      </div>
    </section>

    <section v-if="schedule.slots?.length" class="space-y-3">
      <h3 class="text-sm font-semibold">
        {{ $t('component_schedule_opening_hours') }}
      </h3>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        <div
          v-for="day in 7"
          :key="day"
          class="rounded-md border px-2 py-2 text-xs"
          :class="hasSlot(day - 1)
            ? 'bg-secondary/50 text-secondary-foreground border-secondary/40'
            : 'bg-muted/30 text-muted-foreground'"
        >
          <p class="text-[11px] font-semibold uppercase tracking-wide">
            {{ getDayOfWeeklabel(day - 1) }}
          </p>
          <p class="mt-1 text-[11px] font-medium">
            {{ getFormattedSlotTime(day - 1) }}
          </p>
        </div>
      </div>
    </section>

    <!-- Wie lange? -->
    <section class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">
          {{ $t('component_schedule_estimated_duration') }}
        </h3>
      </div>
      <div class="relative w-full rounded-lg bg-muted/20 px-3 pb-3 pt-6">
        <div
          class="absolute top-1 text-xs font-medium text-secondary-foreground -translate-x-1/2 whitespace-nowrap bg-secondary py-0.5 px-1.5 rounded-lg"
          :style="{ left: durationBarPercent.left + durationBarPercent.width / 1.5 + '%' }"
        >
          {{ minLabel }} - {{ maxLabel }}
        </div>

        <div class="flex items-center w-full mt-2">
          <div class="flex-1 h-2 bg-muted mx-2 rounded-full relative overflow-hidden shadow-inner">
            <div class="absolute inset-y-0 rounded-full bg-primary transition-all" :style="durationBarStyle"></div>
          </div>
        </div>

        <div class="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>0h</span>
          <span>12h</span>
          <span>24h</span>
        </div>
      </div>
    </section>

    <ItemGroup class="border rounded-lg mt-4">
      <Item v-if="schedule.isApproximate" class="bg-destructive/10">
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
import { useMediaQuery } from '@vueuse/core';
import {
  BadgeAlert,
  CalendarClockIcon,
  Calendar as CalendarIcon,
  CalendarPlusIcon,
  CalendarRange,
  InfinityIcon
} from 'lucide-vue-next';
import { MAX_ADVENTURE_DURATION_MINUTES } from '~~/shared/constants/Constants';
import { formatDuration, formatRelativeTime, scheduleToCalenderFormat } from '~~/shared/utils/SharedUtils';

// 24h — matching form slider max
const props = defineProps<{
  schedule: EventSchedule;
}>();

const isMobile = useMediaQuery('(max-width: 640px)');

const { $t, td } = useI18n();

const minLabel = computed(() => formatDuration(props.schedule.estimatedDuration.min));
const maxLabel = computed(() => formatDuration(props.schedule.estimatedDuration.max));
const canDownloadCalendar = computed(() => props.schedule.type !== 'flexible');

const scheduleMeta = computed(() => {
  if (props.schedule.type === 'flexible') {
    return {
      icon: InfinityIcon,
      title: $t('component_schedule_anytime_title'),
      subtitle: $t('component_schedule_anytime_description'),
    };
  }

  if (props.schedule.type === 'single') {
    return {
      icon: CalendarIcon,
      title: td(props.schedule.startDate!, { dateStyle: 'full', timeStyle: 'short' }),
      subtitle: td(props.schedule.startDate!, { dateStyle: 'medium', timeStyle: 'short' }),
    };
  }

  return {
    icon: CalendarRange,
    title: td(props.schedule.startDate!, { dateStyle: 'full', timeStyle: 'short' }),
    subtitle: `${td(props.schedule.startDate!, { dateStyle: 'short', timeStyle: 'short' })} ${$t('component_schedule_until')} ${td(props.schedule.endDate!, { dateStyle: 'short', timeStyle: 'short' })}`,
  };
});

const durationBarPercent = computed(() => {
  const dur = props.schedule.estimatedDuration;
  let left = (dur.min / MAX_ADVENTURE_DURATION_MINUTES) * 100;
  const width = ((dur.max - dur.min) / MAX_ADVENTURE_DURATION_MINUTES) * 100;

  if (isMobile.value) {
    //On mobile: add padding to keep the bar visible and not too narrow
    left = Math.min(85, Math.max(15, left));
  }

  return { left, width };
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