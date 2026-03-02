<template>
  <form class="space-y-2" @submit="onSubmit">
    <VeeField v-slot="{ field, errors }" name="tags">
      <Field :data-invalid="!!errors.length">
        <FieldContent>
          <div class="flex items-center justify-between">
            <FieldLabel class="text-sm font-medium">
              Interessen & Tags
            </FieldLabel>
            <span class="text-xs text-muted-foreground">{{ (field.value?.length ?? 0) }}/15</span>
          </div>
          <TagsInput
            :model-value="field.value ?? []"
            class="w-full"
            :max="15"
            @update:model-value="field.onChange"
          >
            <TagsInputItem v-for="tag in (field.value ?? [])" :key="tag" :value="tag">
              <TagsInputItemText />
              <TagsInputItemDelete />
            </TagsInputItem>
            <TagsInputInput
              placeholder="Tag hinzufügen..."
              :maxlength="30"
              @keydown.enter.prevent
            />
          </TagsInput>
          <div class="flex items-center justify-between">
            <FieldError v-if="errors.length" :errors="errors" />
            <span v-else></span>
            <Button type="submit" size="sm" :disabled="!meta.dirty || isSaving">
              <Spinner v-if="isSaving" />
              <Check v-else class="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </div>
        </FieldContent>
      </Field>
    </VeeField>
  </form>
</template>

<script lang="ts" setup>
import { Field as VeeField, useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { Check } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { UpdateTagsSchema } from '~~/shared/schema/UserProfileSchema';

const props = defineProps<{
    tags?: string[];
}>();

const emit = defineEmits<{
    'update:tags': [value: string[]];
}>();

const isSaving = ref(false);

const { handleSubmit, meta, resetForm } = useForm({
    validationSchema: toTypedSchema(UpdateTagsSchema),
    initialValues: {
        tags: [...(props.tags ?? [])],
    },
});

watch(() => props.tags, (v) => {
    resetForm({ values: { tags: [...(v ?? [])] } });
}, { deep: true });

const onSubmit = handleSubmit(async (values) => {
    isSaving.value = true;
    try {
        const res = await $fetch('/api/v1/app/profile/change/tags', {
            method: 'PATCH',
            body: { tags: values.tags },
        });
        const saved = res.tags ?? values.tags;
        emit('update:tags', saved);
        resetForm({ values: { tags: [...saved] } });
        toast.success('Tags gespeichert');
    } catch (err) {
        toast.error('Tags konnten nicht gespeichert werden');
        console.error(err);
    } finally {
        isSaving.value = false;
    }
});
</script>
