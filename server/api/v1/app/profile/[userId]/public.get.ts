import { getUserProfileByUserId } from "~~/server/utils/profiles/UserProfileUtils";

export default defineEventHandler(async (event) => {
    const userId = getRouterParam(event, 'userId');

    if (!userId) {
        throw createError({ statusCode: 400, statusMessage: 'User-ID fehlt' });
    }

    const response = await getUserProfileByUserId(userId);

    if (!response) {
        throw createError({ statusCode: 404, statusMessage: 'Benutzerprofil nicht gefunden' });
    }

    return response;
});