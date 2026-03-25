<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed flex-col inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm space-y-2"
        @click="close"
      >
        <Button
          variant="ghost"
          size="icon"
          class="absolute top-4 right-4"
          :aria-label="$t('app_gallery_lightbox_close')"
          @click.stop="close"
        >
          <X class="h-6 w-6" />
        </Button>

        <Button
          v-if="canGoPrevious"
          variant="ghost"
          size="icon"
          class="absolute left-4"
          :aria-label="$t('app_gallery_lightbox_prev')"
          @click.stop="previous"
        >
          <ChevronLeft class="h-8 w-8" />
        </Button>

        <Button
          v-if="canGoNext"
          variant="ghost"
          size="icon"
          class="absolute right-4"
          :aria-label="$t('app_gallery_lightbox_next')"
          @click.stop="next"
        >
          <ChevronRight class="h-8 w-8" />
        </Button>

        <Transition
          mode="out-in"
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-300"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="currentImage"
            :key="currentImage"
            class="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            @click.stop
          >
            <img
              :src="toPicturePath(currentImage)"
              :alt="currentImage"
              class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-lg"
              loading="lazy"
            />
          </div>
        </Transition>

        <Badge variant="secondary">
          {{ $t('app_gallery_lightbox_counter', { current: currentIndex + 1, total: images.length }) }}
        </Badge>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { toPicturePath } from "#shared/utils/SharedUtils";

const props = defineProps<{
    images: string[];
    initialIndex?: number;
}>();

const emit = defineEmits<{
    close: [];
}>();

const isOpen = ref(false);
const currentIndex = ref(props.initialIndex || 0);

const currentImage = computed(() => props.images[currentIndex.value]);
const canGoPrevious = computed(() => currentIndex.value > 0);
const canGoNext = computed(() => currentIndex.value < props.images.length - 1);

const open = (index: number = 0) => {
    currentIndex.value = index;
    isOpen.value = true;
    document.body.style.overflow = 'hidden';
};

const close = () => {
    isOpen.value = false;
    document.body.style.overflow = '';
    emit('close');
};

const next = () => {
    if (canGoNext.value) {
        currentIndex.value++;
    }
};

const previous = () => {
    if (canGoPrevious.value) {
        currentIndex.value--;
    }
};

// Keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
    if (!isOpen.value) return;

    switch (e.key) {
        case 'Escape':
            close();
            break;
        case 'ArrowLeft':
            previous();
            break;
        case 'ArrowRight':
            next();
            break;
    }
};

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
});

defineExpose({
    open,
    close,
});
</script>