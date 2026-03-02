<template>
  <div class="space-y-4">
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
            <template v-if="schedule.startTime">
              &middot; {{ schedule.startTime }} Uhr
            </template>
          </ItemTitle>
          <ItemDescription>
            <NuxtTime :datetime="schedule.startDate!" format="short" relative />
          </ItemDescription>
        </ItemContent>
        <Badge variant="secondary">
          Termin
        </Badge>
      </Item>
    </template>
    <template v-else-if="schedule.type === 'range'">
      <Item variant="muted">
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
        <Badge variant="secondary">
          Zeitraum
        </Badge>
      </Item>
    </template>

    <Separator />

    <!-- Wie lange? -->
    <div class="space-y-2">
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
            <div
              class="absolute inset-y-0 rounded-full bg-primary transition-all"
              :style="durationBarStyle"
            ></div>
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

    <Item v-if="schedule.isApproximate" variant="outline">
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
  </div>
</template>

<script lang="ts" setup>
import {
    Calendar as CalendarIcon,
    CalendarRange,
    InfinityIcon,
    BadgeAlert,
    FlagTriangleRightIcon,
    FlagTriangleLeftIcon,
} from 'lucide-vue-next';

import {
    formatDuration,
} from '~~/shared/types/EventTypes';

// 24h — matching form slider max

const props = defineProps<{
    schedule: EventSchedule;
}>(); const MAX_MINUTES = 1440;const minLabel = computed(() => formatDuration(props.schedule.estimatedDuration.min));
const maxLabel = computed(() => formatDuration(props.schedule.estimatedDuration.max));

const durationBarPercent = computed(() => {
    const dur = props.schedule.estimatedDuration;
    const leftPer = (dur.min / MAX_MINUTES) * 100;
    const rightPer = ((dur.max) / MAX_MINUTES) * 100;
    const midPer = Math.max(Math.min(leftPer + rightPer / 2, 90), 10);
    return { midPer };
});

const durationBarStyle = computed(() => {
    const dur = props.schedule.estimatedDuration;
    const left = (dur.min / MAX_MINUTES) * 100;
    const width = ((dur.max - dur.min) / MAX_MINUTES) * 100;
    return {
        left: `${left}%`,
        width: `${Math.max(width, 0.5)}%`,
    };
});


</script>