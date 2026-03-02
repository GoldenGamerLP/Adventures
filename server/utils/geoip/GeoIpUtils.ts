import { createHash } from 'crypto';
import type { ResolvedGeoIP } from '~~/shared/types/GeoTypes';
import database from '../database/DBUtils';

const geoIPCache = database.collection<ResolvedGeoIP>('geo_ip_cache');

const GEOIP_TTL_DAYS = 7;

export const ensureGeoIPIndexes = async (): Promise<void> => {
    // TTL-Index: automatisch nach 7 Tagen löschen
    await geoIPCache.createIndex(
        { resolvedAt: 1 },
        { expireAfterSeconds: GEOIP_TTL_DAYS * 24 * 60 * 60 }
    );
    await geoIPCache.createIndex({ ip: 1 }, { unique: true });

    console.log('[GeoIP] Indexes created');
};

/**
 * Hasht die IP für Privacy — wir speichern nie Klartext-IPs
 */
const hashIP = (ip: string): string => {
    return createHash('sha256').update(ip).digest('hex');
};

/**
 * Löst eine IP zu Koordinaten auf — mit Cache
 */
export const resolveGeoIP = async (ip: string): Promise<ResolvedGeoIP | null> => {
    const hashedIP = hashIP(ip);

    // 1. Cache prüfen
    const cached = await geoIPCache.findOne({ ip: hashedIP });
    if (cached) return cached;

    // 2. ipinfo.io anfragen
    try {
        const response = await $fetch<{
            ip: string;
            city: string;
            region: string;
            country: string;
            loc: string; // "lat,lng"
        }>(`https://ipinfo.io/${ip}/lite`, {
            headers: {
                Authorization: `Bearer ${process.env.IPINFO_TOKEN}`,
            },
            timeout: 3000,
        });

        if (!response.loc) return null;

        const [lat, lng] = response.loc.split(',').map(Number);
        if (!lat || !lng) return null;

        const entry: ResolvedGeoIP = {
            ip: hashedIP,
            coordinates: [lat, lng],
            city: response.city,
            region: response.region,
            country: response.country,
            resolvedAt: new Date().toISOString(),
        };

        // 3. Cache speichern (upsert falls Race Condition)
        await geoIPCache.updateOne(
            { ip: hashedIP },
            { $set: entry },
            { upsert: true }
        );

        return entry;
    } catch (error) {
        console.warn('[GeoIP] Resolution failed:', error);
        return null;
    }
};