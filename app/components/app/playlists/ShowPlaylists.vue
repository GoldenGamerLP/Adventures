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
                class="object-cover aspect-square"
              />
            </div>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{{ playlist.name }}</ItemTitle>
            <ItemDescription>{{ playlist.description }}</ItemDescription>
            <div class="flex gap-2">
              <Badge variant="secondary">
                {{ playlist.entryCount }} Abenteuer
              </Badge>
              <Badge variant="secondary">
                Typ {{ playlist.listType }}
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

const { data: playlists, error } = await useFetch(`/api/v1/app/playlists/${props.for}`, {
    method: "GET",
});
</script>