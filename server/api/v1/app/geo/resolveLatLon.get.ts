import { findNearestCity } from "~~/server/utils/geo/GeoDB";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";
import { ResolveLatLongSchema } from "~~/shared/schema/GeoSchema";
import type { FrontEndGeoState } from "~~/shared/types/GeoTypes";
import { createKeyedError } from "~~/server/utils/errors/ApiErrorUtils";

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedQuery(event, ResolveLatLongSchema.safeParseAsync);

    if (error) {
        throw createKeyedError(400, APP_ERROR_CODES.INVALID_GEO_QUERY);
    }

    const { latitude, longitude } = data;

    const nearestCity = await findNearestCity(latitude, longitude);

    if (!nearestCity) {
        //Passiert nicht da die GeoDB alle Koordinaten in Deutschland abdeckt, aber sicherheitshalber
        throw createKeyedError(404, APP_ERROR_CODES.GEO_CITY_NOT_FOUND);
    }

    const frontEndGeoState: FrontEndGeoState = {
        location: {
            latitude,
            longitude,
        },
        city: nearestCity.place || 'geo_unknown_city',
        state: nearestCity.state || 'geo_unknown_state',
        country: nearestCity.country_code || 'geo_unknown_country',
        postalCode: nearestCity.zipcode || 'geo_unknown_postal_code',
    };

    return frontEndGeoState;
});