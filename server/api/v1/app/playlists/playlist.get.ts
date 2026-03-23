import { hasAccessToPlaylist } from "~~/server/utils/playlists/PlaylistUtils";
import { PlaylistGetSchema } from "~~/shared/schema/PlaylistSchema";

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedQuery(event, PlaylistGetSchema.safeParseAsync);

    if (error) {
        throw createError({ statusCode: 400, message: "Invalid query parameters", cause: error });
    }

    const { playlistId, skip, limit } = data;

    const user = event.context.user;

    const accessible = await hasAccessToPlaylist(playlistId, user?._id);

    if (!accessible) {
        throw createError({ statusCode: 403, message: "You do not have access to this playlist" });
    }

    return getPlaylistEntries(playlistId, user?._id, skip, limit);
});