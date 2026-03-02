<template>
  <ItemGroup v-if="adventures?.length">
    <template v-for="(adventure, index) in adventures" :key="adventure._id">
      <Item>
        <ItemMedia>
          <Avatar>
            <AvatarImage :src="toPicturePath(adventure.pictureIds[0])" alt="Adventure Image" />
            <AvatarFallback>
              {{ adventure.title.charAt(0) }}
            </AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent class="gap-1">
          <ItemTitle>{{ adventure.title }}</ItemTitle>
          <ItemDescription>{{ adventure.description }} | {{ adventure.visibility }}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <NuxtLink :to="{ name: 'adventures-adventureId', params: { 'adventureId': adventure._id } }">
            <Button variant="outline" size="sm">
              Ansehen
            </Button>
          </NuxtLink>
          <Separator orientation="vertical" />
          <AppAdventuresCreateLikeButton
            :is-liked="adventure.isLikedByUser"
            :adventure-id="adventure._id"
          />
          <Separator orientation="vertical" />
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
      <EmptyTitle>Keine Adventures gefunden</EmptyTitle>
      <EmptyDescription>
        Dieser Autor hat noch keine Adventures erstellt.
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

const { data: adventures } = useFetch<AdventureWithMeta[]>('/api/v1/app/profile/own/adventures', {
    key: 'adventures-by-author-' + props.authorId,
    deep: true,
});
</script>