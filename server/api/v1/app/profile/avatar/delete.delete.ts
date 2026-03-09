import { removeDecorationPictures } from "~~/server/utils/pictures/PictureUtils";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Nicht authentifiziert' });
    }

    await removeDecorationPictures(user._id, 'profile');
    //Deleted from userProfile Database
    await updateUserProfile(user._id, { profilePictureId: undefined });
    //Deleted from auth Database
    await updateProfilePicture(user._id, undefined);

    setResponseStatus(event, 204, 'Picture deleted');
});