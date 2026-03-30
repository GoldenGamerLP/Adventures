<template>
    <Dialog v-model:open="isOpen">
        <DialogTrigger as-child>
            <Button variant="ghost" size="icon" @click.stop.prevent>
                <component :is="computedIsInAnyPlaylist ? BookmarkCheck : Bookmark" />
                <span class="sr-only">
                    Add to adevnture list
                </span>
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ $t('component_playlists_add_to_playlist') }}
                </DialogTitle>
                <DialogDescription>
                    {{ $t('component_playlists_add_to_playlist_description', { adventure: props.adventure.title }) }}
                </DialogDescription>
            </DialogHeader>
            <div>
                <LazyAppPlaylistsSelectPlaylistView @playlist-selected="addAdventureToPlaylist" :disabled="isLoading"
                    :adventure-lists="foundPlaylistIds" />
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { Bookmark, BookmarkCheck } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const props = defineProps<{
    adventure: AdventureWithMeta;
}>();

const foundPlaylistIds = ref(props.adventure.adventureListIds || []);
const isOpen = ref(false);
const isLoading = ref(false);

const computedIsInAnyPlaylist = computed(() => {
    return foundPlaylistIds.value.length > 0;
});

const addAdventureToPlaylist = async (playlistId: string, force: boolean = false) => {
    if (isLoading.value) return;
    isLoading.value = true;

    try {
        const result = await $fetch(`/api/v1/app/playlists/${playlistId}/add`, {
            method: 'POST',
            body: JSON.stringify({
                adventureId: props.adventure._id,
                force: force,
            }),
        });


        if (result && result.status === 'already_exists') {
            toast.info('Adventure ist bereits in der Playlist', {
                action: {
                    label: 'Trotzdem hinzufügen',
                    onClick: () => addAdventureToPlaylist(playlistId, true),
                }
            });
        } else {
            toast.success('Adventure wurde zur Playlist hinzugefügt');
        }

        foundPlaylistIds.value = [...foundPlaylistIds.value, playlistId];
    } catch (error) {
        toast.error('Fehler beim Hinzufügen des Adventures zur Playlist');
        console.error('Error adding adventure to playlist:', error);
    } finally {
        isLoading.value = false;
        isOpen.value = false;
    }
}


</script>