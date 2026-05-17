<template>
  <div class="relative w-full">
    <div
      ref="scrollContainer"
      class="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-4 px-4 touch-pan-x"
    >
      <div
        v-for="(image, index) in pictureIds"
        :key="index"
        class="shrink-0 snap-center first:snap-start last:snap-end"
        :class="{ 'w-full!': pictureIds.length === 1 }"
        @click="$emit('clickImage', index)"
      >
        <img
          :src="toPicturePath(image)"
          alt="Gallery Image"
          class="object-cover h-72 aspect-video"
          loading="lazy"
          :class="{ 'w-full! aspect-auto': pictureIds.length === 1 }"
        />
      </div>
      <div
        v-if="pictureIds.length > 1"
        class="flex justify-center gap-1.5 mt-2 absolute right-[50%] translate-x-1/2 bottom-8 z-10 bg-muted/10 px-3 py-1 rounded-full"
      >
        <button
          v-for="(_, index) in pictureIds"
          :key="index"
          :aria-label="`Bild ${index + 1}`"
          class="size-2.5 rounded-full transition-all duration-200"
          :class="[
            activeIndex === index
              ? 'bg-primary w-4'
              : 'bg-muted-foreground'
          ]"
          @click.prevent.stop="scrollToImage(index)"
        >
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
    pictureIds: string[],
}>();

defineEmits(["clickImage"])

const scrollContainer = ref<HTMLElement>();
const activeIndex = ref(0);

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
.scrollbar-none::-webkit-scrollbar {
    display: none;
}

.scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>