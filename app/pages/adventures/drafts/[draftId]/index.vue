<template>
  <LazyAppDraftsDraftForm v-if="draftData" :draft-data="draftData" :draft-id="draftId" />
  <Empty v-else>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <FileExclamationPointIcon />
      </EmptyMedia>
      <EmptyTitle>Fehler</EmptyTitle>
      <EmptyDescription>
        Der Entwurf konnte nicht geladen werden. Bitte versuche es später erneut oder kontaktiere den Support,
        wenn
        das
        Problem weiterhin besteht.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button as-child>
        <NuxtLink to="/adventures/drafts">
          Zurück zur Übersicht
        </NuxtLink>
      </Button>
    </EmptyContent>
    <Button
      variant="link"
      as-child
      class="text-muted-foreground"
      size="sm"
    >
      <a href="#">
        Support kontaktieren
        <ArrowUpRightIcon />
      </a>
    </Button>
  </Empty>
</template>

<script lang="ts" setup>
import { ArrowUpRightIcon, FileExclamationPointIcon } from 'lucide-vue-next';

const draftId = useRoute().params.draftId as string;

// Fetch draft data
const {
  data: draftData,
  pending,
  error,
  refresh
} = await useFetch<AdventureDraftWithPictures>(`/api/v1/app/adventures/drafts/${draftId}`,
  {
    key: 'adventure-draft-' + draftId,
  }
);


</script>