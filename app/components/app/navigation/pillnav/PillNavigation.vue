<template>
  <div class="relative">
    <ol class="flex gap-2 overflow-x-auto py-2 px-1 scrollbar-hide">
      <li v-for="item in items" :key="`${item.key}-${item.value}`">
        <Button
          :variant="isSelected(item.key, item.value) ? 'default' : 'secondary'"
          size="sm"
          :disabled="disabled"
          class="shrink-0 transition-all"
          @click="toggleItem(item.key, item.value)"
        >
          <span
            v-if="isSelected(item.key, item.value)"
            class="size-2 rounded-full bg-primary-foreground mr-1.5"
          ></span>
          <slot v-bind="item">
            {{ item.label }}
          </slot>
        </Button>
      </li>
    </ol>
  </div>
</template>

<script lang="ts" setup>
interface NavigationItem {
    key: string;
    value: string;
    label: string;
}

const props = defineProps<{
    items: NavigationItem[];
    modelValue: { key: string; value: string }[];
    onlyOneKeyPerSelection?: boolean;
    disabled?: boolean;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: { key: string; value: string }[]];
}>();

const isSelected = (key: string, value: string) => {
    return props.modelValue.some(item => item.key === key && item.value === value);
};

const toggleItem = (key: string, value: string) => {
    if (props.disabled) return;

    const isCurrentlySelected = isSelected(key, value);

    if (isCurrentlySelected) {
        // Remove item
        emit('update:modelValue', props.modelValue.filter(item => !(item.key === key && item.value === value)));
    } else {
        // Add item
        if (props.onlyOneKeyPerSelection) {
            // Remove any existing item with the same key
            const filtered = props.modelValue.filter(item => item.key !== key);
            emit('update:modelValue', [...filtered, { key, value }]);
            return;
        }

        emit('update:modelValue', [...props.modelValue, { key, value }]);
    }
};
</script>

<style scoped>
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
</style>