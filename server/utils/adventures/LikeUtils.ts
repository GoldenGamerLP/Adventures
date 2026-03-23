import { ObjectId } from "mongodb";
import { AdventureListWithMeta, VirtualList } from "~~/shared/types/AdventureListsTypes";
import database from "../database/DBUtils";

const likeDatabase = database.collection<Like>("adventure_likes");

const ensureLikeIndexes = async (): Promise<void> => {
    await likeDatabase.createIndex({ adventureId: 1 });
    await likeDatabase.createIndex({ userId: 1 });
    await likeDatabase.createIndex({ adventureId: 1, userId: 1 }, { unique: true });
    console.log('[LikeUtils] Like indexes created');
}

/**
 * Wirft einen Fehler, wenn der User das Adventure bereits geliked hat
 * @param adventureId 
 * @param userId 
 */
const addLike = async (adventureId: string, userId: string): Promise<void> => {
    await likeDatabase.insertOne({
        _id: new ObjectId().toString(),
        adventureId,
        userId,
        createdAt: new Date(),
    });
}

const removeLike = async (adventureId: string, userId: string): Promise<void> => {
    await likeDatabase.deleteOne({ adventureId, userId });
}

const toggleLike = async (adventureId: string, userId: string): Promise<boolean> => {
    const existingLike = await likeDatabase.countDocuments({ adventureId, userId });

    if (existingLike > 0) {
        await removeLike(adventureId, userId);
    } else {
        await addLike(adventureId, userId);
    }

    return existingLike === 0; // Gibt zurück, ob das Abenteuer jetzt geliked ist
}

const getLikedAdventuresForUser = async (userId: string): Promise<string[]> => {
    const likes = await likeDatabase.find({ userId }).toArray();
    return likes.map(like => like.adventureId);
}

const getLikedAdventuresByUserId = async (userId: string, skip: number, limit: number): Promise<AdventureListEntry[]> => {
    const result = await likeDatabase.aggregate([
        {
            '$match': {
                'userId': userId,
            }
        }, {
            '$sort': {
                'createdAt': -1
            }
        }, {
            '$skip': skip
        }, {
            '$limit': limit
        }, {
            '$lookup': {
                'from': 'adventures',
                'localField': 'adventureId',
                'foreignField': '_id',
                'as': 'populatedAdventure'
            }
        }, {
            '$unwind': {
                'path': '$populatedAdventure',
            }
        }
    ]).toArray();

    return result.map(item => {
        return {
            _id: item._id,
            adventureListId: "",
            adventureId: item.adventureId,
            order: 0,
            createdAt: item.createdAt,
            updatedAt: item.createdAt,
            populatedAdventure: item.populatedAdventure,
        };
    })
}


interface Like {
    _id: string;
    adventureId: string;
    userId: string;
    createdAt: Date;
}

const hydrateLikedAdevnturesList = async (list: VirtualList): Promise<AdventureListWithMeta> => {
    const userId = list.ownerId;

    const likedAdventureCount = await likeDatabase.countDocuments({ userId });
    const result = await likeDatabase.aggregate([
        {
            '$match': {
                'userId': userId,
            }
        }, {
            '$sort': {
                'createdAt': -1
            }
        }, {
            '$limit': 4
        }, {
            '$lookup': {
                'from': 'adventures',
                'localField': 'adventureId',
                'foreignField': '_id',
                'as': 'adventureDetails'
            }
        }, {
            '$unwind': {
                'path': '$adventureDetails'
            }
        }, {
            '$group': {
                '_id': null,
                'images': {
                    '$addToSet': {
                        '$first': '$adventureDetails.pictureIds'
                    }
                }
            }
        }
    ]).toArray();

    const ownerObject = await getUserById(userId);

    return { ...list, entryCount: likedAdventureCount, previewImages: result ? result[0]!.images : [], owner: ownerObject! };
}

export {
    addLike, ensureLikeIndexes, getLikedAdventuresByUserId, getLikedAdventuresForUser, hydrateLikedAdevnturesList, removeLike,
    toggleLike
};

