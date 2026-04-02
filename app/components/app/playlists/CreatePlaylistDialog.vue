<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <slot></slot>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t('component_playlists_new_playlist_title') }}</DialogTitle>
        <DialogDescription>
          {{ $t('component_playlists_new_playlist_description') }}
        </DialogDescription>
      </DialogHeader>
      <form class="space-y-8" @submit.prevent.stop="onSubmit">
        <FormField v-slot="{ field }" name="name">
          <FormItem>
            <FormLabel>
              {{ $t('component_playlists_new_playlist_form_name') }}
            </FormLabel>
            <FormControl>
              <Input placeholder="Meine Abenteuer-List" v-bind="field" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField v-slot="{ field }" name="description">
          <FormItem>
            <FormLabel>
              {{ $t('component_playlists_new_playlist_form_description') }}
            </FormLabel>
            <FormControl>
              <Textarea placeholder="Eine kurze Beschreibung deiner Adventure-List" v-bind="field" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ field }" name="visibility">
          <FormItem>
            <FormLabel>
              {{ $t('component_playlists_new_playlist_form_visibility') }}
            </FormLabel>
            <FormControl>
              <ToggleGroup
                v-bind="field"
                variant="outline"
                type="single"
                class="w-full"
              >
                <ToggleGroupItem value="private" class="flex-1">
                  <EyeOffIcon />
                  {{ $t('component_playlists_new_playlist_visibility_private') }}
                </ToggleGroupItem>
                <ToggleGroupItem value="public" class="flex-1">
                  <EyeIcon />
                  {{ $t('component_playlists_new_playlist_visibility_public') }}
                </ToggleGroupItem>
                <ToggleGroupItem value="unlisted" class="flex-1">
                  <BookKeyIcon />
                  {{ $t('component_playlists_new_playlist_visibility_unlisted') }}
                </ToggleGroupItem>
              </ToggleGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <Button type="submit" class="ml-auto w-full" :disabled="isLoading">
          <template v-if="isLoading">
            <Spinner />
            {{ $t('component_playlists_new_playlist_creating') }}
          </template>
          <template v-else>
            {{ $t('component_playlists_new_playlist_create') }}
          </template>
        </Button>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { AdventureListCreateSchema } from '#shared/schema/AdventureListSchema';
import { toTypedSchema } from '@vee-validate/zod';
import { BookKeyIcon, EyeIcon, EyeOffIcon } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { toast } from 'vue-sonner';

const { handleSubmit } = useForm({
    validationSchema: toTypedSchema(AdventureListCreateSchema),
});

const isOpen = ref(false);
const isLoading = ref(false);

const onSubmit = handleSubmit(async (values) => {
    if (isLoading.value) return;
    isLoading.value = true;

    try {
        await $fetch('/api/v1/app/playlists/create', {
            method: 'POST',
            body: values,
        });

        await refreshNuxtData('playlists-own');

        toast.success('Adventure-List wurde erstellt!');
        isOpen.value = false;
    } catch (error) {
        toast.error('Fehler beim Erstellen der Adventure-List');
    } finally {
        isLoading.value = false;
    }
});

</script>