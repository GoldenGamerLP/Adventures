<template>
  <Button
    v-for="(pill, index) in computedEntries"
    :key="index"
    variant="secondary"
    as-child
    class="rounded-full"
  >
    <li>
      <component :is="entries[pill[0]]?.icon" />
      {{ entries[pill[0]]?.label }}: {{ entries[pill[0]]?.format?.(pill[1]) ??
        (Array.isArray(pill[1]) ? pill[1].join(', ') : pill[1]) }}
    </li>
  </Button>
</template>

<script lang="ts" setup>
import { Clock, Mountain, SearchIcon, Settings2 } from 'lucide-vue-next';
const { $t } = useI18n();
const { mask } = useSearchMask();

const refMask = toRef(mask);

const computedEntries = computed(() => {
    return Object.entries(refMask.value).filter(([key, value]) => {
        if (key === 'location') return false; // exclude location from pills
        if (Array.isArray(value)) {
            return value.length > 0; // only include if array has items
        }
        return true;
    });
});


const entries: Entries = {
    query: {
        label: $t('component_search_pills_query') as string,
        icon: SearchIcon,
    },
    duration: {
        label: $t('component_search_pills_duration') as string,
        icon: Clock,
        format: (value: number[]) => `${formatDuration(value[0]!)} - ${formatDuration(value[1]!)}`,
    },
    difficulty: {
        label: $t('component_search_pills_difficulty') as string,
        icon: Mountain,
    },
    sort: {
        label: $t('component_search_pills_sort') as string,
        icon: Settings2,
        format: (value: string) => {
            const map: Record<string, string> = {
                near_me: $t('component_search_pills_sort_near_me') as string,
                recommended: $t('component_search_pills_sort_recommended') as string,
                new: $t('component_search_pills_sort_new') as string,
                popular: $t('component_search_pills_sort_popular') as string,
            };
            return map[value] ?? value;
        },
    },
    tags: {
        label: $t('component_search_pills_tags') as string,
        icon: Settings2,
        format: (value: string[]) => value.join(', '),
    },
    radius: {
        label: $t('component_search_pills_radius') as string,
        icon: Settings2,
        format: (value: number) => $t('component_search_pills_radius_value', { value }) as string,
    },
}

interface Entries {
    [key: string]: {
        label: string;
        icon: any;
        format?: (value: any) => string;
    }
}
</script>