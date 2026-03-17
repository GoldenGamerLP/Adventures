<template>
  <div class="space-y-3">
    <!-- Interest Grid -->
    <div role="group" aria-label="Interessen auswählen" class="flex flex-wrap gap-2">
      <Button
        v-for="interest in ADVENTURE_TYPES"
        :key="interest.key"
        role="checkbox"
        size="sm"
        :variant="isSelected(interest.key) ? 'default' : 'outline'"
        :aria-checked="!isSelected(interest.key)"
        :disabled="!isSelected(interest.key) && !!max && modelValue.length >= max"
        @click="toggle(interest.key)"
        @keydown.space.prevent="toggle(interest.key)"
        @keydown.enter.prevent="toggle(interest.key)"
      >
        <component :is="ICON_MAP[interest.iconKey]" aria-hidden="true" />
        {{ interest.label }}
      </Button>
    </div>

    <!-- Counter -->
    <p v-if="max" class="text-xs text-muted-foreground" aria-live="polite">
      <span :class="modelValue.length >= max && 'text-primary font-medium'">
        {{ modelValue.length }}
      </span>
      / {{ max }} ausgewählt
    </p>
  </div>
</template>

<script lang="ts" setup>
import {
  Backpack, Bike, Camera,
  Car,
  CookingPot, Dumbbell, Fish, Footprints, Gamepad2,
  GraduationCap, Headset, Landmark, Leaf, Mountain, MountainSnow, Music, Palette,
  PartyPopper, Sailboat, Swords, Tent, Ticket, Tv, Users, Waves,
} from 'lucide-vue-next';

const props = defineProps<{
  max?: number;
}>();

const modelValue = defineModel<string[]>({
  type: Array,
  default: () => [],
});

const ICON_MAP: Record<SelectorIconKey, any> = {
  // Outdoor
  Footprints, Bike, MountainSnow, Mountain, Waves, Tent, Fish, Leaf, Sailboat,
  // Indoor / Sport
  Dumbbell, Swords, Gamepad2, GraduationCap,
  // Creative
  Camera, Palette, Ticket,
  // Social / Events
  Music, PartyPopper, Tv, CookingPot, Users,
  // Travel
  Car, Landmark, Backpack,
  // Misc
  Headset,
};

const isSelected = (key: string) => modelValue.value.includes(key);

const toggle = (key: string) => {
  if (isSelected(key)) {
    modelValue.value = modelValue.value.filter(k => k !== key);
  } else {
    if (props.max && modelValue.value.length >= props.max) return;
    modelValue.value = [...modelValue.value, key];
  }
};
</script>