<template>
  <form class="space-y-2" @submit="onSubmit">
    <VeeField v-slot="{ field, errors }" name="header">
      <Field :data-invalid="!!errors.length">
        <FieldContent>
          <div class="flex items-center justify-between">
            <FieldLabel class="text-sm font-medium">
              Titel
            </FieldLabel>
            <span class="text-xs text-muted-foreground">{{ (field.value?.length ?? 0) }}/60</span>
          </div>
          <div class="flex gap-2">
            <Input
              :name="field.name"
              :model-value="field.value"
              :maxlength="60"
              placeholder="z.B. Outdoor-Enthusiast, Bücherwurm..."
              class="flex-1"
              @update:model-value="field.onChange"
              @keydown.enter.prevent="onSubmit"
            />
            <Button
              type="submit"
              size="icon"
              variant="outline"
              :disabled="!meta.dirty || isSaving"
            >
              <Spinner v-if="isSaving" />
              <Check v-else class="h-4 w-4" />
              <span class="sr-only">Header speichern</span>
            </Button>
          </div>
          <FieldError v-if="errors.length" :errors="errors" />
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
import { UpdateHeaderSchema } from '~~/shared/schema/UserProfileSchema';

const props = defineProps<{
    header?: string;
}>();

const emit = defineEmits<{
    'update:header': [value: string];
}>();

const isSaving = ref(false);

const { handleSubmit, meta, resetForm } = useForm({
    validationSchema: toTypedSchema(UpdateHeaderSchema),
    initialValues: {
        header: props.header ?? '',
    },
});

watch(() => props.header, (v) => {
    resetForm({ values: { header: v ?? '' } });
});

const onSubmit = handleSubmit(async (values) => {
    isSaving.value = true;
    try {
        const res = await $fetch('/api/v1/app/profile/change/header', {
            method: 'PATCH',
            body: { header: values.header },
        });
        emit('update:header', res.header ?? values.header);
        resetForm({ values: { header: res.header ?? values.header } });
        toast.success('Header gespeichert');
    } catch (err) {
        toast.error('Header konnte nicht gespeichert werden');
        console.error(err);
    } finally {
        isSaving.value = false;
    }
});
</script>
