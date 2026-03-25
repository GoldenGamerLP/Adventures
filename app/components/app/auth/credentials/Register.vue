<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ $t('auth_register_title') }}</CardTitle>
      <CardDescription>{{ $t('auth_register_description') }}</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" @submit="onSubmit">
        <!-- Captcha by Cloudflare -->
        <NuxtTurnstile v-model="token" />


        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>{{ $t('auth_labels_name') }}</FormLabel>
            <FormControl>
              <Input
                type="text"
                :placeholder="$t('auth_placeholders_name') as string"
                v-bind="componentField"
                :disabled="isLoading"
              />
            </FormControl>
            <FormDescription>{{ $t('auth_validation_name_min') }}</FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>

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
            <FormDescription>{{ $t('auth_validation_password_min') }}</FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="confirmPassword">
          <FormItem>
            <FormLabel>{{ $t('auth_labels_confirm_password') }}</FormLabel>
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

        <!-- Success Alert -->
        <div
          v-if="successMessage"
          class="p-3 text-sm bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg flex items-start gap-2"
        >
          <CheckCircle2 class="h-4 w-4 mt-0.5 shrink-0" />
          <span>{{ successMessage }}</span>
        </div>

        <Button type="submit" class="w-full" :disabled="isLoading">
          <Spinner v-if="isLoading" class="mr-2" />
          {{ isLoading ? $t('auth_submit_register_loading') : $t('auth_submit_register') }}
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

const { $t } = useI18n();

const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const injectAuthDrawerOpen = inject<Ref<boolean>>('auth-credentials-drawer-open', ref(false));
const token = ref('');

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(RegisterSchema),
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
  successMessage.value = '';

  try {
    await $fetch('/api/v1/auth/actions/signup', {
      method: 'POST',
      body: { ...values, token: token.value },
    });

    successMessage.value = $t('auth_register_success') as string;

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