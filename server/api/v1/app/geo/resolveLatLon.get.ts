import { findNearestCity } from "~~/server/utils/geo/GeoDB";
import { resolveLatLongSchema } from "~~/shared/schema/GeoSchema";

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedQuery(event, resolveLatLongSchema.safeParseAsync);

    if (error) {
        throw createError({ statusCode: 400, statusMessage: 'Ungültige Parameter' });
    }

    const { lat, lon } = data;

    return await findNearestCity(lat, lon);
});