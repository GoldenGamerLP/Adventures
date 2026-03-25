<template>
  <LazyAppDraftsDraftForm v-if="draftData" :draft-data="draftData" :draft-id="draftId" />
  <Empty v-else>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <FileExclamationPointIcon />
      </EmptyMedia>
      <EmptyTitle>{{ $t('error_title') }}</EmptyTitle>
      <EmptyDescription>
        {{ $t('error_description') }}
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button as-child>
        <NuxtLink to="/adventures/drafts">
          {{ $t('actions_back') }}
        </NuxtLink>
      </Button>
    </EmptyContent>
    <Button
      variant="link"
      as-child
      class="text-muted-foreground"
      size="sm"
    >
      <a href="#">
        {{ $t('actions_support') }}
        <ArrowUpRightIcon />
      </a>
    </Button>
  </Empty>
</template>

<script lang="ts" setup>
import { ArrowUpRightIcon, FileExclamationPointIcon } from 'lucide-vue-next';

const { $t } = useI18n();

const draftId = useRoute().params.draftId as string;

// Fetch draft data
const {
  data: draftData,
} = await useFetch<AdventureDraftWithPictures>(`/api/v1/app/adventures/drafts/${draftId}`,
  {
    key: 'adventure-draft-' + draftId,
  }
);

useHead({
  titleTemplate: (titleChunk) => {
    const title = $t('title_edit') as string;
    return titleChunk ? `${titleChunk} - ${title}` : title;
  },
  title: draftData.value ? draftData.value.formData.title : $t('title_edit') as string,
});


</script>