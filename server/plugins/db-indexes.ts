import { ensureAdventureIndexes } from "#server/utils/adventures/AdventureUtils";
import { ensureDraftIndexes } from "#server/utils/adventures/DraftUtils";
import { ensureLikeIndexes } from "#server/utils/adventures/LikeUtils";
import { ensureViewIndexes } from "#server/utils/adventures/ViewsUtils";
import { ensureGeoIndexes } from "#server/utils/geo/GeoDB";
import { ensurePictureIndexes } from "#server/utils/pictures/PictureUtils";
import { ensureUserProfileIndexes } from "#server/utils/profiles/UserProfileUtils";

export default defineNitroPlugin(() => {
    console.log('Initializing database indexes...');
    return createIndexes();
});

const createIndexes = async () => {
    try {
        await Promise.all([
            ensureDraftIndexes(),
            ensurePictureIndexes(),
            ensureAdventureIndexes(),
            ensureViewIndexes(),
            ensureLikeIndexes(),
            ensureUserProfileIndexes(),
            ensureGeoIndexes(),
        ]);

        console.log('All database indexes created successfully');
    } catch (error) {
        console.error('Failed to initialize database indexes:', error);
        return { result: "Error", };
    }
}