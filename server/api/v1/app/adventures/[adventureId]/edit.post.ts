import { validateAdventureOwnership } from "~~/server/utils/adventures/AdventureUtils";
import { getOrCreateNewEditableDraft } from "~~/server/utils/adventures/DraftUtils";
import { AdventureStartEditSchema } from "~~/shared/schema/AdventuresSchema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { data, error } = await getValidatedRouterParams(event, AdventureStartEditSchema.safeParseAsync);

    if (error) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid adventure ID' });
    }

    const { adventureId } = data;
    
    const isOwner = await validateAdventureOwnership(adventureId, user._id);

    if (!isOwner) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: You do not own this adventure' });
    }

    const draft = await getOrCreateNewEditableDraft(adventureId, user._id);

    return draft._id;
});