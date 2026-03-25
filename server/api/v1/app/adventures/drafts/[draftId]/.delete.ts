import { deleteDraft } from '~~/server/utils/adventures/DraftUtils';
import { createKeyedError } from '~~/server/utils/errors/ApiErrorUtils';
import { deleteAllDraftPictures } from '~~/server/utils/pictures/PictureUtils';
import { APP_ERROR_CODES } from '~~/shared/constants/Constants';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createKeyedError(401, APP_ERROR_CODES.UNAUTHORIZED);
    }

    const draftId = getRouterParam(event, 'draftId');
    
    if (!draftId) {
        throw createKeyedError(400, APP_ERROR_CODES.DRAFT_ID_REQUIRED);
    }

    // Lösche zuerst alle Bilder des Drafts
    await deleteAllDraftPictures(draftId);

    // Dann lösche den Draft selbst
    const deleted = await deleteDraft(draftId, user._id);
    
    if (!deleted) {
        throw createKeyedError(404, APP_ERROR_CODES.DRAFT_NOT_FOUND);
    }

    setResponseStatus(event, 204);
    return null;
});
