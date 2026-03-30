import { AdventureListCreateSchema } from "#shared/schema/AdventureListSchema";
import { createPlaylist } from "~~/server/utils/playlists/PlaylistUtils";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createKeyedError(400, APP_ERROR_CODES.UNAUTHORIZED);
    }

    const { data, error } = await readValidatedBody(event, AdventureListCreateSchema.safeParseAsync);

    if (error) {
        throw createError({ statusCode: 400, statusMessage: "Invalid request body", data: error });
    }

    await createPlaylist(user._id, data);

    setResponseStatus(event, 201, "Playlist created");
});