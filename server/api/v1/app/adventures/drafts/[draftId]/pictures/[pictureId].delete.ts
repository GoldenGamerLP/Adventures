import { removePictureFromDraft, validateDraftOwnership } from '~~/server/utils/adventures/DraftUtils';
import { createKeyedError } from '~~/server/utils/errors/ApiErrorUtils';
import { deleteDraftPicture } from '~~/server/utils/pictures/PictureUtils';
import { APP_ERROR_CODES } from '~~/shared/constants/Constants';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createKeyedError(401, APP_ERROR_CODES.UNAUTHORIZED);
    }

    const draftId = getRouterParam(event, 'draftId');
    const pictureId = getRouterParam(event, 'pictureId');
    
    if (!draftId || !pictureId) {
        throw createKeyedError(400, APP_ERROR_CODES.DRAFT_PICTURE_ID_REQUIRED);
    }

    // Prüfe Draft-Ownership
    const isOwner = await validateDraftOwnership(draftId, user._id);
    if (!isOwner) {
        throw createKeyedError(404, APP_ERROR_CODES.DRAFT_NOT_FOUND);
    }

    // Lösche Bild aus Storage und DB
    const deleted = await deleteDraftPicture(pictureId, draftId, user._id);
    
    if (!deleted) {
        throw createKeyedError(404, APP_ERROR_CODES.DRAFT_PICTURE_NOT_FOUND);
    }

    // Entferne aus Draft
    await removePictureFromDraft(draftId, user._id, pictureId);

    setResponseStatus(event, 204);
    return null;
});
