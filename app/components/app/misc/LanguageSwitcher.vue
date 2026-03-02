<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
//Defineprops for v-bind and HTML attributes
const props = defineProps<{
    class?: HTMLAttributes["class"];
    style?: HTMLAttributes["style"];
}>();

const { locale, locales, setLocale } = useI18n();

</script>

<template>
  <Select :model-value="locale">
    <SelectTrigger v-bind="props">
      <SelectValue :placeholder="$t('app_select_language')" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>{{ $t("app_select_language") }}</SelectLabel>
        <SelectSeparator />
        <SelectItem
          v-for="loc in locales"
          :key="loc.code"
          :value="loc.code"
          @select="() => { setLocale(loc.code); }"
        >
          {{ loc.name }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
