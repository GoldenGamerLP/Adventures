<template>
  <template v-if="pending">
    <Spinner /> Laden...
  </template>
  <template v-else>
    {{ city?.place || "Standort Nicht gefunden" }}
  </template>
</template>

<script lang="ts" setup>
const props = defineProps<{
    //zipcode
    location: string;
}>();

const { data: city, pending } = useFetch('/api/v1/app/geo/zipcode', {
    key: 'zipcode-' + props.location,
    query: {
        zipcode: props.location
    },
    lazy: true,
})
</script>