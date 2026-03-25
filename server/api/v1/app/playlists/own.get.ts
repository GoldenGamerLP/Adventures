import { createKeyedError } from "~~/server/utils/errors/ApiErrorUtils";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createKeyedError(401, APP_ERROR_CODES.UNAUTHORIZED);
    }

    return await getPlaylistByUserId(user._id, "private");
});