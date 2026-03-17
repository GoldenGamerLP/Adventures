import { resolveGeoIP } from '~~/server/utils/geoip/GeoIpUtils';

export default defineEventHandler(async (event) => {
    const ip = getRequestIP(event, { xForwardedFor: true }) ?? '127.0.0.1';
    
    // Localhost / Dev-Fallback
    if (ip === '127.0.0.1' || ip === '::1') {
        return {
            coordinates: [51.1657, 10.4515] as [number, number], // Deutschland-Mitte
            country: 'DE',
        };
    }

    const geo = await resolveGeoIP(ip);

    if (!geo) {
        throw createError({
            statusCode: 503,
            statusMessage: 'Geo-IP resolution failed',
        });
    }

    return geo;
});