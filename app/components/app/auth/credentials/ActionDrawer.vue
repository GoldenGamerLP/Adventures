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
        <span class="sr-only">{{ $t('auth_drawer_sr_trigger') }}</span>
      </Button>
    </DrawerTrigger>
    <DrawerContent class="max-w-2xl mx-auto w-full">
      <DrawerHeader>
        <DrawerTitle>{{ $t('auth_drawer_title') }}</DrawerTitle>
        <DrawerDescription>
          {{ $t('auth_drawer_description') }}
        </DrawerDescription>
      </DrawerHeader>
      <div class="px-4 py-6 overflow-auto mb-4">
        <Tabs default-value="login" class="w-full">
          <TabsList class="w-full">
            <TabsTrigger value="login">
              {{ $t('common_actions_login') }}
            </TabsTrigger>
            <TabsTrigger value="register">
              {{ $t('common_actions_register') }}
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

const { $t } = useI18n();

const user = useUser();
const isOpen = ref(false);
provide('auth-credentials-drawer-open', isOpen);


// Preload the login and register components for faster access
preloadRouteComponents('/profile');
preloadRouteComponents('/adventures/drafts');
</script>