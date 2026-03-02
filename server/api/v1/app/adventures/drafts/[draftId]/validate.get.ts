import { validateDraftOwnership } from '~~/server/utils/adventures/DraftUtils';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const draftId = getRouterParam(event, 'draftId');
    
    if (!draftId) {
        throw createError({ statusCode: 400, statusMessage: 'Draft-ID fehlt' });
    }

    const isValid = await validateDraftOwnership(draftId, user._id);
    
    if (!isValid) {
        throw createError({ 
            statusCode: 404, 
            statusMessage: 'Draft nicht gefunden oder keine Berechtigung' 
        });
    }

    return { valid: true, draftId };
});
