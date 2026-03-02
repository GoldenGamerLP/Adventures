<template>
  <Button
    variant="destructive"
    size="sm"
    :disabled="isLoading"
    class="cursor-pointer w-full"
    @click="handleLogout"
  >
    <LogOut class="mr-2 h-4 w-4" />
    <span v-if="isLoading">Abmelden...</span>
    <span v-else>Abmelden</span>
  </Button>
</template>

<script lang="ts" setup>
import { LogOut } from 'lucide-vue-next';

const isLoading = ref(false);

const handleLogout = async () => {
    if (isLoading.value) return;

    isLoading.value = true;

    try {
        await $fetch('/api/v1/auth/actions/logout', {
            method: 'GET',
        });

        // Erfolgreiche Abmeldung - reload page um Session zu löschen
    } catch (error) {
        console.error('Logout error:', error);
        // Trotz Fehler versuchen zu reloaden
    } finally {
        navigateTo('/');

        isLoading.value = false;
    }
};
</script>
