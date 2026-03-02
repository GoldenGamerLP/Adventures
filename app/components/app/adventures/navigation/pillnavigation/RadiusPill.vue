<template>
  Umkreis von {{ radius }} km
</template>

<script lang="ts" setup>
const props = defineProps<{
    radius: number;
}>();
</script>