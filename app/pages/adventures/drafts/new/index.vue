<template>
  <Alert>
    <AlertTitle>{{ $t('redirect_title') }}</AlertTitle>
    <AlertDescription>
      {{ $t('redirect_description') }}
    </AlertDescription>
  </Alert>
</template>

<script lang="ts" setup>

const { $t } = useI18n();

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