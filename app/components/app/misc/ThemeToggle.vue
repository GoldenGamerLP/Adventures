<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Laptop, Moon, Sun } from 'lucide-vue-next';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
    class?: HTMLAttributes["class"];
}>();

const colorMode = useColorMode();

</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" v-bind="props">
        <component
          :is="colorMode.currentColorMode.value === 'light' ? Sun : colorMode.currentColorMode.value === 'dark' ? Moon : Laptop"
        />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="colorMode.setColorMode('light')">
        Light
      </DropdownMenuItem>
      <DropdownMenuItem @click="colorMode.setColorMode('dark')">
        Dark
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
