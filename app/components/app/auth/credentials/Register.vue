<template>
  <Card>
    <CardHeader>
      <CardTitle>Account erstellen</CardTitle>
      <CardDescription>Registriere dich für ein neues Konto</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" @submit="onSubmit">
        <!-- Captcha by Cloudflare -->
        <FormField v-slot="{ setValue }" name="token">
          <NuxtTurnstile @update:model-value="setValue" />
        </FormField>

        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input type="text" placeholder="Max Mustermann" v-bind="componentField" :disabled="isLoading" />
            </FormControl>
            <FormDescription>Mindestens 4 Zeichen</FormDescription>
            <FormMessage />
          </FormItem>
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
            <FormDescription>Mindestens 8 Zeichen</FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="confirmPassword">
          <FormItem>
            <FormLabel>Passwort bestätigen</FormLabel>
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

        <!-- Success Alert -->
        <div v-if="successMessage"
          class="p-3 text-sm bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg flex items-start gap-2">
          <CheckCircle2 class="h-4 w-4 mt-0.5 shrink-0" />
          <span>{{ successMessage }}</span>
        </div>

        <Button type="submit" class="w-full" :disabled="isLoading">
          <Spinner v-if="isLoading" class="mr-2" />
          {{ isLoading ? 'Registrierung läuft...' : 'Registrieren' }}
        </Button>
      </form>
    </CardContent>
  </Card>
</template>

<script lang="ts" setup>
import { toTypedSchema } from '@vee-validate/zod';
import { AlertCircle, CheckCircle2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { RegisterSchema } from '~~/shared/schema/AuthenticationSchema';

const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const injectAuthDrawerOpen = inject<Ref<boolean>>('auth-credentials-drawer-open', ref(false));

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(RegisterSchema),
});

const getErrorMessage = (code: string): string => {
  const messages: Record<string, string> = {
    'EMAIL_IN_USE': 'Diese E-Mail-Adresse wird bereits verwendet.',
    'PASSWORDS_DO_NOT_MATCH': 'Die Passwörter stimmen nicht überein.',
    'VALIDATION_ERROR': 'Bitte überprüfe deine Eingaben.',
    'USER_CREATE_FAILED': 'Account konnte nicht erstellt werden.',
    'NETWORK_ERROR': 'Netzwerkfehler. Bitte versuche es erneut.',
  };
  return messages[code] || 'Ein unerwarteter Fehler ist aufgetreten.';
};

const onSubmit = handleSubmit(async (values) => {
  if (isLoading.value) return;

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await $fetch('/api/v1/auth/actions/signup', {
      method: 'POST',
      body: values,
    });

    successMessage.value = 'Registrierung erfolgreich! Du wirst weitergeleitet...';

    // Warte kurz und leite dann weiter
    await hydrateUser();
    injectAuthDrawerOpen!.value = false;
    await useSafeRedirect();
  } catch (error: any) {
    console.error('Registration error:', error);
    const code = error.data?.data?.code || error.statusText || 'UNKNOWN_ERROR';
    errorMessage.value = getErrorMessage(code);
  } finally {
    isLoading.value = false;
  }
});
</script>