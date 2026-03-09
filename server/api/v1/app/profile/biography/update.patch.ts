import { updateUserProfile } from '~~/server/utils/profiles/UserProfileUtils';
import { UpdateBiographySchema } from '~~/shared/schema/UserProfileSchema';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Nicht authentifiziert' });
    }

    const { data, error } = await readValidatedBody(event, UpdateBiographySchema.safeParseAsync);

    if (error) {
        throw createError({ statusCode: 400, statusMessage: 'Ungültige Anfragedaten', data: error });
    }

    const { biography } = data;
    await updateUserProfile(user._id, { biography });

    setResponseStatus(event, 204, 'Biografie aktualisiert');
});
