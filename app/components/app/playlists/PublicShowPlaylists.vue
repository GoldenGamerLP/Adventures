<template>
    <div v-if="playlists?.length">
        <template v-for="(playlist, index) in playlists" :key="playlist._id">
            <NuxtLink :to="`/profile/${playlist.ownerId}/playlists/${playlist._id}`">
                <Item class="hover:bg-accent">
                    <ItemMedia>
                        <AppMiscImagesPreview :preview-images="playlist.previewImages" class="size-16 rounded-lg" />
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
    <Empty v-else>
        <EmptyHeader>
            <EmptyMedia variant="icon">
                <ListChecksIcon />
            </EmptyMedia>
            <EmptyTitle>{{ $t('component_playlists_no_playlists_title') }}</EmptyTitle>
        </EmptyHeader>
    </Empty>
</template>

<script setup lang="ts">
import { ListChecksIcon } from 'lucide-vue-next';

const { $t } = useI18n();

const authorId = useRoute().params.authorId;

const { data: playlists, error } = await useFetch(`/api/v1/app/playlists/public`, {
    method: "GET",
    query: {
        userId: authorId,
    }
});
</script>