import { APP_ERROR_CODES } from "~~/shared/constants/Constants";
import { createKeyedError } from "~~/server/utils/errors/ApiErrorUtils";
import { assertSeedingApiKey, findSeedingAdventureById } from "~~/server/utils/seeding/SeedingUtils";
import { ObjectIdSchema } from "~~/shared/validation/utils";

export default defineEventHandler(async (event) => {
    assertSeedingApiKey(event);

    const adventureId = getRouterParam(event, 'adventureId');
    const { error } = ObjectIdSchema.safeParse(adventureId);

    if (error) {
        throw createKeyedError(400, APP_ERROR_CODES.SEEDING_INVALID_PAYLOAD);
    }

    const adventure = await findSeedingAdventureById(adventureId as string);

    if (!adventure) {
        throw createKeyedError(404, APP_ERROR_CODES.SEEDING_NOT_FOUND);
    }

    return adventure;
});