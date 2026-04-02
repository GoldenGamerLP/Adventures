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
          <DropdownMenu v-if="isOwner">
            <DropdownMenuTrigger as-child>
              <Button variant="secondary" size="icon">
                <MoreVerticalIcon />
                <span class="sr-only">{{ $t('sr_options') }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Playlist Optionen</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Berechtigungen</DropdownMenuItem>
              <DropdownMenuItem>Mitglieder</DropdownMenuItem>
              <DropdownMenuItem>

              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div class="sticky top-0">
          <AppMiscImagesPreview :preview-images="playlistInfo.previewImages" class="w-full h-48 sm:h-72 blur" />
        </div>
        <main class="sticky top-0">
          <header class="py-4 space-y-2 bg-linear-180 from-transparent via-card/80 to-card px-2">
            <div class="flex flex-nowrap items-center gap-4">
              <h1 class="text-2xl font-bold line-clamp-1">
                <template v-if="isVirtual">
                  {{ $t(playlistInfo.name) }}
                </template>
                <template v-else>
                  {{ playlistInfo.name }}
                </template>
              </h1>
              <span class="text-xs text-muted-foreground">
                {{ $tc('component_playlists_entry_count', { count: playlistInfo.entryCount }) }}
              </span>
            </div>
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
              <template v-if="isVirtual">
                {{ $t(playlistInfo.description!) }}
              </template>
              <template v-else>
                {{ playlistInfo.description }}
              </template>
            </p>
            <div class="flex items-center gap-2">
              <Button variant="outline" as-child>
                <NuxtLink :to="`/profile/${playlistInfo.owner._id}`">
                  {{ $t('common_view_profile') }}
                </NuxtLink>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button variant="outline" color="destructive" :disabled="isVirtual || !isOwner">
                    {{ $t('common_delete') }}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Bist du sicher, dass du diese Playlist löschen möchtest?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion kann nicht rückgängig gemacht werden. Alle Einträge in der Playlist gehen verloren.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      Nein, nicht löschen
                    </AlertDialogCancel>
                    <AlertDialogAction @click="deletePlaylist">
                      Ja, Playlist löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </header>
          <div class="flex flex-col gap-4 bg-card rounded-b-lg">
            <template v-for="entry in playlist" :key="entry._id">
              <AppPlaylistsPlaylistEntry :entry="entry!" @entry:delete="deleteEntry" :isVirtual="isVirtual" />
            </template>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ImageOff, MoreVerticalIcon, SearchAlert } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const { $t } = useI18n();
const route = useRoute();

const playlistId = route.params.playlistId as string;

const { data: playlistInfo } = await useFetch(`/api/v1/app/playlists/${playlistId}/info`, {
  key: `playlist-info-${playlistId}`,
  method: "GET",
});

const { data: playlist, error, refresh: refreshEntries } = await useFetch<AdventureListEntry[]>(`/api/v1/app/playlists/${playlistId}/entries`, {
  key: `playlist-entries-${playlistId}`,
  method: "GET",
});

const isVirtual = computed(() => {
  return playlistInfo.value?.listType === 'virtual' || false;
});

const isOwner = computed(() => {
  const user = useUser();
  return playlistInfo.value?.owner._id === user.value?._id;
});

definePageMeta({
  layout: 'navigation-bar',
});

useHead({
  title: playlistInfo.value ? playlistInfo.value.name : $t('common_app_name') as string,
  titleTemplate(title) {
    return title ? `${title} - ${$t('common_app_name')}` : $t('common_app_name') as string;
  },
});


const deletePlaylist = async () => {
  try {
    await $fetch(`/api/v1/app/playlists/${playlistId}`, {
      method: "DELETE",
    });
    //Nach Löschung zurück zur Profilseite navigieren
    navigateTo(`/profile/${playlistInfo.value?.owner._id}`);
    toast.success("Playlist erfolgreich gelöscht");
  } catch (err) {
    console.error("Error deleting playlist:", err);
    toast.error("Fehler beim Löschen der Playlist");
  }
};

const deleteEntry = async (entryId: string) => {
  try {
    await $fetch(`/api/v1/app/playlists/${playlistId}/entry`, {
      method: "DELETE",
      body: JSON.stringify({ adventureEntryId: entryId }),
    });
    refreshEntries();
    toast.success("Eintrag erfolgreich gelöscht");
  } catch (err) {
    console.error("Error deleting playlist entry:", err);
    toast.error("Fehler beim Löschen des Eintrags");
  }
};
</script>