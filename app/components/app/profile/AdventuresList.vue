<template>
  <ItemGroup v-if="adventures?.length">
    <template v-for="(adventure, index) in adventures" :key="adventure._id">
      <Item>
        <ItemMedia variant="image">
          <img :src="toPicturePath(adventure.pictureIds[0])" alt="Adventure Image" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{{ adventure.title }}</ItemTitle>
          <ItemDescription>{{ adventure.description }} | {{ adventure.visibility }}</ItemDescription>
          <div class="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary" size="sm">
              {{ $t('component_adventures_list_created', { date: td(adventure.createdAt, { dateStyle: 'medium', timeStyle: 'short' }) }) }}
            </Badge>
            <Badge variant="secondary" size="sm">
              {{ adventure.viewCount.totalViews }} {{ $t('common_views') }}
            </Badge>
          </div>
        </ItemContent>
        <ItemActions class="gap-1 sm:w-auto w-full justify-end">
          <Button as-child variant="link">
            <NuxtLink :to="{ name: 'adventures-adventureId', params: { 'adventureId': adventure._id } }">
              {{ $t('common_view') }}
            </NuxtLink>
          </Button>
          <AppAdventuresLikeButton
            :is-liked="adventure.isLikedByUser"
            :adventure-id="adventure._id"
            :likes-count="adventure.likesCount"
          />
          <AppAdventuresEditButton :adventure="adventure" />
        </ItemActions>
      </Item>
      <ItemSeparator v-if="index < adventures!.length - 1" />
    </template>
  </ItemGroup>

  <Empty v-else>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <SearchAlert />
      </EmptyMedia>
      <EmptyTitle>{{ $t('component_adventures_list_empty_title') }}</EmptyTitle>
      <EmptyDescription>
        {{ $t('component_adventures_list_empty_description') }}
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
</template>

<script lang="ts" setup>
import { toPicturePath } from "#shared/utils/SharedUtils";
import { SearchAlert } from 'lucide-vue-next';

const props = defineProps<{
  authorId: string;
}>();

const { $t, td } = useI18n();

const { data: adventures } = await useFetch<AdventureWithMeta[]>('/api/v1/app/profile/own/adventures', {
  key: 'adventures-by-author-' + props.authorId,
});
</script>