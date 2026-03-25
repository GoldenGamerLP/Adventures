import { getPlaylistInfo } from "~~/server/utils/playlists/PlaylistUtils";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";
import { PlaylistInfoQuerySchema } from "~~/shared/schema/PlaylistSchema";
import { createKeyedError } from "~~/server/utils/errors/ApiErrorUtils";

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedQuery(event, PlaylistInfoQuerySchema.safeParseAsync);

    if (error) {
        throw createKeyedError(400, APP_ERROR_CODES.INVALID_PLAYLIST_QUERY, { cause: error });
    }

    const { playlistId } = data;
    const user = event.context.user;

    const accessible = await hasAccessToPlaylist(playlistId, user?._id);

    if (!accessible) {
        throw createKeyedError(403, APP_ERROR_CODES.PLAYLIST_FORBIDDEN);
    }

    return getPlaylistInfo(playlistId);
});