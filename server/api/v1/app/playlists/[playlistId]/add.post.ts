import { addAdventureToPlaylist } from "~~/server/utils/playlists/PlaylistUtils";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";
import { AddToPlaylistBodySchema, AddToPlaylistQuerySchema } from "~~/shared/schema/PlaylistSchema";

export default defineEventHandler(async (event) => {
    const { data: routerData, error: routerError } = await getValidatedRouterParams(event, AddToPlaylistQuerySchema.safeParseAsync);

    if (routerError) {
        throw createKeyedError(400, APP_ERROR_CODES.INVALID_REQUEST_PARAMS, { cause: routerError });
    }

    const { playlistId } = routerData;
    const user = event.context.user;

    const accessible = await hasAccessToPlaylist(playlistId, user?._id);

    if (!accessible) {
        throw createKeyedError(403, APP_ERROR_CODES.PLAYLIST_FORBIDDEN);
    }

    const { data: bodyData, error: bodyError } = await readValidatedBody(event, AddToPlaylistBodySchema.safeParseAsync);

    if (bodyError) {
        throw createKeyedError(400, APP_ERROR_CODES.INVALID_REQUEST_BODY, { cause: bodyError });
    }

    const { adventureId, force } = bodyData;

    const result = await addAdventureToPlaylist(playlistId, adventureId, user!._id, force);
    return result;
});