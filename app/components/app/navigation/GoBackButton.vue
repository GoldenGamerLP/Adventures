<script setup lang="ts">
import { ChevronLeftIcon } from 'lucide-vue-next';
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import type { ButtonVariants } from '~/components/ui/button';

const props = withDefaults(defineProps<Props>(), {
    as: "button",
    defaultHref: "/"
})

const router = useRouter();

interface Props extends PrimitiveProps {
    variant?: ButtonVariants["variant"]
    size?: ButtonVariants["size"]
    class?: HTMLAttributes["class"]
    defaultHref?: string
    forceHref?: boolean
}

const goBack = () => {
    if (window.history.length > 1 && !props.forceHref) {
        router.back();
    } else {
        navigateTo(props.defaultHref);
    }
};
</script>

<template>
  <Button
    :class="props.class"
    :variant="props.variant"
    :size="props.size"
    :aria-label="'Go back'"
    @click="goBack"
  >
    <slot>
      <ChevronLeftIcon />
    </slot>
  </Button>
</template>