import { ObjectId } from "mongodb";
import database from "../database/DBUtils";

const likeDatabase = database.collection<Like>("adventure_likes");

const ensureLikeIndexes = async (): Promise<void> => {
    await likeDatabase.createIndex({ adventureId: 1 });
    await likeDatabase.createIndex({ userId: 1 });
    await likeDatabase.createIndex({ adventureId: 1, userId: 1 }, { unique: true });
    console.log('Like indexes created');
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


interface Like {
    _id: string;
    adventureId: string;
    userId: string;
    createdAt: Date;
}

export {
    addLike, ensureLikeIndexes, getLikedAdventuresForUser, removeLike,
    toggleLike
};

