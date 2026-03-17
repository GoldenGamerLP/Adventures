import { GeoIpDbName, open as geoOpen } from 'geolite2-redist';
import maxmind, { type CityResponse } from 'maxmind';

// Globale Variable, um die Datenbank-Instanz zwischenzuspeichern
let lookupPromise: Promise<any> | null = null;

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

        // Prüfen, ob wir überhaupt ein valides Ergebnis UND Koordinaten haben
        if (!lookupResponse || !lookupResponse.location || !lookupResponse.location.longitude || !lookupResponse.location.latitude) {
            return null;
        }

        return {
            coordinates: [
                lookupResponse.location.latitude,
                lookupResponse.location.longitude,
            ],
            city: lookupResponse.city?.names?.de || lookupResponse.city?.names?.en,
            region: lookupResponse.subdivisions?.[0]?.names?.en,
            country: lookupResponse.country?.names?.de || lookupResponse.country?.names?.en || 'Unknown',
            resolvedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.warn('[GeoIP] Resolution failed:', error);
        return null;
    }
};