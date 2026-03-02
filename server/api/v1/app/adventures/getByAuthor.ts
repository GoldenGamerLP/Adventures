export default defineEventHandler(async (event) => {
    const authorId = getQuery(event).authorId as string;

    if (!authorId) {
        throw createError({ statusCode: 400, statusMessage: 'Author-ID fehlt' });
    }

    return await getAdventuresByAuthor(authorId, event.context.user ?? undefined);
});