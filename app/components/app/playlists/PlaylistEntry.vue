<template>
  <Item>
    <ItemMedia variant="image">
      <img
        v-if="entry.populatedAdventure!.pictureIds.length > 0"
        :src="toPicturePath(entry.populatedAdventure!.pictureIds[0])"
        alt="Abenteuerbild"
      />
    </ItemMedia>
    <ItemContent>
      <ItemTitle>{{ entry.populatedAdventure!.title }}</ItemTitle>
      <ItemDescription>{{ entry.populatedAdventure!.description }}</ItemDescription>
      <div>
        <Badge variant="secondary">
          Hinzugefügt
          <NuxtTime :datetime="entry.createdAt" relative />
        </Badge>
      </div>
    </ItemContent>

    <ItemActions>
      <Button variant="link" as-child>
        <NuxtLink :to="`/adventures/${entry.adventureId}`">
          Ansehen!
        </NuxtLink>
      </Button>
    </ItemActions>
  </Item>
</template>

<script setup lang="ts">


const props = defineProps<{
    entry: AdventureListEntry;
}>();

</script>