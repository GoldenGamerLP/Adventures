<template>
  <div class="mx-auto max-w-2xl flex flex-col h-screen space-y-4 py-2 px-2 sm:px-0" v-if="pending">
    <Skeleton class="h-16 w-full" />
    <div class="grid grid-cols-6 h-72 gap-2">
      <Skeleton class="col-span-4 h-full" />
      <Skeleton class="col-span-2 h-full" />
    </div>
    <Skeleton class="flex-1 w-full" />
  </div>
  <Empty v-else-if="error">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <SearchAlertIcon />
      </EmptyMedia>
      <EmptyTitle>Adventure nicht gefunden</EmptyTitle>
      <EmptyDescription>
        Das Adventure wurde nicht gefunden weil es entweder nicht <span class="text-accent-foreground">exestiert</span>
        oder <span class="text-accent-foreground">Privat</span> ist.
        <div>
          {{ error ?? 'Unerwarteter Fehler' }}
        </div>
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button as-child>
        <NuxtLink>
          Zurück zu den Adventures
        </NuxtLink>
      </Button>
    </EmptyContent>
    <Button variant="link" as-child class="text-muted-foreground" size="sm">
      <a href="#">
        Support Kontaktieren
        <ArrowUpRightIcon />
      </a>
    </Button>
  </Empty>
  <AppAdventuresAdventureView v-else-if="adventure" :adventure="adventure!" />
</template>

<script lang="ts" setup>
import { ArrowUpRightIcon, SearchAlertIcon } from 'lucide-vue-next';

const route = useRoute();
const adventureId = route.params.adventureId as string;

const { data: adventure, error, pending } = await useFetch<AdventureWithMeta>(
  `/api/v1/app/adventures/${adventureId}`,
  {
    method: 'GET',
    query: route.query,
    lazy: true,
  }
);

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | Abenteuer entdecken` : 'Abenteuer entdecken';
  },
  title: () => adventure.value ? adventure.value.title : 'Adventure nicht gefunden',
  meta: [
    {
      name: 'description',
      content: adventure.value ? adventure.value.description : 'Das angeforderte Abenteuer konnte nicht gefunden werden.',
    },
    {
      property: 'og:title',
      content: adventure.value ? adventure.value.title : 'Adventure nicht gefunden',
    },
    {
      property: 'og:description',
      content: adventure.value ? adventure.value.description : 'Das angeforderte Abenteuer konnte nicht gefunden werden.',
    },
    {
      property: 'og:image',
      content: adventure.value && adventure.value.pictureIds.length > 0
        ? toPicturePath(adventure.value.pictureIds[0])
        : undefined,
    },
  ],
})
</script>