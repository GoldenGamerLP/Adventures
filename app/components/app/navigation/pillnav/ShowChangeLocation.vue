<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="secondary" size="sm" class="px-2 rounded-full">
        <MapPin />
        {{ geolocation.city }}
        <span class="sr-only">{{ $t('component_location_current_sr') }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" class="space-y-2 w-sm">
      <div>
        <h2 class="font-medium text-xl">
          {{ $t('component_location_title') }}
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ geolocation.city }}, {{ geolocation.state }}
        </p>
      </div>
      <div class="w-full aspect-video rounded-lg overflow-hidden my-2" @touchmove.stop @dragstart.stop>
        <LMap
          :zoom="13"
          :center="[geolocation.location.latitude, geolocation.location.longitude]"
          class="w-full h-full"
          :use-global-leaflet="false"
        >
          <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LMarker :lat-lng="[geolocation.location.latitude, geolocation.location.longitude]" />
        </LMap>
      </div>
      <Button
        variant="outline"
        class="w-full"
        :disabled="isRequesting"
        @click="requestGeolocation"
      >
        <component :is="isRequesting ? Spinner : MapPin" class="size-3" />
        {{ $t('component_location_use_device') }}
      </Button>
      <Alert>
        <LightbulbIcon />
        <AlertTitle>{{ $t('component_location_ip_title') }}</AlertTitle>
        <AlertDescription class="text-xs">
          {{ $t('component_location_ip_description') }}
        </AlertDescription>
      </Alert>
      <Alert v-if="isError" variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>{{ $t('component_location_permission_title') }}</AlertTitle>
        <AlertDescription class="text-xs">
          {{ $t('component_location_permission_description') }}
        </AlertDescription>
      </Alert>
    </PopoverContent>
  </Popover>
</template>

<script lang="ts" setup>
import { AlertCircleIcon, LightbulbIcon, MapPin } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import Spinner from '~/components/ui/spinner/Spinner.vue';
import { FETCH_KEY_FOR_YOU_PAGE } from '~~/shared/constants/Constants';

const { $t } = useI18n();

const { getGeolocation, lookupPermissionState } = useDeviceGeoLocation();
const { geolocation, setCity } = useGeoLocation();

const isRequesting = ref(false);
const isError = ref(false);

const requestGeolocation = async () => {
  if (isRequesting.value) return;
  isRequesting.value = true;

  try {
    const permissionState = await lookupPermissionState();
    if (permissionState.state === 'denied') {
      isError.value = true;
      return;
    }

    const position = await getGeolocation();

    const response = await $fetch('/api/v1/app/geo/resolveLatLon', {
      query: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    });
    setCity(response);

    await refreshNuxtData(FETCH_KEY_FOR_YOU_PAGE);
  } catch (error) {
    toast.error($t('component_location_request_error') as string);
    console.error('Geolocation-Fehler:', error);
  } finally {
    isRequesting.value = false;
  }
};
</script>