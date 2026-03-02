import { GeoSearchCitySchema } from '#shared/schema/GeoSchema';
import { searchCityFullText } from '~~/server/utils/geo/GeoDB';

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedQuery(event, GeoSearchCitySchema.safeParseAsync);

    if (error) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid query parameters' });
    }

    return searchCityFullText(data.query, 10);
});