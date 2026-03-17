import type { GeoIPLocation } from '~~/shared/types/GeoTypes';

export const useGeoLocation = () => {
    const geoState = useState<{
        location: GeoIPLocation | null;
        entry: GeoEntry | null;
        pending: boolean;
        error: boolean;
    }>('geoLocation', () => ref({
        location: null,
        entry: null,
        pending: false,
        error: false,
    }));

    /**
     * Manuell eine andere Stadt setzen (z.B. via SearchCityInput).
     * Überschreibt den GeoEntry und aktualisiert die Koordinaten.
     */
    const setCity = (city: GeoEntry) => {
        geoState.value.entry = city;
        if (city.latitude && city.longitude) {
            geoState.value.location = {
                coordinates: [city.latitude, city.longitude],
                city: city.place,
                country: city.country_code,
            };
        }
    };

    return {
        /** Aufgelöste IP-Location */
        location: computed(() => geoState.value.location),

        /** Koordinaten Shortcut */
        coordinates: computed(() => geoState.value.location?.coordinates ?? null),

        /** Aufgelöstes GeoEntry (näheste Stadt) */
        entry: computed(() => geoState.value.entry),

        /** Lade-Status */
        pending: computed(() => geoState.value.pending),

        /** Fehler-Status */
        error: computed(() => geoState.value.error),

        /** Manuell Stadt ändern */
        setCity,

        /** Zurücksetzen */
        reset: () => {
            geoState.value.location = null;
            geoState.value.entry = null;
            geoState.value.error = false;
        },
    };
};

export const hydrateGeoLocation = async () => {
    const { setCity } = useGeoLocation();

    try {
        // Ip zu Koordinaten
        // Mit requestFetch, damit die Anfrage serverseitig ausgeführt wird und die IP korrekt ermittelt werden kann (nicht clientseitig, wo sie durch CORS-Policies blockiert werden könnte)
        const locationData = await useRequestFetch()('/api/v1/app/geo/myLocation');

        if (!locationData) {
            throw new Error('No location data returned from API');
        }

        // 2. Koordinaten → GeoEntry (näheste Stadt)
        const entryData = await $fetch('/api/v1/app/geo/resolveLatLon', {
            query: {
                lat: locationData.coordinates[0],
                lon: locationData.coordinates[1],
            },
        });

        if (!entryData) {
            throw new Error('No GeoEntry data returned from API');
        }

        setCity({
            ...entryData,
            //Override, da die API nur eine generische "location" zurückgibt, wir aber explizit lat/lon wollen
            latitude: locationData.coordinates[0],
            longitude: locationData.coordinates[1],
        });
    } catch (error) {
        console.warn('[GeoIP] Could not resolve location', error);
    }
};