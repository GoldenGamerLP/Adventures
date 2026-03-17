import { GeoIpDbName, open as geoOpen } from 'geolite2-redist';
import maxmind, { type CityResponse, type Reader } from 'maxmind';
import type { ResolvedGeoIP } from '~~/shared/types/GeoTypes';

// Globale Variable, um die Datenbank-Instanz zwischenzuspeichern
let lookupPromise: Promise<Reader<CityResponse>> | null = null;

export const getGeoDb = async () => {
    if (!lookupPromise) {
        // Öffnet die City-Datenbank und gibt den Reader zurück
        lookupPromise = geoOpen(GeoIpDbName.City, (path) => maxmind.open(path));
    }
    return lookupPromise;
};

export const resolveGeoIP = async (ip: string): Promise<ResolvedGeoIP | null> => {
    try {
        const lookup = await getGeoDb();
        const lookupResponse = lookup.get(ip) as CityResponse | null;

        if (!lookupResponse || !lookupResponse.location) {
            return null;
        }

        return lookupResponse.subdivisions.length ? lookupResponse.subdivisions[0].names.en : null
    } catch (error) {
        console.warn('[GeoIP] Resolution failed:', error);
        return null;
    }
};

export const DEFAULT_GEOIP: ResolvedGeoIP = {
    coordinates: [51.1657, 10.4515], // Deutschland-Mitte
    latitude: 51.1657,
    longitude: 10.4515,
    city: 'Germany',
    country: 'Germany',
};

export const resolveGeoIPWithFallback = async (ip: string): Promise<ResolvedGeoIP> => {
    const geo = await resolveGeoIP(ip);
    return geo || DEFAULT_GEOIP;
};

resolveGeoIPWithFallback('87.154.117.35').then((result) => {
    console.log('Resolved GeoIP:', result);
}).catch((error) => {
    console.error('Error resolving GeoIP:', error);
});