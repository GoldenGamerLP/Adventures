import { DEFAULT_GEOIP } from '~~/shared/constants/Constants';
import type { FrontEndGeoState } from '~~/shared/types/GeoTypes';

export const useGeoLocation = () => {
    const geoState = useState<{
        geolocation: FrontEndGeoState;
        pending: boolean;
        error: boolean;
    }>('geoLocation', () => ref({
        geolocation: DEFAULT_GEOIP,
        pending: false,
        error: false,
    }));

    /**
     * Manuell eine andere Stadt setzen (z.B. via SearchCityInput).
     * Überschreibt den GeoEntry und aktualisiert die Koordinaten.
     */
    const setCity = (city: FrontEndGeoState) => {
        geoState.value.geolocation = city;
    };

    return {
        geolocation: computed(() => geoState.value.geolocation),

        /** Manuell Stadt ändern */
        setCity,

        /** Zurücksetzen */
        reset: () => {
            geoState.value.geolocation = DEFAULT_GEOIP;
        },
    };
};

export const hydrateGeoLocation = async () => {
    const { setCity } = useGeoLocation();

    try {
        // Ip zu Koordinaten
        // Mit requestFetch, damit die Anfrage serverseitig ausgeführt wird und die IP korrekt ermittelt werden kann (nicht clientseitig, wo sie durch CORS-Policies blockiert werden könnte)
        const locationData: FrontEndGeoState = await useRequestFetch()('/api/v1/app/geo/myLocation');

        if (!locationData) {
            throw new Error('No location data returned from API');
        }

        setCity(locationData);
    } catch (error) {
        console.warn('[GeoIP] Could not resolve location', error);
    }
};