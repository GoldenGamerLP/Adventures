import { resolveGeoIPWithFallback } from '~~/server/utils/geoip/GeoIpUtils';
import { DEFAULT_GEOIP } from '~~/shared/constants/Constants';

export default defineEventHandler(async (event) => {
    const ip = getRequestIP(event, { xForwardedFor: true }) ?? '127.0.0.1';

    // Localhost / Dev-Fallback
    if (ip === '127.0.0.1' || ip === '::1') {
        return DEFAULT_GEOIP;
    }

    const geo = await resolveGeoIPWithFallback(ip);

    return geo;
});