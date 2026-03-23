import { getPlaylistInfo } from "~~/server/utils/playlists/PlaylistUtils";
import { PlaylistInfoQuerySchema } from "~~/shared/schema/PlaylistSchema";

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedQuery(event, PlaylistInfoQuerySchema.safeParseAsync);

    if (error) {
        throw createError({ statusCode: 400, message: "Invalid query parameters", cause: error });
    }

    const { playlistId } = data;
    const user = event.context.user;

    const accessible = hasAccessToPlaylist(playlistId, user?._id);

    if (!accessible) {
        throw createError({ statusCode: 403, message: "You do not have access to this playlist" });
    }

    return getPlaylistInfo(playlistId);
});