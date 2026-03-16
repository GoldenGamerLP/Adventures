<template>
  <Button
    variant="ghost"
    size="icon"
    :disabled="isLoading"
    @click="navigateAndEdit"
  >
    <template v-if="!isLoading">
      <slot>
        <EditIcon />
      </slot>
      <span class="sr-only">Editieren</span>
    </template>
    <template v-else>
      <Spinner />
      <span class="sr-only">Laden...</span>
    </template>
  </Button>
</template>

<script setup lang="ts">
import { EditIcon } from "lucide-vue-next";

const props = defineProps<{
  adventure: Adventure;
}>();

const isLoading = ref(false);

const navigateAndEdit = async () => {
  isLoading.value = true;
  try {
    const res = await $fetch<string>(`/api/v1/app/adventures/${props.adventure._id}/edit`, {
      method: 'POST'
    });

    await navigateTo(`/adventures/drafts/${res}`);
  } catch (error) {
    console.error("Fehler beim Veröffentlichen des Drafts:", error);
  } finally {
    isLoading.value = false;
  }
}
</script>