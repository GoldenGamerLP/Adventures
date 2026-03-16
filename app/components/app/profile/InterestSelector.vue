<template>
    <div class="space-y-3">
        <!-- Interest Grid -->
        <div role="group" aria-label="Interessen auswählen" class="flex flex-wrap gap-2">
            <Button v-for="interest in availableInterests" :key="interest.key" role="checkbox"
                :variant="isSelected(interest.key) ? 'default' : 'outline'" :aria-checked="!isSelected(interest.key)"
                :disabled="!isSelected(interest.key) && !!max && selectedInterests.length >= max"
                @click="toggle(interest.key)" @keydown.space.prevent="toggle(interest.key)"
                @keydown.enter.prevent="toggle(interest.key)">
                <component :is="ICON_MAP[interest.iconKey]" aria-hidden="true" />
                {{ interest.label }}
            </Button>
        </div>

        <!-- Counter -->
        <p v-if="max" class="text-xs text-muted-foreground" aria-live="polite">
            <span :class="selectedInterests.length >= max && 'text-primary font-medium'">
                {{ selectedInterests.length }}
            </span>
            / {{ max }} ausgewählt
        </p>
    </div>
</template>

<script lang="ts" setup>
import { watchDebounced } from '@vueuse/core';
import {
    BaggageClaim, Bike, BookOpen, Camera,
    CookingPot, Dumbbell, Fish, Footprints, Gamepad2,
    Headset, Leaf, Mountain, Music, Palette,
    Plane, Tent, Waves,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import type { Interest, InterestIconKey } from '~~/shared/types/UserProfileTypes';

const props = withDefaults(defineProps<{
    interests?: string[];
    max?: number;
}>(), {
    interests: () => [],
});

const selectedInterests = toRef(props.interests);

const ICON_MAP: Record<InterestIconKey, any> = {
    Footprints, CookingPot, Gamepad2, Plane, Camera,
    Music, Bike, Mountain, Waves, Tent, Dumbbell,
    Palette, BookOpen, Fish, Leaf, BaggageClaim, Headset,
    Sword: Dumbbell,
    Drama: Palette,
    Car: BaggageClaim,
};

const { data: availableInterests } = await useFetch<Interest[]>('/api/v1/app/profile/interests/availableInterests', {
    default: () => [],
});

const isSelected = (key: string) => selectedInterests.value.includes(key);

const toggle = (key: string) => {
    if (isSelected(key)) {
        selectedInterests.value = selectedInterests.value.filter(k => k !== key);
    } else {
        if (props.max && selectedInterests.value.length >= props.max) return;
        selectedInterests.value = [...selectedInterests.value, key];
    }
};

watchDebounced(selectedInterests, async (newVal) => {
    try {
        await $fetch('/api/v1/app/profile/interests/update', {
            method: 'PATCH',
            body: { interests: newVal },
        });
        toast.success('Interessen aktualisiert');
    } catch (error) {
        toast.error('Fehler beim Aktualisieren der Interessen');
    }
}, { debounce: 1500 });
</script>