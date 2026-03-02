<template>
  <form class="space-y-2" @submit="onSubmit">
    <VeeField v-slot="{ field, errors }" name="biography">
      <Field :data-invalid="!!errors.length">
        <FieldContent>
          <div class="flex items-center justify-between">
            <FieldLabel class="text-sm font-medium">
              Über mich
            </FieldLabel>
            <span class="text-xs text-muted-foreground">{{ (field.value?.length ?? 0) }}/500</span>
          </div>
          <Textarea
            :name="field.name"
            :model-value="field.value"
            placeholder="Erzähle etwas über dich..."
            :maxlength="500"
            class="min-h-24 resize-none"
            @update:model-value="field.onChange"
          />
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
import { UpdateBiographySchema } from '~~/shared/schema/UserProfileSchema';

const props = defineProps<{
    biography?: string;
}>();

const emit = defineEmits<{
    'update:biography': [value: string];
}>();

const isSaving = ref(false);

const { handleSubmit, meta, resetForm } = useForm({
    validationSchema: toTypedSchema(UpdateBiographySchema),
    initialValues: {
        biography: props.biography ?? '',
    },
});

watch(() => props.biography, (v) => {
    resetForm({ values: { biography: v ?? '' } });
});

const onSubmit = handleSubmit(async (values) => {
    isSaving.value = true;
    try {
        const res = await $fetch('/api/v1/app/profile/change/biography', {
            method: 'PATCH',
            body: { biography: values.biography },
        });
        emit('update:biography', res.biography ?? values.biography);
        resetForm({ values: { biography: res.biography ?? values.biography } });
        toast.success('Biografie gespeichert');
    } catch (err) {
        toast.error('Biografie konnte nicht gespeichert werden');
        console.error(err);
    } finally {
        isSaving.value = false;
    }
});
</script>
