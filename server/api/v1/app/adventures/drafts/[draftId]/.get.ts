import { getDraftWithMeta } from '~~/server/utils/adventures/DraftUtils';
import { APP_ERROR_CODES } from '~~/shared/constants/Constants';
import { DraftIdGetSchema } from '~~/shared/schema/DraftSchema';
import { createKeyedError } from '~~/server/utils/errors/ApiErrorUtils';


export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createKeyedError(401, APP_ERROR_CODES.UNAUTHORIZED);
    }

    const { data, error } = await getValidatedRouterParams(event, DraftIdGetSchema.safeParseAsync);

    if (error) {
        throw createKeyedError(400, APP_ERROR_CODES.INVALID_DRAFT_ID);
    }

    // Prüfe Ownership und hole Draft mit Meta-Infos
    const { draftId } = data;

    const isOwner = validateDraftOwnership(draftId, user._id);

    if (!isOwner) {
        throw createKeyedError(403, APP_ERROR_CODES.DRAFT_FORBIDDEN);
    }

    const draft = await getDraftWithMeta(draftId, user._id);

    if (!draft) {
        throw createKeyedError(404, APP_ERROR_CODES.DRAFT_NOT_FOUND);
    }

    return draft;
});
