import { DRAFT_CONFIG, MAX_BUNDLE_SIZE_BYTES, MAX_FILE_SIZE_BYTES } from '#shared/constants/Constants';
import { addPictureToDraft, validateDraftOwnership } from '~~/server/utils/adventures/DraftUtils';
import { uploadDraftPictures } from '~~/server/utils/pictures/PictureUtils';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const draftId = getRouterParam(event, 'draftId');

    if (!draftId) {
        throw createError({ statusCode: 400, statusMessage: 'Draft-ID fehlt' });
    }

    // Prüfe Draft-Ownership
    const isOwner = await validateDraftOwnership(draftId, user._id);
    if (!isOwner) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Draft nicht gefunden oder keine Berechtigung'
        });
    }

    const formData = await readFormData(event);
    const images = formData.getAll('images') as File[];

    if (!images || images.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Keine Bilder zum Hochladen'
        });
    }

    if (images.length > DRAFT_CONFIG.MAX_PICTURES_PER_DRAFT) {
        throw createError({
            statusCode: 400,
            statusMessage: `Maximal ${DRAFT_CONFIG.MAX_PICTURES_PER_DRAFT} Bilder erlaubt`
        });
    }

    if (images.some(img => img.size > MAX_FILE_SIZE_BYTES)) {
        throw createError({
            statusCode: 400,
            statusMessage: `Einige Bilder überschreiten die maximale Größe von ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`
        });
    }

    if (images.reduce((acc, img) => acc + img.size, 0) > MAX_BUNDLE_SIZE_BYTES) {
        throw createError({
            statusCode: 400,
            statusMessage: `Die Gesamtgröße der Bilder überschreitet das Maximum von ${MAX_BUNDLE_SIZE_BYTES / (1024 * 1024)} MB`
        });
    }

    try {
        // Upload Bilder mit Draft-Referenz
        const uploadedPictures = await uploadDraftPictures(draftId, user._id, images);

        // Füge Picture-IDs zum Draft hinzu
        for (const picture of uploadedPictures) {
            await addPictureToDraft(draftId, user._id, picture._id);
        }

        setResponseStatus(event, 201);
        return uploadedPictures;
    } catch (error: any) {
        console.error('Upload error:', error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: 'Fehler beim Hochladen der Bilder',
            data: error,
        });
    }
});
