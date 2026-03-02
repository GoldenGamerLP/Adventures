import { removePictureFromDraft, validateDraftOwnership } from '~~/server/utils/adventures/DraftUtils';
import { deleteDraftPicture } from '~~/server/utils/pictures/PictureUtils';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const draftId = getRouterParam(event, 'draftId');
    const pictureId = getRouterParam(event, 'pictureId');
    
    if (!draftId || !pictureId) {
        throw createError({ statusCode: 400, statusMessage: 'Draft-ID oder Picture-ID fehlt' });
    }

    // Prüfe Draft-Ownership
    const isOwner = await validateDraftOwnership(draftId, user._id);
    if (!isOwner) {
        throw createError({ 
            statusCode: 404, 
            statusMessage: 'Draft nicht gefunden oder keine Berechtigung' 
        });
    }

    // Lösche Bild aus Storage und DB
    const deleted = await deleteDraftPicture(pictureId, draftId, user._id);
    
    if (!deleted) {
        throw createError({ 
            statusCode: 404, 
            statusMessage: 'Bild nicht gefunden oder keine Berechtigung' 
        });
    }

    // Entferne aus Draft
    await removePictureFromDraft(draftId, user._id, pictureId);

    setResponseStatus(event, 204);
    return null;
});
