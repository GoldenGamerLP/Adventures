import { GeoSearchCitySchema } from '#shared/schema/GeoSchema';
import { createKeyedError } from '~~/server/utils/errors/ApiErrorUtils';
import { searchCityFullText } from '~~/server/utils/geo/GeoDB';
import { APP_ERROR_CODES } from '~~/shared/constants/Constants';

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedQuery(event, GeoSearchCitySchema.safeParseAsync);

    if (error) {
        throw createKeyedError(400, APP_ERROR_CODES.INVALID_GEO_QUERY);
    }

    return searchCityFullText(data.query, 10);
});