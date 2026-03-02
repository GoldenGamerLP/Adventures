import { updateUserProfile } from '~~/server/utils/adventures/UserProfileUtils';
import { UpdateTagsSchema } from '~~/shared/schema/UserProfileSchema';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Nicht authentifiziert' });
    }

    const body = await readValidatedBody(event, UpdateTagsSchema.parse);

    const updated = await updateUserProfile(user._id, { tags: body.tags });

    if (!updated) {
        throw createError({ statusCode: 404, statusMessage: 'Profil nicht gefunden' });
    }

    return { tags: updated.tags };
});
