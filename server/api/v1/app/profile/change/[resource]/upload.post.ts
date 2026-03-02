import { updateUserProfile } from "~~/server/utils/adventures/UserProfileUtils";
import { updateProfilePicture } from "~~/server/utils/auth/authUtils";
import { storeDecorationalUserPicture } from "~~/server/utils/pictures/PictureUtils";
import { MAX_FILE_SIZE_BYTES } from "~~/shared/constants/Constants";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Nicht authentifiziert' });
    }

    const resouce = getRouterParam(event, 'resource');

    if (resouce !== 'profile' && resouce !== 'background') {
        throw createError({ statusCode: 400, statusMessage: 'Ungültige Ressource' });
    }

    const formData = await readFormData(event);
    const image = formData.get('image') as File;

    if (!image) {
        throw createError({ statusCode: 400, statusMessage: 'Es wurde kein Bild hochgeladen' });
    }

    if (image.size > MAX_FILE_SIZE_BYTES) {
        throw createError({ statusCode: 400, statusMessage: 'Die ausgewählte Datei ist zu groß.' });
    }

    let uploadedPictures;
    try {
        uploadedPictures = await storeDecorationalUserPicture(user._id, image, resouce);

        if (uploadedPictures.length === 0) {
            throw createError({ statusCode: 500, statusMessage: 'Fehler beim Hochladen des Bildes' });
        }

        const newProfilePicture = uploadedPictures[0]!;

        switch (resouce) {
            case 'profile':
                await updateProfilePicture(user._id, newProfilePicture._id);
                await updateUserProfile(user._id, { profilePictureId: newProfilePicture._id });
                break;
            case 'background':
                await updateUserProfile(user._id, { backgroundPictureId: newProfilePicture._id });
                break;
        }
        
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw createError({ statusCode: 500, statusMessage: 'Fehler beim Hochladen des Bildes' });
    }

    return uploadedPictures[0]?._id;
});