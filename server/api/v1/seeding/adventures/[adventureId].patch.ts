import { createKeyedError } from "~~/server/utils/errors/ApiErrorUtils";
import { approveOrRejectSeedingAdventure, assertSeedingApiKey } from "~~/server/utils/seeding/SeedingUtils";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";
import { SeedingDecisionSchema } from "~~/shared/schema/SeedingSchema";

export default defineEventHandler(async (event) => {
    assertSeedingApiKey(event);

    const body = await readBody(event);
    const adventureId = getRouterParam(event, 'adventureId');
    const { data, error } = await SeedingDecisionSchema.safeParseAsync({
        ...body,
        adventureId,
    });

    if (error) {
        throw createKeyedError(400, APP_ERROR_CODES.SEEDING_INVALID_PAYLOAD, {
            issues: error.issues,
        });
    }

    const result = await approveOrRejectSeedingAdventure(data);

    return {
        success: true,
        seed: result.seed,
        adventure: result.adventure,
        decision: result.decision,
    };
});