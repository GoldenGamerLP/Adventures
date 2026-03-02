import { invalidateAllSessionsForUser } from "~~/server/utils/auth/authUtils";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({
            statusCode: 401,
            message: "app_auth_not_authenticated",
        });
    }

    await invalidateAllSessionsForUser(user._id);
    setResponseStatus(event, 200, "All sessions invalidated successfully");
});