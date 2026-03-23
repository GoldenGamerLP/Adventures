import { PublicPlaylistsQuerySchema } from "#shared/schema/PlaylistSchema";

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedQuery(event, PublicPlaylistsQuerySchema.safeParseAsync);

    if (error) {
        throw createError({ statusCode: 400, message: "Invalid query parameters", cause: error });
    }

    const { userId } = data;

    return await getPlaylistByUserId(userId, "public");
});