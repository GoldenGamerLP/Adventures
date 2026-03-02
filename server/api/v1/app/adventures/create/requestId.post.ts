import { canCreateNewDraft, createDraft } from "~~/server/utils/adventures/DraftUtils";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const canCreate = await canCreateNewDraft(user._id);

    if (!canCreate) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Maximale Anzahl von Drafts erreicht',
        });
    }

    const createdDraft = await createDraft({ authorId: user._id });

    if (!createdDraft) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Fehler beim Erstellen des Drafts',
        });
    }

    return createdDraft._id;
});