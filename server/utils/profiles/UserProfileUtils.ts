import type { UserProfile, UserProfileWithMeta } from "#shared/types/UserProfileTypes";
import { ObjectId } from "mongodb";
import { getCollection } from "../database/DBUtils";

const getProfileDB = async () => getCollection<UserProfile>('user_profiles');

export const ensureUserProfileIndexes = async (): Promise<void> => {
    const profileDatabase = await getProfileDB();

    await profileDatabase.createIndex({ userId: 1 }, { unique: true });
    console.log('[UserProfile] UserProfile indexes created');
}

const getUserProfileByUserId = async (userId: string): Promise<UserProfileWithMeta | null> => {
    const profileDatabase = await getProfileDB();

    const response = await profileDatabase.aggregate<UserProfile>([
        { $match: { userId } },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userInfo"
            }
        },
        { $unwind: "$userInfo" },
        {
            $project: {
                _id: "$userInfo._id",
                userId: 1,
                biography: 1,
                header: 1,
                interests: 1,
                backgroundPictureId: 1,
                name: "$userInfo.name",
                profilePictureId: "$userInfo.profilePictureId",
                createdAt: "$userInfo.createdAt",
            }
        }
    ]).toArray();

    return response.length > 0 ? response[0]! as UserProfileWithMeta : null;
}

const createUserProfile = async (userId: string): Promise<UserProfile> => {
    const profileDatabase = await getProfileDB();

    const newProfile: UserProfile = {
        _id: new ObjectId().toString(),
        userId,
        interests: [],
    };

    await profileDatabase.insertOne(newProfile);
    return newProfile;
}

const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
    const profileDatabase = await getProfileDB();

    const result = await profileDatabase.findOneAndUpdate(
        { userId },
        { $set: updates },
        { returnDocument: 'after' }
    );
    return result;
}

export {
    createUserProfile, getUserProfileByUserId, updateUserProfile
};

