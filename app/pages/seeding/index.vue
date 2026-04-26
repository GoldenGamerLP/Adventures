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
                <User />
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

    <div class="grid gap-3">
      <Card v-for="seed in seeds" :key="seed._id">
        <CardHeader class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <CardTitle class="text-lg leading-tight">
              {{ seed.title }}
            </CardTitle>
            <Badge variant="outline">
              {{ seed.status }}
            </Badge>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-3">
            {{ seed.description }}
          </p>
        </CardHeader>
        <CardContent class="space-y-3">
          <img
            v-if="seed.pictureIds?.[0]"
            :src="`/api/v1/app/pictures/${seed.pictureIds[0]}`"
            :alt="seed.title"
            class="w-full h-48 object-cover rounded-md border"
          />

          <div class="text-xs text-muted-foreground space-y-1">
            <div>ID: {{ seed._id }}</div>
            <div>
              Source: {{ seed.source.provider }} · {{ seed.source.provider === 'wikipedia' ?
                seed.source.wikipediaPageId : seed.source.userId }}
            </div>
          </div>

          <div class="grid gap-2">
            <Label :for="`reason-${seed._id}`">Ablehnungsgrund (optional)</Label>
            <Textarea
              :id="`reason-${seed._id}`"
              v-model="reasons[seed._id]"
              placeholder="Optionaler Grund bei Decline"
              rows="2"
            />
          </div>

          <div class="flex gap-2 flex-wrap">
            <Button
              :disabled="!canReview || isSubmittingId === seed._id || seed.status !== 'pending'"
              @click="reviewSeed(seed._id, true)"
            >
              Accept
            </Button>
            <Button
              variant="destructive"
              :disabled="!canReview || isSubmittingId === seed._id || seed.status !== 'pending'"
              @click="reviewSeed(seed._id, false)"
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner';
import type { AdventureSeedData } from '~~/shared/types/SeedingTypes';

type SeedingStatus = 'pending' | 'approved' | 'rejected';

definePageMeta({
    layout: 'navigation-bar',
    middleware: 'auth-requirement',
});

const apiKey = ref('');
const user = useUser();
const statusFilter = ref<SeedingStatus>('pending');
const reasons = ref<Record<string, string>>({});
const isSubmittingId = ref<string | null>(null);

const {
    data: seeds,
    pending: isLoading,
    error: listError,
    refresh,
} = useFetch<AdventureSeedData[]>('/api/v1/seeding/adventures', {
    server: false,
    immediate: false,
    query: computed(() => ({ status: statusFilter.value })),
    headers: computed(() => ({
        'x-api-key': apiKey.value,
    })),
    watch: false,
});

const canReview = computed(() => {
    return apiKey.value.length > 0 && user;
});

const loadByStatus = async (status: SeedingStatus) => {
    statusFilter.value = status;
    await refresh();
};

const loadPending = () => loadByStatus('pending');
const loadApproved = () => loadByStatus('approved');
const loadRejected = () => loadByStatus('rejected');

const reviewSeed = async (adventureId: string, approved: boolean) => {
    if (!canReview.value) {
        toast.error('Bitte API Key und Reviewer ID eintragen.');
        return;
    }

    isSubmittingId.value = adventureId;

    try {
        await $fetch(`/api/v1/seeding/adventures/${adventureId}`, {
            method: 'PATCH',
            headers: {
                'x-api-key': apiKey.value,
            },
            body: {
                reviewerId: user.value?._id,
                approved,
                reason: reasons.value[adventureId] || undefined,
            },
        });

        toast.success(approved ? 'Adventure akzeptiert.' : 'Adventure abgelehnt.');
        await refresh();
    } catch (error) {
        console.error(error);
        toast.error('Review konnte nicht gespeichert werden.');
    } finally {
        isSubmittingId.value = null;
    }
};
</script>
