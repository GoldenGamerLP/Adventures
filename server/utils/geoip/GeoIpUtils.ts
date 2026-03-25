import { GeoIpDbName, open as geoOpen } from 'geolite2-redist';
import maxmind, { type CityResponse, type Reader } from 'maxmind';
import { DEFAULT_GEOIP } from '~~/shared/constants/Constants';
import type { FrontEndGeoState } from '~~/shared/types/GeoTypes';

// Globale Variable, um die Datenbank-Instanz zwischenzuspeichern
let lookupPromise: Promise<Reader<CityResponse>> | null = null;

export const getGeoDb = async () => {
    if (!lookupPromise) {
        // Öffnet die City-Datenbank und gibt den Reader zurück
        lookupPromise = geoOpen(GeoIpDbName.City, (path) => maxmind.open(path));
    }
    return lookupPromise;
};

export const resolveGeoIP = async (ip: string): Promise<FrontEndGeoState | null> => {
    try {
        const lookup = await getGeoDb();
        const lookupResponse = lookup.get(ip) as CityResponse | null;

        if (!lookupResponse || !lookupResponse.location) {
            return null;
        }

        const state = lookupResponse.subdivisions?.[0]?.names?.en || 'geo_unknown_state';
        const city = lookupResponse.city?.names?.en || 'geo_unknown_city';
        const country = lookupResponse.country?.names?.en || 'geo_unknown_country';
        const postalCode = lookupResponse.postal?.code || 'geo_unknown_postal_code';

        return {
            location: {
                latitude: lookupResponse.location.latitude,
                longitude: lookupResponse.location.longitude
            },
            city,
            state,
            country,
            postalCode
        };

    } catch (error) {
        console.warn('[GeoIP] Resolution failed:', error);
        return null;
    }
};

export const resolveGeoIPWithFallback = async (ip: string): Promise<FrontEndGeoState> => {
    const geo = await resolveGeoIP(ip);
    return geo || DEFAULT_GEOIP;
};