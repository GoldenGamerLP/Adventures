import { publishDraft } from "~~/server/utils/adventures/DraftUtils";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const draftId = getRouterParam(event, 'draftId');

    if (!draftId) {
        throw createError({ statusCode: 400, statusMessage: 'Draft ID is required' });
    }

    const isDraftOwner = await validateDraftOwnership(draftId, user._id);

    if (!isDraftOwner) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: You do not own this draft' });
    }

    const adventure = await publishDraft(draftId, user._id);

    //Nur id für die weiterleitung zurückgeben
    return adventure._id;
});