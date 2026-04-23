import { createKeyedError } from "~~/server/utils/errors/ApiErrorUtils";
import { assertSeedingApiKey, listSeedingAdventures } from "~~/server/utils/seeding/SeedingUtils";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";

export default defineEventHandler(async (event) => {
    assertSeedingApiKey(event);

    const query = getQuery(event);
    const status = query.status;

    if (status && status !== 'pending' && status !== 'approved' && status !== 'rejected') {
        throw createKeyedError(400, APP_ERROR_CODES.SEEDING_INVALID_PAYLOAD);
    }

    return await listSeedingAdventures(status as 'pending' | 'approved' | 'rejected' | undefined);
});