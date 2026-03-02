<template>
  <ItemGroup v-if="adventureHistory?.length">
    <template v-for="(adventure, index) in adventureHistory" :key="adventure._id">
      <Item>
        <ItemMedia>
          <Avatar>
            <AvatarImage :src="toPicturePath(adventure.pictureIds[0])" alt="Adventure Image" />
            <AvatarFallback>
              {{ adventure.title.charAt(0) }}
            </AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent class="gap-1">
          <ItemTitle>{{ adventure.title }}</ItemTitle>
          <ItemDescription>{{ adventure.description }} | {{ adventure.view.firstViewedAt }}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <NuxtLink :to="{ name: 'adventures-adventureId', params: { 'adventureId': adventure._id } }">
            <Button variant="outline" size="sm">
              Ansehen
            </Button>
          </NuxtLink>
        </ItemActions>
      </Item>
      <ItemSeparator v-if="index < adventureHistory!.length - 1" />
    </template>
  </ItemGroup>

  <Empty v-else>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <SearchAlert />
      </EmptyMedia>
      <EmptyTitle>Keine Adventures gefunden</EmptyTitle>
      <EmptyDescription>
        Du hast noch keine Adventures angesehen. Sobald du ein Adventure ansiehst, wird es hier in deiner
        Besuchshistorie angezeigt.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
</template>

<script lang="ts" setup>
import { SearchAlert } from 'lucide-vue-next';
import type { EnrichedViewRecord } from '~~/shared/types/AdventureTypes';
import { toPicturePath } from '~~/shared/utils/SharedUtils';

const { data: adventureHistory, pending, error } = await useFetch<EnrichedViewRecord[]>('/api/v1/app/profile/own/adventureHistory');
</script>