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
          <AppMiscImagesPreview :preview-images="playlistInfo.previewImages" class="w-full h-48 sm:h-72 blur" />
        </div>
        <main class="sticky top-0">
          <header class="py-4 space-y-2 bg-linear-180 from-transparent via-card/80 to-card px-2">
            <h1 class="text-2xl font-bold">
              {{ playlistInfo.name }}
            </h1>
            <div>
              <div class="text-sm text-muted-foreground flex items-center gap-2">
                <Avatar class="size-6">
                  <AvatarFallback>
                    <ImageOff />
                  </AvatarFallback>
                  <AvatarImage v-if="playlistInfo.owner.profilePictureId"
                    :src="toPicturePath(playlistInfo.owner.profilePictureId)" alt="Profilbild" />
                </Avatar>
                {{ $t('owner_created_by', { name: playlistInfo.owner.name }) }}
              </div>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ playlistInfo.description }}
            </p>
          </header>
          <div class="flex flex-col gap-4 bg-card rounded-b-lg">
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

const playlistId = route.params.playlistId as string;

const { data: playlistInfo } = await useFetch(`/api/v1/app/playlists/${playlistId}/info`, {
  key: `playlist-info-${playlistId}`,
  method: "GET",
});

const { data: playlist, error } = await useFetch<AdventureListEntry[]>(`/api/v1/app/playlists/${playlistId}/entries`, {
  key: `playlist-entries-${playlistId}`,
  method: "GET",
});

useHead({
  title: playlistInfo.value ? playlistInfo.value.name : $t('common_app_name') as string,
  titleTemplate(title) {
    return title ? `${title} - ${$t('common_app_name')}` : $t('common_app_name') as string;
  },
});
</script>