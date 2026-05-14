import { APP_ERROR_CODES } from "~~/shared/constants/Constants";
import { SimilarAdventuresFilterSchema } from "~~/shared/schema/AdventuresSchema";

export default defineEventHandler(async (event) => {

    const { data, error } = await getValidatedQuery(event, SimilarAdventuresFilterSchema.safeParseAsync);

    if (error) {
        throw createKeyedError(500, APP_ERROR_CODES.INVALID_QUERY, error.formErrors);
    }

    const similarAdventures = await findSimilarAdventures(data);

    return similarAdventures;
});