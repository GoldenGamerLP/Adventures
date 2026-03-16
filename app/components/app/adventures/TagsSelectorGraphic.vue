<template>
  <div class="flex flex-wrap gap-2">
    <Badge
      v-for="adventureType in availableAdventureTypes"
      :key="adventureType.key"
      class="flex items-center gap-2"
      :variant="isSelected(adventureType.key) ? 'secondary' : 'outline'"
      :class="{ 'opacity-50': !isSelected(adventureType.key) }"
    >
      <component :is="ICON_MAP[adventureType.iconKey]" />
      <span class="capitalize">{{ adventureType.label }}</span>
    </Badge>
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


const props = withDefaults(defineProps<{
    selectedTags?: AdventureTypeKey[];
    showAll?: boolean;
}>(), {
    selectedTags: () => [],
    showAll: false,
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

const isSelected = (key: AdventureTypeKey) => props.selectedTags?.includes(key);
const availableAdventureTypes = computed(() => {
    return ADVENTURE_TYPES.filter(type => props.showAll || isSelected(type.key));
});
</script>
