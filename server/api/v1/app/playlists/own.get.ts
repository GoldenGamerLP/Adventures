export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    return await getPlaylistByUserId(user._id, "private");
});