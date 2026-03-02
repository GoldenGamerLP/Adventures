import { ensureAdventureIndexes } from '~~/server/utils/adventures/AdventureUtils';
import { ensureDraftIndexes } from '~~/server/utils/adventures/DraftUtils';
import { ensurePictureIndexes } from '~~/server/utils/pictures/PictureUtils';
import { ensureLikeIndexes } from '../utils/adventures/LikeUtils';
import { ensureViewIndexes } from '../utils/adventures/ViewsUtils';
import { ensureGeoIndexes } from '../utils/geo/GeoDB';

export default defineNitroPlugin(async () => {
    console.log('Initializing database indexes...');

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

        console.log('Database indexes initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database indexes:', error);
    }
});
