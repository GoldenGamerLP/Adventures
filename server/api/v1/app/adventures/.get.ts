import { AdventuresQueryFilterSchema } from '#shared/schema/AdventuresSchema';
import { getAdventuresByFilterAndUser } from '~~/server/utils/adventures/AdventureUtils';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    
    const { data, error } = await getValidatedQuery(event, AdventuresQueryFilterSchema.safeParseAsync);

    if (error) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid query parameters',
            data: error,
        })
    };

    const limit = data.limit;
    const pageParam = data.pageParam;
    const { limit: _limit, pageParam: _pageParam, ...filter } = data;

    return getAdventuresByFilterAndUser(user, filter, limit, pageParam);
});