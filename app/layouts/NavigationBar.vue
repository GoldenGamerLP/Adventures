<template>
  <div class="relative pb-20 sm:pb-0">
    <slot></slot>
    <nav
      class="fixed bottom-0 max-w-2xl w-full left-1/2 -translate-x-1/2 bg-background/95 border-t backdrop-blur-sm shadow-lg sm:hidden z-50"
      :aria-label="$t('common_nav_main')"
    >
      <ol class="flex justify-around py-2 relative">
        <li v-for="item in navigationItems" :key="item.href" @click.passive="startTracking(item)">
          <NuxtLink
            :to="item.href"
            class="flex flex-col items-center gap-1 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md"
            exact-active-class="!text-foreground font-medium"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.title }}</span>
          </NuxtLink>
        </li>
      </ol>
    </nav>
  </div>
</template>

<script lang="ts" setup>
import { BookCopyIcon, CompassIcon, UserIcon } from 'lucide-vue-next';
import type { Component } from 'vue';

const { $t } = useI18n();

interface NavigationItem {
  title: string;
  icon: Component;
  href: string;
  onDBClick?: () => void;
}

const trackedItems = new Map<string, { item: NavigationItem, firstPressed: Date }>();

const startTracking = (item: NavigationItem) => {
  if (item.onDBClick && !trackedItems.has(item.href)) {
    trackedItems.set(item.href, { item, firstPressed: new Date() });
  }

  if (trackedItems.has(item.href)) {
    const tracked = trackedItems.get(item.href)!;
    const now = new Date();
    const timeDiff = now.getTime() - tracked.firstPressed.getTime();

    if (timeDiff >= 1000) { // 1 Sekunde
      item.onDBClick!();
      trackedItems.delete(item.href);
    }
  }
};

const resetForYou = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });

  refreshNuxtData('adventures-for-you');
}

const navigationItems: NavigationItem[] = [
  { title: $t('common_nav_discover') as string, icon: CompassIcon, href: '/', onDBClick: resetForYou },
  { title: $t('common_nav_drafts') as string, icon: BookCopyIcon, href: '/adventures/drafts' },
  { title: $t('common_nav_profile') as string, icon: UserIcon, href: '/profile' },
];
</script>