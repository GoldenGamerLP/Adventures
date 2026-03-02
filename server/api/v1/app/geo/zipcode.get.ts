import { getCityByZipcode } from "~~/server/utils/geo/GeoDB";
import { GeoZipcodeSchema } from "~~/shared/schema/GeoSchema";

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedQuery(event, GeoZipcodeSchema.safeParseAsync);

    if (error) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid query parameters' });
    }


    const response = await getCityByZipcode(data.zipcode);

    return response ?? null;
});