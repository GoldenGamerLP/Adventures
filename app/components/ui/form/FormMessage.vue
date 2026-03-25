<script lang="ts" setup>
import { cn } from "@/lib/utils"
import { ErrorMessage } from "vee-validate"
import type { HTMLAttributes } from "vue"
import { toValue } from "vue"
import { useFormField } from "./useFormField"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const { name, formMessageId } = useFormField()
const { $t } = useI18n()

const translateMessage = (message: string) => {
  const translated = $t(message) as string
  return translated === message ? message : translated
}
</script>

<template>
  <ErrorMessage
    v-slot="{ message }"
    :name="toValue(name)"
  >
    <p
      :id="formMessageId"
      data-slot="form-message"
      :class="cn('text-destructive text-sm', props.class)"
    >
      {{ translateMessage(message as string) }}
    </p>
  </ErrorMessage>
</template>
