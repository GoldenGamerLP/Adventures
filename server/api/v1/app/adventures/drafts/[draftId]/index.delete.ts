import { deleteDraft } from '~~/server/utils/adventures/DraftUtils';
import { deleteAllDraftPictures } from '~~/server/utils/pictures/PictureUtils';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const draftId = getRouterParam(event, 'draftId');
    
    if (!draftId) {
        throw createError({ statusCode: 400, statusMessage: 'Draft-ID fehlt' });
    }

    // Lösche zuerst alle Bilder des Drafts
    await deleteAllDraftPictures(draftId);

    // Dann lösche den Draft selbst
    const deleted = await deleteDraft(draftId, user._id);
    
    if (!deleted) {
        throw createError({ 
            statusCode: 404, 
            statusMessage: 'Draft nicht gefunden oder keine Berechtigung' 
        });
    }

    setResponseStatus(event, 204);
    return null;
});
