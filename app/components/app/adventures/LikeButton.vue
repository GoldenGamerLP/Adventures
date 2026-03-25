<template>
  <Button
    variant="ghost"
    :class="{ 'text-red-500': changeableLikeStatus }"
    :disabled="!user || isLoading"
    @click.stop.prevent="toggleLikeStatus(!changeableLikeStatus)"
  >
    <Heart :class="{ 'fill-red-500': changeableLikeStatus }" />
    {{ changeableLikeStatus ? props.likesCount + 1 : props.likesCount }}
    <span class="sr-only">{{ changeableLikeStatus ? t('component_adventures_unlike_sr') : t('component_adventures_like_sr') }}</span>
  </Button>
</template>

<script lang="ts" setup>
import { useThrottleFn } from '@vueuse/core';
import { Heart } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
    adventureId: string;
    isLiked: boolean;
    likesCount: number;
}>(), {
    isLiked: false,
    likesCount: 0,
});

const { t } = useI18n();

const user = useUser();

const changeableLikeStatus = toRef(props.isLiked);
const isLoading = ref(false);

const toggleLikeStatus = useThrottleFn(async (state: boolean) => {
    if (!user.value || isLoading.value || state === changeableLikeStatus.value) return;

    changeableLikeStatus.value = state;
    isLoading.value = true;
    try {
        const result = await $fetch(`/api/v1/app/adventures/${props.adventureId}/like`, {
            method: 'POST',
        });
        changeableLikeStatus.value = result;
    } catch (error) {
        changeableLikeStatus.value = !state;
        console.error('Fehler beim Ändern des Like-Status:', error);
    } finally {
        isLoading.value = false;
    }
}, 1350);
</script>