<template>
  <Card :key="seed._id" class="h-146">
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
        loading="lazy"
      />

      <div class="text-xs text-muted-foreground space-y-1">
        <div>ID: {{ seed._id }}</div>
        <div>
          Source: {{ seed.source.provider }} · {{ seed.source.provider === 'wikipedia' ?
            seed.source.wikipediaPageId : seed.source.userId }}
        </div>
      </div>

      <Dialog>
        <DialogTrigger>Show Seed Meta</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seed Meta</DialogTitle>
            <DialogDescription>
              Details about the seed. (Check openingslots etc. for debugging)
              <pre class="mt-2 p-2 bg-muted rounded text-sm overflow-auto max-h-96">
                {{ seed }}
              </pre>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>


      <div class="grid gap-2">
        <Label :for="`reason-${seed._id}`">Ablehnungsgrund (optional)</Label>
        <Textarea
          :id="`reason-${seed._id}`"
          v-model="seedingReason"
          placeholder="Optionaler Grund bei Decline"
          rows="2"
        />
      </div>

      <div class="flex gap-2 flex-wrap">
        <Button
          :disabled="!props.canReview || isLoading || props.seed.status !== 'pending'"
          @click="reviewSeed(true)"
        >
          Accept
        </Button>
        <Button
          variant="destructive"
          :disabled="!props.canReview || isLoading || props.seed.status !== 'pending'"
          @click="reviewSeed(false)"
        >
          Decline
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script lang="ts" setup>
import { toast } from 'vue-sonner';

const props = defineProps<{
    seed: AdventureSeedData;
    canReview: boolean;
    index: number;
    apiKey: string
}>();

const emits = defineEmits<{
    review: (index: number, id: string, approved: boolean, reason: string | undefined) => void;
}>();

const isLoading = ref(false);
const seedingReason = ref(props.seed.rejectionReason || '');
const user = useUser();


const reviewSeed = async (approved: boolean) => {
    if (!props.canReview || props.seed.status !== 'pending' || isLoading.value) return;

    isLoading.value = true;

    try {
        await $fetch(`/api/v1/seeding/adventures/${props.seed._id}`, {
            method: 'PATCH',
            headers: {
                'x-api-key': props.apiKey,
            },
            body: {
                reviewerId: user.value?._id,
                approved,
                reason: seedingReason.value || undefined,
            },
        });

        toast.success(approved ? 'Adventure akzeptiert.' : 'Adventure abgelehnt.');
        emits('review', props.index, props.seed._id, approved, seedingReason.value || undefined);
    } catch (error) {
        console.error(error);
        toast.error('Review konnte nicht gespeichert werden.');
    } finally {
        isLoading.value = false;
    }
};
</script>