<template>
  <Card>
    <CardHeader>
      <CardTitle>Willkommen zurück</CardTitle>
      <CardDescription>Melde dich mit deinem Account an</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" @submit="onSubmit">
        <!-- Captcha by Cloudflare -->
        <FormField v-slot="{ componentField }" name="token">
          <NuxtTurnstile v-model="componentField.modelValue" />
        </FormField>

        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>E-Mail</FormLabel>
            <FormControl>
              <Input type="email" placeholder="deine@email.de" v-bind="componentField" :disabled="isLoading" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>Passwort</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" v-bind="componentField" :disabled="isLoading" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Error Alert -->
        <div v-if="errorMessage"
          class="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start gap-2">
          <AlertCircle class="h-4 w-4 mt-0.5 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <Button type="submit" class="w-full" :disabled="isLoading">
          <Spinner v-if="isLoading" class="mr-2" />
          {{ isLoading ? 'Anmeldung läuft...' : 'Anmelden' }}
        </Button>
      </form>
    </CardContent>
  </Card>
</template>

<script lang="ts" setup>
import { toTypedSchema } from '@vee-validate/zod';
import { AlertCircle } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { LoginSchema } from '~~/shared/schema/AuthenticationSchema';

const isLoading = ref(false);
const errorMessage = ref('');
const injectAuthDrawerOpen = inject<Ref<boolean>>('auth-credentials-drawer-open', ref(false));

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(LoginSchema),
});

const getErrorMessage = (code: string): string => {
  const messages: Record<string, string> = {
    'INVALID_CREDENTIALS': 'E-Mail oder Passwort ist falsch.',
    'VALIDATION_ERROR': 'Bitte überprüfe deine Eingaben.',
    'NETWORK_ERROR': 'Netzwerkfehler. Bitte versuche es erneut.',
  };
  return messages[code] || 'Ein unerwarteter Fehler ist aufgetreten.';
};

const onSubmit = handleSubmit(async (values) => {
  if (isLoading.value) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    await $fetch('/api/v1/auth/actions/login', {
      method: 'POST',
      body: values,
    });

    // Erfolgreiche Anmeldung - reload page um Session zu aktivieren
    await hydrateUser();
    injectAuthDrawerOpen!.value = false;
    await useSafeRedirect();
  } catch (error: any) {
    console.error('Login error:', error);
    const code = error.data?.data?.code || error.statusText || 'UNKNOWN_ERROR';
    errorMessage.value = getErrorMessage(code);
  } finally {
    isLoading.value = false;
  }
});
</script>