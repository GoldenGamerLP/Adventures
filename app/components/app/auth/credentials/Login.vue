<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ $t('auth_login_title') }}</CardTitle>
      <CardDescription>{{ $t('auth_login_description') }}</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" @submit="onSubmit">
        <!-- Captcha by Cloudflare -->
        <NuxtTurnstile v-model="token" />

        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>{{ $t('auth_labels_email') }}</FormLabel>
            <FormControl>
              <Input
                type="email"
                :placeholder="$t('auth_placeholders_email') as string"
                v-bind="componentField"
                :disabled="isLoading"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>{{ $t('auth_labels_password') }}</FormLabel>
            <FormControl>
              <Input
                type="password"
                :placeholder="$t('auth_placeholders_password') as string"
                v-bind="componentField"
                :disabled="isLoading"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start gap-2"
        >
          <AlertCircle class="h-4 w-4 mt-0.5 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <Button type="submit" class="w-full" :disabled="isLoading">
          <Spinner v-if="isLoading" class="mr-2" />
          {{ isLoading ? $t('auth_submit_login_loading') : $t('auth_submit_login') }}
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

const { $t } = useI18n();

const isLoading = ref(false);
const errorMessage = ref('');
const injectAuthDrawerOpen = inject<Ref<boolean>>('auth-credentials-drawer-open', ref(false));
const token = ref('');

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(LoginSchema),
});

const getErrorMessage = (code: string): string => {
  const translated = $t(`error_${code}`) as string;
  if (translated === `error_${code}`) {
    return $t('common_unknown_error') as string;
  }

  return translated;
};

const onSubmit = handleSubmit(async (values) => {
  if (isLoading.value) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    await $fetch('/api/v1/auth/actions/login', {
      method: 'POST',
      body: { ...values, token: token.value },
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