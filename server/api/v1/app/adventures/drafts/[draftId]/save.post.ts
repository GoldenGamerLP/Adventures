import type { UpdateDraftInput } from '#shared/types/DraftTypes';
import { updateDraft } from '~~/server/utils/adventures/DraftUtils';
import { getPicturesByDraftId } from '~~/server/utils/pictures/PictureUtils';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const draftId = getRouterParam(event, 'draftId');

    if (!draftId) {
        throw createError({ statusCode: 400, statusMessage: 'Draft-ID fehlt' });
    }

    const isOwner = validateDraftOwnership(draftId, user._id);

    if (!isOwner) {
        throw createError({ statusCode: 403, statusMessage: 'Keine Berechtigung zum Bearbeiten dieses Drafts' });
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
            throw createError({
                statusCode: 400,
                statusMessage: 'Ungültige Picture-IDs',
                data: { invalidIds },
            });
        }
    }

    const updatedDraft = await updateDraft(draftId, user._id, body);

    if (!updatedDraft) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Draft nicht gefunden oder keine Berechtigung'
        });
    }

    return updatedDraft;
});
