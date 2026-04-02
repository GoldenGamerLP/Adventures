<template>
  <div v-if="playlists?.length">
    <template v-for="(playlist, index) in playlists" :key="playlist._id">
      <NuxtLink :to="`/profile/${playlist.ownerId}/playlists/${playlist._id}`">
        <Item class="hover:bg-accent">
          <ItemMedia>
            <AppMiscImagesPreview :preview-images="playlist.previewImages" class="size-16 rounded-lg" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              <template v-if="isVirtual(playlist)">
                {{ $t(playlist.name) }}
              </template>
              <template v-else>
                {{ playlist.name }}
              </template>
            </ItemTitle>
            <ItemDescription>
              <template v-if="isVirtual(playlist)">
                {{ $t(playlist.description!) }}
              </template>
              <template v-else>
                {{ playlist.description }}
              </template>
            </ItemDescription>
            <div class="flex gap-2">
              <Badge variant="secondary">
                {{ $tc('component_playlists_entry_count', { count: playlist.entryCount }) }}
              </Badge>
              <Badge variant="secondary">
                {{ $t('component_playlists_type', { type: playlist.listType }) }}
              </Badge>
            </div>
          </ItemContent>
        </Item>
      </NuxtLink>
      <ItemSeparator v-if="index < playlists!.length - 1" />
    </template>
  </div>
  <Empty v-else>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <ListChecksIcon />
      </EmptyMedia>
      <EmptyTitle>{{ $t('component_playlists_no_playlists_title') }}</EmptyTitle>
      <EmptyDescription>
        {{ $t('component_playlists_no_playlists_description') }}
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
</template>

<script setup lang="ts">
import { ListChecksIcon } from 'lucide-vue-next';

const { $t } = useI18n();

const { data: playlists, error } = await useFetch(`/api/v1/app/playlists/own`, {
  method: "GET",
  query: {
    includeVirtual: true,
    mode: 'private',
  },
});

const isVirtual = (playlist: AdventureList) => {
  return playlist.listType === 'virtual';
};
</script>