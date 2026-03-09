import { storeDecorationalUserPicture } from "~~/server/utils/pictures/PictureUtils";
import { updateUserProfile } from "~~/server/utils/profiles/UserProfileUtils";
import { MAX_FILE_SIZE_BYTES } from "~~/shared/constants/Constants";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Nicht authentifiziert' });
    }

    const formData = await readFormData(event);
    const image = formData.get('image') as File;

    if (!image) {
        throw createError({ statusCode: 400, statusMessage: 'Es wurde kein Bild hochgeladen' });
    }

    if (image.size > MAX_FILE_SIZE_BYTES) {
        throw createError({ statusCode: 400, statusMessage: 'Die ausgewählte Datei ist zu groß.' });
    }

    let uploadedPictures, newProfile;
    try {
        //Delete old picture
        await removeDecorationPictures(user._id, 'background');

        uploadedPictures = await storeDecorationalUserPicture(user._id, image, 'background');

        if (uploadedPictures.length === 0) {
            throw createError({ statusCode: 500, statusMessage: 'Fehler beim Hochladen des Bildes' });
        }

        const newProfilePicture = uploadedPictures[0]!;
        newProfile = await updateUserProfile(user._id, { backgroundPictureId: newProfilePicture._id });
    } catch (error) {
        console.error('Error uploading background picture:', error);
        throw createError({ statusCode: 500, statusMessage: 'Fehler beim Hochladen des Bildes' });
    }

    return newProfile;
});