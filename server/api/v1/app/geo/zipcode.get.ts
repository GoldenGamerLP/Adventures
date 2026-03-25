import { getCityByZipcode } from "~~/server/utils/geo/GeoDB";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";
import { GeoZipcodeSchema } from "~~/shared/schema/GeoSchema";
import { createKeyedError } from "~~/server/utils/errors/ApiErrorUtils";

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedQuery(event, GeoZipcodeSchema.safeParseAsync);

    if (error) {
        throw createKeyedError(400, APP_ERROR_CODES.INVALID_GEO_QUERY);
    }


    const response = await getCityByZipcode(data.zipcode);

    return response ?? null;
});