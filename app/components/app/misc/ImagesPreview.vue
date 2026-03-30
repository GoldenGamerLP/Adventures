<template>
    <!-- Only four images displayed at max, one image should be displayed at full size -->
    <div :class="cn('grid grid-cols-2 overflow-hidden', props.class)"
        v-if="props.previewImages.length">
        <img v-for="image in previewImages" :key="image" :src="toPicturePath(image)"
            :alt="'Placeholder image'" :class="{'object-cover w-full h-full': true, 'col-span-2': previewImages.length === 1}" />
    </div>
    <div :class="cn('flex justify-center items-center', props.class)" v-else>
        <ImageOffIcon class="w-[65%] h-[65%] text-muted-foreground" />
    </div>
</template>

<script setup lang="ts">
import { ImageOffIcon } from 'lucide-vue-next';
import type { HTMLAttributes } from 'vue';
import { cn } from '~/lib/utils';

interface Props {
    previewImages: string[];
    class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
</script>