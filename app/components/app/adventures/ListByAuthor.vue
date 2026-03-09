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
        <ItemContent>
          <ItemTitle class="line-clamp-1">
            {{ adventure.title }}
          </ItemTitle>
          <ItemDescription class="line-clamp-1">
            {{ adventure.description }}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <NuxtLink :to="{ name: 'adventures-adventureId', params: { 'adventureId': adventure._id } }">
            <Button variant="outline" size="sm">
              Ansehen
            </Button>
          </NuxtLink>
          <Separator orientation="vertical" />
          <AppAdventuresLikeButton :is-liked="adventure.isLikedByUser" :adventure-id="adventure._id" />
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

const { data: adventures } = await useFetch('/api/v1/app/adventures/getByAuthor', {
  key: 'adventures-by-author',
  query: {
    authorId: props.authorId
  },
  deep: true,
});
</script>