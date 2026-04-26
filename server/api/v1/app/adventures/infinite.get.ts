import { AdventuresQueryFilterSchema } from '#shared/schema/AdventuresSchema';
import { getAdventuresByFilterAndUser } from '~~/server/utils/adventures/AdventureUtils';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    const { data, error } = await getValidatedQuery(event, AdventuresQueryFilterSchema.safeParseAsync);

    if (error) {
        return {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid query parameters',
                statusCode: 400,
            },
        };
    }

    const limit = data.limit;
    const pageParam = data.pageParam;
    const { limit: _limit, pageParam: _pageParam, ...filter } = data;

    const adventures = await getAdventuresByFilterAndUser(user, filter, limit, pageParam);
    return {
        success: true,
        data: adventures,
    };
});
