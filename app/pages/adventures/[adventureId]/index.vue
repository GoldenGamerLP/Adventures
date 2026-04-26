<template>
  <div v-if="pending" class="mx-auto max-w-2xl flex flex-col h-screen space-y-4 py-2 px-2 sm:px-0">
    <Skeleton class="h-16 w-full" />
    <div class="grid grid-cols-6 h-72 gap-2">
      <Skeleton class="col-span-4 h-full" />
      <Skeleton class="col-span-2 h-full" />
    </div>
    <Skeleton class="flex-1 w-full" />
  </div>
  <Empty v-else-if="error">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <SearchAlertIcon />
      </EmptyMedia>
      <EmptyTitle>{{ $t('error_title') }}</EmptyTitle>
      <EmptyDescription>
        {{ $t('error_body') }}
        <div>
          {{ error ?? $t('error_fallback') }}
        </div>
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <AppNavigationGoBackButton>
        {{ $t('actions_back') }}
      </AppNavigationGoBackButton>
    </EmptyContent>
  </Empty>
  <AppAdventuresAdventureView v-else :adventure="adventure!" />
</template>

<script lang="ts" setup>
import { SearchAlertIcon } from 'lucide-vue-next';

const { $t } = useI18n();

const route = useRoute();
const adventureId = route.params.adventureId as string;

const { data: adventure, error, pending } = await useFetch<AdventureWithMeta>(
  `/api/v1/app/adventures/${adventureId}`,
  {
    method: 'GET',
    query: route.query,
  }
);

useHead({
  titleTemplate: (titleChunk) => {
    const suffix = $t('title_template_suffix') as string;
    return titleChunk ? `${titleChunk} | ${suffix}` : suffix;
  },
  title: () => adventure.value ? adventure.value.title : $t('title_not_found') as string,
  meta: [
    {
      name: 'description',
      content: adventure.value ? adventure.value.description : $t('description_not_found') as string,
    },
    {
      property: 'og:title',
      content: adventure.value ? adventure.value.title : $t('title_not_found') as string,
    },
    {
      property: 'og:description',
      content: adventure.value ? adventure.value.description : $t('description_not_found') as string,
    },
    {
      property: 'og:image',
      content: adventure.value && adventure.value.pictureIds.length > 0
        ? toPicturePath(adventure.value.pictureIds[0])
        : undefined,
    },
  ],
})
</script>