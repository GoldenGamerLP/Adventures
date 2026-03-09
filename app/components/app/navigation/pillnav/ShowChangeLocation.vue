<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="secondary"
        size="sm"
        class="px-2 rounded-full"
        :disabled="pending"
      >
        <MapPin />
        {{ entry?.place || 'Unbekannt' }}
        <span class="sr-only">Aktuelle Standortangabe</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" class="space-y-2">
      <h2 class="font-medium">
        Lokale Adventures
      </h2>
      <p class="text-sm text-muted-foreground">
        {{ entry?.place || 'Unbekannt' }}, {{ entry?.state }}, {{
          entry?.zipcode }}
      </p>
      <div class="w-full aspect-video rounded-lg overflow-hidden my-2" @touchmove.stop @dragstart.stop>
        <LMap
          :zoom="13"
          :center="coordinates!"
          class="w-full h-full"
          :use-global-leaflet="false"
        >
          <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LMarker :lat-lng="coordinates!" />
        </LMap>
      </div>
      <Button
        variant="outline"
        class="w-full mt-4"
        :disabled="isRequesting"
        @click="requestGeolocation"
      >
        <component :is="isRequesting ? Spinner : MapPin" class="size-3" />
        Geräte-Standort verwenden
      </Button>
      <Alert v-if="isError" variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Keine Berechtigung</AlertTitle>
        <AlertDescription class="text-xs">
          Du hast den Zugriff auf deinen Standort verweigert. Bitte erlaube den Zugriff in deinen
          Browser-Einstellungen und versuche es erneut.
        </AlertDescription>
      </Alert>
    </PopoverContent>
  </Popover>
</template>

<script lang="ts" setup>
import { AlertCircleIcon, MapPin } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import Spinner from '~/components/ui/spinner/Spinner.vue';

const { getGeolocation, lookupPermissionState } = useDeviceGeoLocation();
const { entry, pending, coordinates, setCity } = useGeoLocation();

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
  } catch (error) {
    toast.error('Fehler beim Abrufen der Geolocation. Bitte versuche es erneut.');
    console.error('Geolocation-Fehler:', error);
  } finally {
    isRequesting.value = false;
  }
};
</script>