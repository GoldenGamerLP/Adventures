import { AdventureLikeSchema } from "~~/shared/schema/AdventuresSchema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { data, error } = await getValidatedRouterParams(event, AdventureLikeSchema.safeParseAsync);

    if (error) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid adventure ID' });
    }

    const { adventureId } = data;
    return toggleLike(adventureId, user._id);
});