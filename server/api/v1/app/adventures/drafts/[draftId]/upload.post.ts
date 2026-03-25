import { APP_ERROR_CODES, DRAFT_CONFIG, MAX_BUNDLE_SIZE_BYTES, MAX_FILE_SIZE_BYTES } from '#shared/constants/Constants';
import { addPictureToDraft, validateDraftOwnership } from '~~/server/utils/adventures/DraftUtils';
import { createKeyedError } from '~~/server/utils/errors/ApiErrorUtils';
import { uploadDraftPictures } from '~~/server/utils/pictures/PictureUtils';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createKeyedError(401, APP_ERROR_CODES.UNAUTHORIZED);
    }

    const draftId = getRouterParam(event, 'draftId');

    if (!draftId) {
        throw createKeyedError(400, APP_ERROR_CODES.DRAFT_ID_REQUIRED);
    }

    // Prüfe Draft-Ownership
    const isOwner = await validateDraftOwnership(draftId, user._id);
    if (!isOwner) {
        throw createKeyedError(404, APP_ERROR_CODES.DRAFT_NOT_FOUND);
    }

    const formData = await readMultipartFormData(event);
    const images: File[] = [];

    if (formData) {
        for (let i = 0; i < formData.length; i++) {
            const item = formData[i];
            if (!item) continue;
            const { data, filename, name, type } = item;
            if (name === 'pictures') {
                const buffer: Buffer<ArrayBuffer> = data as Buffer<ArrayBuffer>;

                const file = new File([buffer], filename!, { type });
                images.push(file);
            }
        }
    }

    if (!images || images.length === 0) {
        throw createKeyedError(400, APP_ERROR_CODES.NO_PICTURES_TO_UPLOAD);
    }

    if (images.length > DRAFT_CONFIG.MAX_PICTURES_PER_DRAFT) {
        throw createKeyedError(400, APP_ERROR_CODES.DRAFT_PICTURE_LIMIT_EXCEEDED, {
            params: {
                maxPictures: DRAFT_CONFIG.MAX_PICTURES_PER_DRAFT,
            },
        });
    }

    if (images.some(img => img.size > MAX_FILE_SIZE_BYTES)) {
        throw createKeyedError(400, APP_ERROR_CODES.DRAFT_PICTURE_FILE_SIZE_EXCEEDED, {
            params: {
                maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
                maxFileSizeMb: MAX_FILE_SIZE_BYTES / (1024 * 1024),
            },
        });
    }

    if (images.reduce((acc, img) => acc + img.size, 0) > MAX_BUNDLE_SIZE_BYTES) {
        throw createKeyedError(400, APP_ERROR_CODES.DRAFT_PICTURE_BUNDLE_SIZE_EXCEEDED, {
            params: {
                maxBundleSizeBytes: MAX_BUNDLE_SIZE_BYTES,
                maxBundleSizeMb: MAX_BUNDLE_SIZE_BYTES / (1024 * 1024),
            },
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
            statusText: APP_ERROR_CODES.DRAFT_PICTURE_UPLOAD_FAILED,
            statusMessage: APP_ERROR_CODES.DRAFT_PICTURE_UPLOAD_FAILED,
            data: {
                code: APP_ERROR_CODES.DRAFT_PICTURE_UPLOAD_FAILED,
                cause: error,
            },
        });
    }
});
