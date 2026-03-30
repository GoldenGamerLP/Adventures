<template>
    <template v-if="isLoading">
        <ol class="grid grid-cols-3 gap-4 py-2">
            <li v-for="i in 3" :key="i" class="flex flex-col rounded-lg bg-card p-2 items-center justify-between">
                <Skeleton class="size-22 rounded-lg" />
                <Skeleton class="mt-1 h-3 w-3/4" />
            </li>
        </ol>
        <div class="mt-6 space-y-4">
            <div v-for="i in 3" :key="i" class="flex items-center gap-4">
                <Skeleton class="size-14" />
                <Skeleton class="h-3 flex-1" />
            </div>
        </div>
    </template>
    <template v-else>
        <div>
            <ol class="grid grid-cols-3 gap-4 py-2">
                <button v-for="playlist in firstNPlaylists" :key="playlist._id"
                    :data-disabled="playlist.listType == 'virtual' || disabled"
                    class="flex flex-col rounded-lg bg-card p-2 items-center justify-between data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50"
                    @click="selectPlaylist(playlist)" @keydown.enter="selectPlaylist(playlist)" tabindex="0">
                    <AppMiscImagesPreview :preview-images="playlist.previewImages" class="size-22 rounded-lg" />
                    <span v-if="adventureIsAlreadyInPlaylist(playlist)" class="text-xs text-muted-foreground mt-1">
                        {{ $t('component_playlists_already_in_playlist') }}
                    </span>
                    <span class="mt-1 line-clamp-2 text-sm font-medium break-after-all">
                        {{ playlist.name }}
                    </span>

                </button>

                <AppPlaylistsCreatePlaylistDialog>
                    <button v-if="(playlists?.length || 0) < 3"
                        class="flex flex-col rounded-lg bg-card p-2 items-center justify-between cursor-pointer"
                        tabindex="0">
                        <div class="flex justify-center items-center size-22 rounded-lg bg-card">
                            <PlusIcon class="size-16 text-muted-foreground" />
                        </div>
                        <span class="mt-1 line-clamp-2 text-sm font-medium break-after-all">
                            {{ $t('component_playlists_new_playlist') }}
                        </span>
                    </button>
                </AppPlaylistsCreatePlaylistDialog>
            </ol>
            <div v-if="(playlists?.length || 0) >= 3" class="mt-6">
                <p>{{ $t('component_playlists_more_playlists') }}</p>
                <ItemGroup>
                    <AppPlaylistsCreatePlaylistDialog>
                        <Item tabindex="0" as="button">
                            <ItemMedia variant="icon">
                                <PlusIcon />
                            </ItemMedia>
                            <ItemContent>
                                <ItemTitle>
                                    {{ $t('component_playlists_new_playlist') }}
                                </ItemTitle>
                            </ItemContent>
                        </Item>
                    </AppPlaylistsCreatePlaylistDialog>
                    <ItemSeparator v-if="lastNPlaylists.length > 0" />
                    <template v-for="(playlist, index) in lastNPlaylists" :key="playlist._id">
                        <Item :data-disabled="playlist.listType == 'virtual' || disabled" as="button"
                            @click="selectPlaylist(playlist)" @keydown.enter="selectPlaylist(playlist)" tabindex="0">
                            <ItemMedia :variant="playlist.previewImages.length ? 'image' : 'icon'">
                                <AppMiscImagesPreview :preview-images="playlist.previewImages" class="rounded-lg" />
                            </ItemMedia>
                            <ItemContent>
                                <ItemTitle>
                                    {{ playlist.name }}
                                </ItemTitle>
                                <ItemDescription v-if="adventureIsAlreadyInPlaylist(playlist)">
                                    {{ $t('component_playlists_already_in_playlist') }}
                                </ItemDescription>
                            </ItemContent>
                        </Item>
                        <ItemSeparator v-if="index < lastNPlaylists.length - 1" />
                    </template>
                </ItemGroup>
            </div>
        </div>
    </template>
</template>

<script setup lang="ts">
import { PlusIcon } from 'lucide-vue-next';

const props = defineProps<{
    disabled?: boolean;
    adventureLists: string[]
}>();

const emits = defineEmits(['playlist-selected']);

const { data: playlists, pending: isLoading } = useFetch('/api/v1/app/playlists/own', {
    key: 'playlists-own',
    query: {
        mode: "private",
        includeVirtual: false
    }
});

const selectPlaylist = (playlist: AdventureListWithMeta) => {
    if (playlist.listType === 'virtual' || props.disabled) return;
    emits('playlist-selected', playlist._id!);
}

const adventureIsAlreadyInPlaylist = (playlist: AdventureListWithMeta) => {
    return props.adventureLists.includes(playlist._id!);
}

const firstNPlaylists = computed(() => {
    return playlists.value?.slice(0, 3) || [];
});

const lastNPlaylists = computed(() => {
    return playlists.value?.slice(3) || [];
});
</script>