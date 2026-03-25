import { APP_ERROR_CODES } from '#shared/constants/Constants';
import type { UpdateDraftInput } from '#shared/types/DraftTypes';
import { updateDraft } from '~~/server/utils/adventures/DraftUtils';
import { createKeyedError } from '~~/server/utils/errors/ApiErrorUtils';
import { getPicturesByDraftId } from '~~/server/utils/pictures/PictureUtils';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createKeyedError(401, APP_ERROR_CODES.UNAUTHORIZED);
    }

    const draftId = getRouterParam(event, 'draftId');

    if (!draftId) {
        throw createKeyedError(400, APP_ERROR_CODES.DRAFT_ID_REQUIRED);
    }

    const isOwner = validateDraftOwnership(draftId, user._id);

    if (!isOwner) {
        throw createKeyedError(403, APP_ERROR_CODES.DRAFT_FORBIDDEN);
    }

    const body = await readBody<UpdateDraftInput>(event);

    // Validiere pictureIds falls vorhanden
    if (body.pictureIds && body.pictureIds.length > 0) {
        // Hole alle Bilder die zum Draft gehören
        const draftPictures = await getPicturesByDraftId(draftId);
        const validPictureIds = new Set(draftPictures.map(p => p._id));

        // Prüfe ob alle übergebenen IDs valide sind
        const invalidIds = body.pictureIds.filter(id => !validPictureIds.has(id));

        if (invalidIds.length > 0) {
            throw createKeyedError(400, APP_ERROR_CODES.INVALID_DRAFT_PICTURE_IDS, { invalidIds });
        }
    }

    const updatedDraft = await updateDraft(draftId, user._id, body);

    if (!updatedDraft) {
        throw createKeyedError(404, APP_ERROR_CODES.DRAFT_NOT_FOUND);
    }

    return updatedDraft;
});
