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

    const resolve = async () => {
        if (geoState.value.location || geoState.value.pending) return;

        geoState.value.pending = true;
        geoState.value.error = false;

        try {
            // 1. IP → Koordinaten
            const data = await $fetch<GeoIPLocation>('/api/v1/app/geo/myLocation');
            geoState.value.location = data;

            // 2. Koordinaten → GeoEntry (näheste Stadt)
            const entry = await $fetch<GeoEntry>('/api/v1/app/geo/resolveLatLon', {
                query: {
                    lat: data.coordinates[0],
                    lon: data.coordinates[1],
                },
            });
            geoState.value.entry = entry;
        } catch (error) {
            geoState.value.error = true;
            console.warn('[GeoIP] Could not resolve location', error);
        } finally {
            geoState.value.pending = false;
        }
    };

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

        /** Einmalig auflösen (Plugin) */
        resolve,

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