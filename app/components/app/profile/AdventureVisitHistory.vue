<template>
  <ItemGroup v-if="adventureHistory?.length" class="border rounded-lg">
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
          <ItemDescription>{{ adventure.description }}</ItemDescription>
          <div class="space-x-2">
            <Badge variant="outline">
              <ClockPlusIcon />
              <NuxtTime :datetime="adventure.view.firstViewedAt" relative />
            </Badge>
            <Badge variant="outline">
              <HistoryIcon />
              Zuletzt angesehen:
              <NuxtTime :datetime="adventure.view.lastViewedAt" relative />
            </Badge>
          </div>
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
import { ClockPlusIcon, HistoryIcon, SearchAlert } from 'lucide-vue-next';
import type { EnrichedViewRecord } from '~~/shared/types/AdventureTypes';
import { toPicturePath } from '~~/shared/utils/SharedUtils';

const { data: adventureHistory } = await useFetch<EnrichedViewRecord[]>('/api/v1/app/profile/own/adventureHistory');
</script>