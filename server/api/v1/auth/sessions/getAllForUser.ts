import { getSessionsByUserId } from "~~/server/utils/auth/authUtils";
import type { Session } from "~~/shared/types/AuthenticationTypes";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const userId = user._id as string;

    const userSessions = await getSessionsByUserId(userId);

    return userSessions ?? [] as Session[];
});