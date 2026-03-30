import { createKeyedError } from "~~/server/utils/errors/ApiErrorUtils";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";
import { GetPlaylistsByAdventureQuerySchema } from "~~/shared/schema/PlaylistSchema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createKeyedError(401, APP_ERROR_CODES.UNAUTHORIZED);
    }

    const { data, error } = await getValidatedQuery(event, GetPlaylistsByAdventureQuerySchema.safeParseAsync);

    if (error) {
        throw createKeyedError(400, APP_ERROR_CODES.INVALID_REQUEST_PARAMS);
    }

    return await getPlaylistByUserId(user._id, data);
});