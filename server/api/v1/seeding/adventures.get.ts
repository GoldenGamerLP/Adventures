import { createKeyedError } from "~~/server/utils/errors/ApiErrorUtils";
import { assertSeedingApiKey, listSeedingAdventures } from "~~/server/utils/seeding/SeedingUtils";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";

export default defineEventHandler(async (event) => {
    assertSeedingApiKey(event);

    const query = getQuery(event);
    const status = query.status;
    const page = query.page ? parseInt(query.page as string, 10) : 0;
    const limit = query.limit ? parseInt(query.limit as string, 10) : 10;

    if (status && status !== 'pending' && status !== 'approved' && status !== 'rejected') {
        throw createKeyedError(400, APP_ERROR_CODES.SEEDING_INVALID_PAYLOAD);
    }

    console.log(`Listing seeding adventures with status=${status}, page=${page}, limit=${limit}`);

    return await listSeedingAdventures(status as 'pending' | 'approved' | 'rejected', page, limit);
});