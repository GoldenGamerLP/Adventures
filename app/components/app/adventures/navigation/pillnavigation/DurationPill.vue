<template>
  <template v-if="computedNumbers.length > 1">
    Von {{ formatMinToMMHH(computedNumbers[0]) }} bis {{ formatMinToMMHH(computedNumbers[1]) }}
  </template>
</template>

<script lang="ts" setup>
const props = defineProps<{
    //One or two numbers separated by a comma
    duration: string;
}>();

const computedNumbers = computed(() => {
    return props.duration.split(',').map(num => Number(num));
});

const formatMinToMMHH = (minutes: number | undefined) => {
    if (minutes === undefined || isNaN(minutes)) return '';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
};
</script>
