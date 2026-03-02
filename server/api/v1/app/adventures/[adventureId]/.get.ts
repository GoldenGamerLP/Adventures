import { getAdventureByIdWithMeta } from "~~/server/utils/adventures/AdventureUtils";
import { logView } from "~~/server/utils/adventures/ViewsUtils";
import { AdventureGetByIdSchema } from "~~/shared/schema/AdventuresSchema";

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedRouterParams(event, AdventureGetByIdSchema.safeParseAsync);

    if (error) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid adventure ID',
        });
    }

    const { adventureId } = data;
    const user = event.context.user;

    const adventure = await getAdventureByIdWithMeta(adventureId, user);

    if (!adventure) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Adventure not found',
        });
    }


    logView(adventureId, user ? { userId: user._id } : { fingerprint: await getRequestFingerprint(event) || 'anonymous' });

    return adventure;
});