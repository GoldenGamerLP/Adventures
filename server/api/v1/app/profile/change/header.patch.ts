import { updateUserProfile } from '~~/server/utils/adventures/UserProfileUtils';
import { UpdateHeaderSchema } from '~~/shared/schema/UserProfileSchema';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Nicht authentifiziert' });
    }

    const body = await readValidatedBody(event, UpdateHeaderSchema.parse);

    const updated = await updateUserProfile(user._id, { header: body.header });

    if (!updated) {
        throw createError({ statusCode: 404, statusMessage: 'Profil nicht gefunden' });
    }

    return { header: updated.header };
});
