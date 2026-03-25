<template>
  <div class="flex flex-wrap gap-2">
    <Badge
      v-for="interest in INTERESTS"
      :key="interest.key"
      class="flex items-center gap-2"
      :variant="isSelected(interest.key) ? 'default' : 'outline'"
      :class="{'opacity-50': !isSelected(interest.key)}"
    >
      <component :is="ICON_MAP[interest.iconKey]" />
      <span class="capitalize">{{ $t(`interest_${interest.key}`) }}</span>
    </Badge>
  </div>
</template>

<script lang="ts" setup>
import {
    BaggageClaim, Bike, BookOpen, Camera,
    CookingPot, Dumbbell, Fish, Footprints, Gamepad2,
    Headset, Leaf, Mountain, Music, Palette,
    Plane, Tent, Waves,
} from 'lucide-vue-next';
import type { InterestIconKey } from '~~/shared/types/UserProfileTypes';

const props = withDefaults(defineProps<{
    interests?: string[];
}>(), {
    interests: () => [],
});

const { t } = useI18n();

const ICON_MAP: Record<InterestIconKey, any> = {
    Footprints, CookingPot, Gamepad2, Plane, Camera,
    Music, Bike, Mountain, Waves, Tent, Dumbbell,
    Palette, BookOpen, Fish, Leaf, BaggageClaim, Headset,
    Sword: Dumbbell,
    Drama: Palette,
    Car: BaggageClaim,
};

const isSelected = (key: string) => props.interests?.includes(key);
</script>