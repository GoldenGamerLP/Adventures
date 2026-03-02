<template>
  <div class="border rounded-lg border-border flex flex-col overflow-hidden">
    <!-- Image Skeleton -->
    <div class="relative w-full h-48 bg-muted animate-pulse rounded-t-lg"></div>

    <!-- Tags Skeleton -->
    <div class="flex gap-2 mt-1.5 ml-1.5 overflow-x-auto">
      <div class="h-5 w-16 bg-muted animate-pulse rounded-full"></div>
      <div class="h-5 w-20 bg-muted animate-pulse rounded-full"></div>
      <div class="h-5 w-14 bg-muted animate-pulse rounded-full"></div>
    </div>

    <!-- Content Skeleton -->
    <div class="flex items-center justify-between">
      <div class="px-4 py-2 flex flex-col gap-2 flex-1">
        <!-- Title -->
        <div class="h-6 bg-muted animate-pulse rounded w-2/3"></div>
        <!-- Description -->
        <div class="h-4 bg-muted animate-pulse rounded w-full"></div>
        <div class="h-4 bg-muted animate-pulse rounded w-4/5"></div>
      </div>
      <div class="p-4 pt-0">
        <div class="h-10 w-10 bg-muted animate-pulse rounded"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// Skeleton component for loading state
</script>
