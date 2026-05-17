<template>
  <div class="max-w-4xl w-full mx-auto p-4 space-y-4">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">
        Seeding Review
      </h1>
      <p class="text-sm text-muted-foreground">
        Lade Seed-Adventures, prüfe sie und entscheide per Accept/Decline.
      </p>
    </header>

    <Card>
      <CardHeader>
        <CardTitle>API Zugriff</CardTitle>
      </CardHeader>
      <CardContent class="grid gap-3">
        <div class="grid gap-2">
          <Label for="api-key">x-api-key</Label>
          <Input
            id="api-key"
            v-model="apiKey"
            type="password"
            placeholder="API Key"
          />
        </div>
        <div class="grid gap-2">
          <Label for="reviewer-id">Reviewer (Sichtbar als)</Label>
          <div class="flex items-center gap-2">
            <Avatar>
              <AvatarImage :src="toPicturePath(user?.profilePictureId)" alt="Reviewer Avatar" />
              <AvatarFallback>
                <UserIcon />
              </AvatarFallback>
            </Avatar>
            {{ user?.name || 'Unbekannter Nutzer' }}
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button :disabled="!apiKey || isLoading" @click="loadPending">
            Pending laden
          </Button>
          <Button variant="outline" :disabled="!apiKey || isLoading" @click="loadApproved">
            Approved
            laden
          </Button>
          <Button variant="outline" :disabled="!apiKey || isLoading" @click="loadRejected">
            Rejected
            laden
          </Button>
        </div>
      </CardContent>
    </Card>

    <Alert v-if="listError" variant="destructive">
      <AlertTitle>Fehler beim Laden</AlertTitle>
      <AlertDescription>{{ listError.message }}</AlertDescription>
    </Alert>

    <div class="text-sm text-muted-foreground">
      {{ seeds?.length || 0 }} Einträge · Filter: {{ statusFilter }}
    </div>

    <div ref="listElement" class="mt-3">
      <div
        class="relative w-full"
        :style="{
          height: `${totalSize}px`,
        }"
      >
        <div
          v-for="virtualRow in virtualRows"
          :key="virtualRow.key + ''"
          ref="virtualItemEls"
          :data-index="virtualRow.index"
          class="mb-4"
          :style="{
            transform: `translateY(${virtualRow.start}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
          }"
        >
          <div>
            <AppSeedingAventureEntry
              :seed="seeds[virtualRow.index]!"
              :can-review="canReview"
              :index="virtualRow.index"
              :api-key="apiKey"
              @review="removeSeedFromSeeds"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWindowVirtualizer } from '@tanstack/vue-virtual';
import { UserIcon } from 'lucide-vue-next';
import type { AdventureSeedData } from '~~/shared/types/SeedingTypes';

type SeedingStatus = 'pending' | 'approved' | 'rejected';

definePageMeta({
  layout: 'navigation-bar',
  middleware: 'auth-requirement',
});

const apiKey = ref('');
const user = useUser();
const statusFilter = ref<SeedingStatus>('pending');
const virtualItemEls = ref<HTMLElement[]>([]);

const {
  data: seeds,
  pending: isLoading,
  error: listError,
  refresh,
} = useFetch<AdventureSeedData[]>('/api/v1/seeding/adventures', {
  server: false,
  immediate: false,
  query: computed(() => ({ status: statusFilter.value, limit: 1000 })),
  headers: computed(() => ({
    'x-api-key': apiKey.value,
  })),
  watch: false,
});

const rowVirtualizerOptions = computed(() => ({
  count: seeds.value?.length || 0,
  estimateSize: () => 584,
  overscan: 3,
}));

const rowVirtualizer = useWindowVirtualizer(rowVirtualizerOptions);
const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

const canReview = computed(() => {
  return apiKey.value.length > 0 && user;
});

const loadByStatus = async (status: SeedingStatus) => {
  statusFilter.value = status;
  await refresh();
  measureVirtualItems();
};

const loadPending = () => loadByStatus('pending');
const loadApproved = () => loadByStatus('approved');
const loadRejected = () => loadByStatus('rejected');


const removeSeedFromSeeds = (index: number) => {
  seeds.value = seeds.value?.filter((_, i) => i !== index) || [];
};

const measureVirtualItems = () => {
  rowVirtualizer.value.measure();
  virtualItemEls.value.forEach((el) => {
    rowVirtualizer.value.measureElement(el);
  });
};
</script>
