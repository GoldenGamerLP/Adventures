import { getDraftWithMeta } from '~~/server/utils/adventures/DraftUtils';
import { DraftIdGetSchema } from '~~/shared/schema/DraftSchema';


export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { data, error } = await getValidatedRouterParams(event, DraftIdGetSchema.safeParseAsync);

    if (error) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid draftId parameter' });
    }

    // Prüfe Ownership und hole Draft mit Meta-Infos
    const { draftId } = data;

    const isOwner = validateDraftOwnership(draftId, user._id);

    if (!isOwner) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: You do not have access to this draft'
        });
    }

    const draft = await getDraftWithMeta(draftId, user._id);

    if (!draft) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Draft nicht gefunden oder keine Berechtigung'
        });
    }

    return draft;
});
