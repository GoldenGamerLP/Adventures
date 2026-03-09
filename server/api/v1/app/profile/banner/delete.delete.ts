import { removeDecorationPictures } from "~~/server/utils/pictures/PictureUtils";
import { updateUserProfile } from "~~/server/utils/profiles/UserProfileUtils";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Nicht authentifiziert' });
    }

    await removeDecorationPictures(user._id, 'background');
    await updateUserProfile(user._id, { backgroundPictureId: undefined });

    setResponseStatus(event, 204, 'Picture deleted');
});