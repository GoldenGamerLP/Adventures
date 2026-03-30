import { createKeyedError } from "~~/server/utils/errors/ApiErrorUtils";
import { hasAccessToPlaylist } from "~~/server/utils/playlists/PlaylistUtils";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";
import { PlaylistGetSchema } from "~~/shared/schema/PlaylistSchema";

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedRouterParams(event, PlaylistGetSchema.safeParseAsync);

    if (error) {
        throw createKeyedError(400, APP_ERROR_CODES.INVALID_PLAYLIST_QUERY, { cause: error });
    }

    const { playlistId, skip, limit } = data;

    const user = event.context.user;

    const accessible = await hasAccessToPlaylist(playlistId, user?._id);

    if (!accessible) {
        throw createKeyedError(403, APP_ERROR_CODES.PLAYLIST_FORBIDDEN);
    }

    return getPlaylistEntries(playlistId, user?._id, skip, limit);
});