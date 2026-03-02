import { getDraftWithMeta } from '~~/server/utils/adventures/DraftUtils';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const draftId = getRouterParam(event, 'draftId');
    
    if (!draftId) {
        throw createError({ statusCode: 400, statusMessage: 'Draft-ID fehlt' });
    }

    // Prüfe Ownership und hole Draft mit Meta-Infos
    const draft = await getDraftWithMeta(draftId, user._id);
    
    if (!draft) {
        throw createError({ 
            statusCode: 404, 
            statusMessage: 'Draft nicht gefunden oder keine Berechtigung' 
        });
    }

    return draft;
});
