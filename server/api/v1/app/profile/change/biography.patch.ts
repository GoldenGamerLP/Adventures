import { updateUserProfile } from '~~/server/utils/adventures/UserProfileUtils';
import { UpdateBiographySchema } from '~~/shared/schema/UserProfileSchema';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Nicht authentifiziert' });
    }

    const body = await readValidatedBody(event, UpdateBiographySchema.parse);

    const updated = await updateUserProfile(user._id, { biography: body.biography });

    if (!updated) {
        throw createError({ statusCode: 404, statusMessage: 'Profil nicht gefunden' });
    }

    return { biography: updated.biography };
});
