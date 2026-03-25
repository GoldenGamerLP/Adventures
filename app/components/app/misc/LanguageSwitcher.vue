<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
//Defineprops for v-bind and HTML attributes
const props = defineProps<{
  class?: HTMLAttributes["class"];
  style?: HTMLAttributes["style"];
}>();

const { $t, $getLocales, $switchLocale, getLocale } = useI18n()

</script>

<template>
  <Select :model-value="getLocale()">
    <SelectTrigger v-bind="props">
      <SelectValue :placeholder="$t('app_select_language') as string" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>{{ $t("app_select_language") }}</SelectLabel>
        <SelectSeparator />
        <SelectItem
          v-for="loc in $getLocales()"
          :key="loc.code"
          :value="loc.code"
          @select="() => { $switchLocale(loc.code); }"
        >
          {{ loc.name }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
