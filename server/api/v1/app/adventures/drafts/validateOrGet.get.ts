export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const draftId = getQuery(event).draftId as string;

    if (!draftId) {
        try {
            const draft = await createDraft({ authorId: user._id });

            return draft._id;
        } catch (error: any) {
            // Weiterleiten von createDraft-Fehlern (z.B. Max-Drafts erreicht)
            if (error.statusCode) {
                throw error;
            }
            throw createError({
                statusCode: 500,
                statusMessage: 'Fehler beim Erstellen des Drafts',
                data: error,
            });
        }
    }

    const hasOwnership = await validateDraftOwnership(draftId, user._id);

    if (!hasOwnership) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Draft nicht gefunden oder keine Berechtigung'
        });
    }

    return draftId;
});
