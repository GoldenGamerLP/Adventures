import { UpdateInterestsSchema } from "~~/shared/schema/UserProfileSchema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { data, error } = await readValidatedBody(event, UpdateInterestsSchema.safeParseAsync);

    if (error) {
        throw createError({ statusCode: 400, statusMessage: 'Ungültige Daten', data: error });
    }

    await updateUserProfile(user._id, { interests: data.interests });

    setResponseStatus(event, 204, "Interests updated"); // No Content
});