<template>
  <!-- Mobile: Horizontal Carousel -->
  <div class="relative">
    <div ref="scrollContainer" class="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-4 px-4">
      <div
        v-for="(image, index) in images"
        :key="index"
        class="shrink-0 snap-center first:snap-start last:snap-end"
        :class="[
          index === 0 ? 'w-[85%]' : 'w-[70%]'
        ]"
        @click="openLightbox(index)"
      >
        <img
          :src="toPicturePath(image)"
          alt="Gallery Image"
          class="w-full object-cover rounded-xl"
          :class="[index === 0 ? 'aspect-4/3' : 'aspect-square']"
        />
      </div>
      <div
        v-if="images.length > 1"
        class="flex justify-center gap-1.5 mt-2 absolute right-[50%] translate-x-1/2 bottom-16 z-10 bg-muted/60 px-3 py-1 rounded-full"
      >
        <button
          v-for="(_, index) in images"
          :key="index"
          :aria-label="`Bild ${index + 1}`"
          class="size-2 rounded-full transition-all duration-200"
          :class="[
            activeIndex === index
              ? 'bg-primary w-4'
              : 'bg-muted-foreground'
          ]"
          @click="scrollToImage(index)"
        >
        </button>
      </div>
    </div>
  </div>
  <Lightbox ref="lightboxRef" :images="images" />
</template>

<script lang="ts" setup>
import { toPicturePath } from "#shared/utils/SharedUtils";
import Lightbox from '../misc/Lightbox.vue';

const props = defineProps<{
  images: string[];
}>();

const lightboxRef = ref<InstanceType<typeof Lightbox>>();
const scrollContainer = ref<HTMLElement>();
const activeIndex = ref(0);

const openLightbox = (index: number) => {
  lightboxRef.value?.open(index);
};

// Scroll zu bestimmtem Bild (mobile)
const scrollToImage = (index: number) => {
  if (!scrollContainer.value) return;
  const children = scrollContainer.value.children;
  if (children[index]) {
    (children[index] as HTMLElement).scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }
};

// Intersection Observer für aktiven Index (mobile)
onMounted(() => {
  if (!scrollContainer.value) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Array.from(scrollContainer.value!.children).indexOf(
            entry.target as Element
          );
          if (index !== -1) {
            activeIndex.value = index;
          }
        }
      });
    },
    {
      root: scrollContainer.value,
      threshold: 0.6,
    }
  );

  Array.from(scrollContainer.value.children).forEach((child) => {
    observer.observe(child);
  });

  onUnmounted(() => observer.disconnect());
});
</script>

<style scoped>
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>