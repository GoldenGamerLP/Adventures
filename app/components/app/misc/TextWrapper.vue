<template>
  <div class="relative">
    <div ref="textWrapper" :class="cn(isHidden ? 'max-h-64' : 'h-fit', 'overflow-clip')">
      <slot></slot>
    </div>
    <Button
      v-if="hasOverflow"
      variant="link"
      size="sm"
      class="mt-2 relative z-10 w-full"
      @click="isHidden = !isHidden"
    >
      {{ isHidden ? 'Mehr anzeigen' : 'Weniger anzeigen' }}
    </Button>
    <div
      v-if="hasOverflow && isHidden"
      class="absolute bottom-0 inset-x-0 h-1/2 bg-linear-0 rounded-b from-background/50 to-transparent pointer-events-none"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils';

const isHidden = ref(true);
const hasOverflow = ref(false);

const textWrapper = ref<HTMLElement | null>(null);

onMounted(() => {
    checkOverflow();
});

const checkOverflow = () => {
    if (textWrapper.value) {
        hasOverflow.value = textWrapper.value.scrollHeight > textWrapper.value.clientHeight;
    }
};
</script>