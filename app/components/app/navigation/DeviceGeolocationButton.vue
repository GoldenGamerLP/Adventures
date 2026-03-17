<template>
  <div>
    <Button variant="outline" class="px-2 rounded-full" :disabled="isRequesting" @click="requestGeolocation">
      <component :is="isRequesting ? Spinner : MapPin" class="size-3" />
      Standort verwenden
    </Button>
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Keine Berechtigung</AlertTitle>
      <AlertDescription>
        Du hast den Zugriff auf deinen Standort verweigert. Bitte erlaube den Zugriff in deinen
        Browser-Einstellungen und versuche es erneut.
      </AlertDescription>
    </Alert>
  </div>
</template>

<script lang="ts" setup>
import { AlertCircleIcon, MapPin } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import Spinner from '~/components/ui/spinner/Spinner.vue';

const isRequesting = ref(false);
const { getGeolocation, lookupPermissionState } = useDeviceGeoLocation();
const { setCity } = useGeoLocation();


const requestGeolocation = async () => {
  if (isRequesting.value) return;
  isRequesting.value = true;

  try {
    const permissionState = await lookupPermissionState();
    if (permissionState.state === 'denied') {
      toast.error('Der Zugriff auf deine Geolocation wurde verweigert. Bitte erlaube den Zugriff in deinen Browser-Einstellungen und versuche es erneut.');
      return;
    }

    const position = await getGeolocation();

    const entry = await $fetch<GeoEntry>('/api/v1/app/geo/resolveLatLon', {
      query: {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      },
    });

    setCity(entry);
    toast.success(`Standort erfolgreich auf ${entry.place}, ${entry.state} gesetzt!`);
  } catch (error) {
    toast.error('Fehler beim Abrufen der Geolocation. Bitte versuche es erneut.');
    console.error('Geolocation-Fehler:', error);
  } finally {
    isRequesting.value = false;
  }
};
</script>