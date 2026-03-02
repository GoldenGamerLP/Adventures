import { updateUserProfile } from "~~/server/utils/adventures/UserProfileUtils";
import { updateProfilePicture } from "~~/server/utils/auth/authUtils";
import { removeDecorationPictures } from "~~/server/utils/pictures/PictureUtils";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Nicht authentifiziert' });
    }

    const resouce = getRouterParam(event, 'resource');

    if (resouce !== 'profile' && resouce !== 'background') {
        throw createError({ statusCode: 400, statusMessage: 'Ungültige Ressource' });
    }

    switch (resouce) {
        case 'profile':
            await removeDecorationPictures(user._id, 'profile');
            await updateProfilePicture(user._id, undefined);
            break;
        case 'background':
            await removeDecorationPictures(user._id, 'background');
            await updateUserProfile(user._id, { backgroundPictureId: undefined });
            break;
    }

    setResponseStatus(event, 204, 'Picture deleted');
});