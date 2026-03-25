<template>
  <form @submit.prevent>
    <FieldGroup>
      <VeeField v-slot="{ field, errors }" name="biography">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="form-biography">
            {{ t('component_profile_biography_label') }}
          </FieldLabel>
          <Textarea
            id="form-biography"
            :model-value="field.value"
            :aria-invalid="!!errors.length"
            :placeholder="t('component_profile_biography_placeholder')"
            class="min-h-24 resize-none"
            :maxlength="500"
            @update:model-value="field.onChange"
          />
          <div class="flex items-center justify-between">
            <FieldDescription>
              {{ t('component_profile_biography_description') }}
            </FieldDescription>
            <span class="text-xs text-muted-foreground shrink-0 tabular-nums">
              {{ field.value?.length ?? 0 }}/500
            </span>
          </div>
          <FieldError v-if="errors.length" :errors="errors" />
        </Field>
      </VeeField>
    </FieldGroup>
  </form>
</template>

<script lang="ts" setup>
import { toTypedSchema } from '@vee-validate/zod';
import { watchDebounced } from '@vueuse/core';
import { useForm, Field as VeeField } from 'vee-validate';
import { toast } from 'vue-sonner';
import { FieldGroup } from '~/components/ui/field';
import { UpdateBiographySchema } from '~~/shared/schema/UserProfileSchema';

const props = withDefaults(defineProps<{
    initialBiography?: string;
}>(), {
    initialBiography: '',
});

const { t } = useI18n();

const { values, isFieldValid } = useForm({
    validationSchema: toTypedSchema(UpdateBiographySchema),
    initialValues: {
        biography: props.initialBiography,
    },
});

watchDebounced(values, async (newValues) => {
    if (!isFieldValid('biography')) return;

    try {
        await $fetch('/api/v1/app/profile/biography/update', {
            method: 'PATCH',
            body: newValues,
        });
        toast.info(String(t('component_profile_biography_updated')));
    } catch (error) {
        toast.error(String(t('component_profile_biography_update_failed')));
        console.error('Failed to update biography:', error);
    }
}, { debounce: 1500 });
</script>