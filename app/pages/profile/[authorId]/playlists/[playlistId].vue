<template>
  <div class="max-w-2xl w-full mx-auto">
    <Empty v-if="error">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchAlert />
        </EmptyMedia>
        <EmptyTitle>
          {{ $t('error_title') }}
        </EmptyTitle>
        <EmptyDescription>
          {{ $t('error_description') }}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
    <div v-else-if="playlist && playlistInfo">
      <div>
        <nav class="flex w-full justify-between p-1 sticky top-0 z-20">
          <AppNavigationGoBackButton :variant="'secondary'" :default-href="'/'" />

          <Button variant="secondary" size="icon">
            <MoreVerticalIcon />
            <span class="sr-only">{{ $t('sr_options') }}</span>
          </Button>
        </nav>
        <div class="sticky top-0">
          <div
            class="grid h-64 w-full rounded-lg grid-cols-2 grid-rows-2 auto-rows-fr overflow-hidden bg-card p-1 blur -my-16 -z-10 shadow-inner relative"
          >
            <img
              v-for="(image, index) in playlistInfo.previewImages"
              :key="index"
              :src="toPicturePath(image)"
              :alt="$t('preview_image_alt') as string"
              class="object-cover aspect-square"
            />
          </div>
        </div>
        <main class="sticky top-0">
          <header class="py-4 space-y-2 bg-linear-180 from-transparent to-card px-2">
            <h1 class="text-2xl font-bold">
              {{ playlistInfo.name }}
            </h1>
            <div>
              <div class="text-sm text-muted-foreground flex items-center gap-2">
                <Avatar class="size-6">
                  <AvatarFallback>
                    <ImageOff />
                  </AvatarFallback>
                  <AvatarImage
                    v-if="playlistInfo.owner.profilePictureId"
                    :src="toPicturePath(playlistInfo.owner.profilePictureId)"
                    alt="Profilbild"
                  />
                </Avatar>
                {{ $t('owner_created_by', { name: playlistInfo.owner.name }) }}
              </div>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ playlistInfo.description }}
            </p>
          </header>
          <div class="flex flex-col gap-4 bg-card">
            <template v-for="entry in playlist" :key="entry._id">
              <AppPlaylistsPlaylistEntry :entry="entry!" />
            </template>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ImageOff, MoreVerticalIcon, SearchAlert } from 'lucide-vue-next';

const { $t } = useI18n();

const route = useRoute();

const authorId = route.params.authorId as string;
const playlistId = route.params.playlistId as string;

const { data: playlistInfo } = await useFetch(`/api/v1/app/playlists/playlistInfo`, {
  method: "GET",
  query: {
    playlistId,
  }
});

const { data: playlist, error } = await useFetch<AdventureListEntry[]>(`/api/v1/app/playlists/playlist`, {
  method: "GET",
  query: {
    playlistId,
  }
});
</script>