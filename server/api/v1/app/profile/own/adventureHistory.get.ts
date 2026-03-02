import { getEnrichedRecentlyViewed } from "~~/server/utils/adventures/ViewsUtils";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    return getEnrichedRecentlyViewed(user._id);
});