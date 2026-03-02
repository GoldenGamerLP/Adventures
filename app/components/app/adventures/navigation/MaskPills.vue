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
      {{ entries[pill[0]]?.label }}: {{ entries[pill[0]]?.format ? entries[pill[0]]?.format(pill[1]) :
        (Array.isArray(pill[1]) ? pill[1].join(', ') : pill[1]) }}
    </li>
  </Button>
</template>

<script lang="ts" setup>
import { Clock, Mountain, SearchIcon, Settings2 } from 'lucide-vue-next';
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
        label: 'Suchbegriff',
        icon: SearchIcon,
    },
    duration: {
        label: 'Dauer',
        icon: Clock,
        format: (value: number[]) => `${formatDuration(value[0]!)} - ${formatDuration(value[1]!)}`,
    },
    difficulty: {
        label: 'Schwierigkeit',
        icon: Mountain,
    },
    sort: {
        label: 'Sortierung',
        icon: Settings2,
    },
    tags: {
        label: 'Tags',
        icon: Settings2,
        format: (value: string[]) => value.join(', '),
    },
    radius: {
        label: 'Radius',
        icon: Settings2,
        format: (value: number) => `${value} km`,
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