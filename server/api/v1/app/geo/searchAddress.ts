import type { GeoLocation, NominatimLocation } from '#shared/types/GeoTypes';

export default defineEventHandler(async (event) => {
    const { address } = getQuery(event);

    if (!address || typeof address !== 'string' || address.length < 3) {
        throw createError({
            statusCode: 400,
            statusMessage: 'INVALID_ADDRESS',
        });
    }

    try {
        const response = await $fetch<NominatimLocation[]>('https://nominatim.openstreetmap.org/search', {
            method: 'GET',
            query: {
                q: address,
                format: 'jsonv2',
                addressdetails: 1,
                limit: 5,
            },
            headers: {
                'Accept-Language': 'de',
                // Nominatim requires a valid User-Agent
                'User-Agent': 'BucketListWebApp/1.0',
            },
        });

        // Map Nominatim response to our internal GeoLocation type
        const locations: GeoLocation[] = response.map((item) => ({
            type: 'Point',
            displayname: item.display_name,
            name: item.name,
            coordinates: [parseFloat(item.lat), parseFloat(item.lon)],
            address: item.address,
        }));

        return locations;
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'FAILED_TO_FETCH_LOCATION_DATA',
        });
    }
});
