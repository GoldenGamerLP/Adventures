<template>
  <Button
    v-if="!isAtLimit"
    variant="outline"
    class="w-full"
    :disabled="isLoading"
    @click="createNewDraft"
  >
    <template v-if="isLoading">
      <Spinner class="mr-2" />
      Neues Adventure wird erstellt...
    </template>
    <template v-else>
      <Plus class="size-4" />
      Neues Adventure erstellen
    </template>
  </Button>
</template>

<script lang="ts" setup>
import { Plus } from 'lucide-vue-next';

const props = defineProps<{
    isAtLimit: boolean;
}>();

const isLoading = ref(false);

const createNewDraft = async () => {
    if (isLoading.value) return;

    isLoading.value = true;

    try {
        const newDraft = await $fetch('/api/v1/app/adventures/create/requestId', {
            method: 'POST',
        });

        await navigateTo(`/adventures/drafts/${newDraft}`);
    } catch (error) {
        console.error('Error creating new draft:', error);
    } finally {
        isLoading.value = false;
    }
};
</script>