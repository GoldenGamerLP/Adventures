import { findNearestCity } from "~~/server/utils/geo/GeoDB";
import { ResolveLatLongSchema } from "~~/shared/schema/GeoSchema";
import type { FrontEndGeoState } from "~~/shared/types/GeoTypes";

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedQuery(event, ResolveLatLongSchema.safeParseAsync);

    if (error) {
        throw createError({ statusCode: 400, statusMessage: 'Ungültige Parameter' });
    }

    const { latitude, longitude } = data;

    const nearestCity = await findNearestCity(latitude, longitude);

    if (!nearestCity) {
        //Passiert nicht da die GeoDB alle Koordinaten in Deutschland abdeckt, aber sicherheitshalber
        throw createError({ statusCode: 404, statusMessage: 'Keine nahegelegene Stadt gefunden' });
    }

    const frontEndGeoState: FrontEndGeoState = {
        location: {
            latitude,
            longitude,
        },
        city: nearestCity.place || 'Unbekannt',
        state: nearestCity.state || 'Unbekannt',
        country: nearestCity.country_code || 'Unbekannt',
        postalCode: nearestCity.zipcode || 'Unbekannt',
    };

    return frontEndGeoState;
});