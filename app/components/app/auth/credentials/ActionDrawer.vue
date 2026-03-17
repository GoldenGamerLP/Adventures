<template>
  <Drawer v-model:open="isOpen">
    <DrawerTrigger as-child>
      <Button variant="ghost" size="icon">
        <Avatar v-if="user">
          <AvatarFallback>
            {{ user.name[0]?.toUpperCase() }}{{ user.name[1]?.toLowerCase() }}
          </AvatarFallback>
        </Avatar>
        <template v-else>
          <User2Icon />
        </template>
        <span class="sr-only">Anmelden / Registrieren</span>
      </Button>
    </DrawerTrigger>
    <DrawerContent class="max-w-2xl mx-auto w-full">
      <DrawerHeader>
        <DrawerTitle>Willkommen bei Adventures</DrawerTitle>
        <DrawerDescription>
          Melde dich an oder erstelle ein neues Konto, um alle Funktionen zu nutzen.
        </DrawerDescription>
      </DrawerHeader>
      <div class="px-4 py-6 overflow-auto mb-4">
        <Tabs default-value="login" class="w-full">
          <TabsList class="w-full">
            <TabsTrigger value="login">
              Anmelden
            </TabsTrigger>
            <TabsTrigger value="register">
              Registrieren
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login" class="mt-4">
            <LazyAppAuthCredentialsLogin />
          </TabsContent>
          <TabsContent value="register" class="mt-4">
            <LazyAppAuthCredentialsRegister />
          </TabsContent>
        </Tabs>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<script lang="ts" setup>
import { User2Icon } from 'lucide-vue-next';

const user = useUser();
const isOpen = ref(false);
provide('auth-credentials-drawer-open', isOpen);

</script>