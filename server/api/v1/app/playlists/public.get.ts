import { PublicPlaylistsQuerySchema } from "#shared/schema/PlaylistSchema";
import { createKeyedError } from "~~/server/utils/errors/ApiErrorUtils";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedQuery(event, PublicPlaylistsQuerySchema.safeParseAsync);

    if (error) {
        throw createKeyedError(400, APP_ERROR_CODES.INVALID_PLAYLIST_QUERY, { cause: error });
    }

    const { userId } = data;

    return await getPlaylistByUserId(userId, "public");
});