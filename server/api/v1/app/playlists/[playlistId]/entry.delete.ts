import { removeAdventureFromPlaylist } from "~~/server/utils/playlists/PlaylistUtils";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";
import { PlaylistIdParamSchema, RemoveAdventureFromListSchema } from "~~/shared/schema/AdventureListSchema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createKeyedError(403, APP_ERROR_CODES.UNAUTHORIZED, { message: "Unauthorized" });
    }


    const { data: playlistIdData, error: playlistIdError } = await getValidatedRouterParams(event, PlaylistIdParamSchema.safeParseAsync);

    if (playlistIdError) {
        throw createKeyedError(400, APP_ERROR_CODES.PLAYLIST_FORBIDDEN, { message: "Invalid playlist ID" });
    }

    const { playlistId } = playlistIdData;

    const hasAccess = await hasAccessToPlaylist(playlistId, user._id);

    if (!hasAccess) {
        throw createKeyedError(403, APP_ERROR_CODES.PLAYLIST_FORBIDDEN, { message: "You do not have access to this playlist" });
    }

    const { data: entryData, error: entryError } = await readValidatedBody(event, RemoveAdventureFromListSchema.safeParseAsync);

    if (entryError) {
        throw createKeyedError(400, APP_ERROR_CODES.PLAYLIST_FORBIDDEN, { message: "Invalid entry data" });
    }

    await removeAdventureFromPlaylist(playlistId, entryData.adventureEntryId);


    setResponseStatus(event, 204, "Adventure removed from playlist");
});