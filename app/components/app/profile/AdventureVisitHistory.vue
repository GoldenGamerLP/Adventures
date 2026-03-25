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
              {{ $t('component_visit_history_first_viewed', { date: td(adventure.view.firstViewedAt, { dateStyle: 'medium', timeStyle: 'short' }) }) }}
            </Badge>
            <Badge variant="outline">
              <HistoryIcon />
              {{ $t('component_visit_history_last_viewed', { date: td(adventure.view.lastViewedAt, { dateStyle: 'medium', timeStyle: 'short' }) }) }}
            </Badge>
          </div>
        </ItemContent>
        <ItemActions>
          <NuxtLink :to="{ name: 'adventures-adventureId', params: { 'adventureId': adventure._id } }">
            <Button variant="outline" size="sm">
              {{ $t('common_view') }}
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
      <EmptyTitle>{{ $t('component_visit_history_empty_title') }}</EmptyTitle>
      <EmptyDescription>
        {{ $t('component_visit_history_empty_description') }}
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
</template>

<script lang="ts" setup>
import { ClockPlusIcon, HistoryIcon, SearchAlert } from 'lucide-vue-next';
import type { EnrichedViewRecord } from '~~/shared/types/AdventureTypes';
import { toPicturePath } from '~~/shared/utils/SharedUtils';

const { $t, td } = useI18n();

const { data: adventureHistory } = await useFetch<EnrichedViewRecord[]>('/api/v1/app/profile/own/adventureHistory');
</script>