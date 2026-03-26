<script setup lang="ts">
import { Button, type ButtonVariants } from '@/components/ui/button';
import { Laptop, Moon, Sun } from 'lucide-vue-next';
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"]
  size?: ButtonVariants["size"]
  class?: HTMLAttributes["class"]
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
})

const colorMode = useColorMode();

const toggleColorMode = () => {
  if (colorMode.currentColorMode.value === 'light') {
    colorMode.setColorMode('dark');
  } else if (colorMode.currentColorMode.value === 'dark') {
    colorMode.setColorMode('light');
  } else {
    // If system, switch to the opposite of the current system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    colorMode.setColorMode(prefersDark ? 'light' : 'dark');
  }
}
</script>

<template>
  <Button :variant="props.variant" :size="props.size" :class="props.class" @click="toggleColorMode">
    <Transition name="fade" mode="out-in">
      <component
        :is="colorMode.currentColorMode.value === 'light' ? Sun : colorMode.currentColorMode.value === 'dark' ? Moon : Laptop" />
    </Transition>
    <span class="sr-only">
      {{ colorMode.currentColorMode.value === 'light' ? "Switch to dark mode" : "Switch to light mode" }}
    </span>
  </Button>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
