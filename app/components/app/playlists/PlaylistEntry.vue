<template>
  <Item>
    <ItemMedia variant="image">
      <img
        v-if="entry.populatedAdventure!.pictureIds.length > 0"
        :src="toPicturePath(entry.populatedAdventure!.pictureIds[0])"
        :alt="$t('component_playlists_entry_image_alt') as string"
      />
    </ItemMedia>
    <ItemContent>
      <ItemTitle>{{ entry.populatedAdventure!.title }}</ItemTitle>
      <ItemDescription>{{ entry.populatedAdventure!.description }}</ItemDescription>
      <div>
        <Badge variant="secondary">
          {{ $t('component_playlists_entry_added', {
            date: td(entry.createdAt, {
              dateStyle: 'medium', timeStyle: 'short'
            })
          }) }}
        </Badge>
      </div>
    </ItemContent>

    <ItemActions>
      <ButtonGroup>
        <Button variant="link" as-child>
          <NuxtLink :to="`/adventures/${entry.adventureId}`">
            {{ $t('common_view') }}
          </NuxtLink>
        </Button>
        <Button
          v-if="!props.isVirtual"
          variant="link"
          color="destructive"
          @click="$emit('entry:delete', entry._id)"
        >
          {{ $t('common_delete') }}
        </Button>
      </ButtonGroup>
    </ItemActions>
  </Item>
</template>

<script setup lang="ts">
const props = defineProps<{
  entry: AdventureListEntry;
  isVirtual: boolean;
}>();

defineEmits(['entry:delete']);


const { $t, td } = useI18n();


</script>