import { InvalidateSessionSchema } from "~~/shared/schema/AuthenticationSchema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({
            statusCode: 401,
            message: "app_auth_not_authenticated",
        });
    }

    const { error, data } = await readValidatedBody(event, InvalidateSessionSchema.safeParseAsync);

    if (error) {
        throw createError({
            statusCode: 400,
            message: error.message,
        });
    }


    const { sessionId } = data;

    await invalidateSession(sessionId, user._id);
    setResponseStatus(event, 200, "Session invalidated successfully");
});