<template>
  <Alert>
    <AlertTitle>Heads up!</AlertTitle>
    <AlertDescription>
      Einen moment, du wirst weitergeleitet...
    </AlertDescription>
  </Alert>
</template>

<script lang="ts" setup>

onMounted(async () => {
    try {
        const draftId = await $fetch('/api/v1/app/adventures/create/requestId', {
            method: 'POST',
        });

        await navigateTo(`/adventures/drafts/${draftId}`);
    } catch (error) {
        console.log('Error creating new draft:', error);
    }
});

</script>