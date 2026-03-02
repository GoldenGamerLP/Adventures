export default defineEventHandler(async (event) => {
    const userId = getRouterParam(event, 'userId');

    if (!userId) {
        throw createError({ statusCode: 400, statusMessage: 'User-ID fehlt' });
    }

    return await getUserById(userId);
});