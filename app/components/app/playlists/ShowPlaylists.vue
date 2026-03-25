<template>
  <div>
    <template v-for="(playlist, index) in playlists" :key="playlist._id">
      <NuxtLink :to="`/profile/${playlist.ownerId}/playlists/${playlist._id}`">
        <Item class="hover:bg-accent">
          <ItemMedia>
            <div
              class="grid size-22 rounded-lg grid-cols-2 grid-rows-2 auto-rows-fr overflow-hidden bg-card"
            >
              <img
                v-for="image in playlist.previewImages"
                :key="image"
                :src="toPicturePath(image)"
                :alt="$t('component_playlists_preview_image_alt') as string"
                class="object-cover aspect-square"
              />
            </div>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{{ playlist.name }}</ItemTitle>
            <ItemDescription>{{ playlist.description }}</ItemDescription>
            <div class="flex gap-2">
              <Badge variant="secondary">
                {{ $t('component_playlists_entry_count', { count: playlist.entryCount }) }}
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
</template>

<script setup lang="ts">
const props = defineProps<{
    for: "own" | "public";
}>();

const { $t } = useI18n();

const { data: playlists, error } = await useFetch(`/api/v1/app/playlists/${props.for}`, {
    method: "GET",
});
</script>