import { AdventureListEntry, AdventureListWithMeta } from "~~/shared/types/AdventureListsTypes";
import { getLikedAdventuresByUserId, hydrateLikedAdevnturesList } from "../adventures/LikeUtils";
import database from "../database/DBUtils";


export const DEFAULT_LIKED_LIST = (userId: string): VirtualList => ({
    _id: `sys:liked:${userId}`,
    name: "Liked Adventures",
    description: "A collection of adventures you've liked.",
    listType: "virtual",
    systemKey: "liked",
    ownerId: userId,
});

const playlistDB = database.collection<UserList>("playlists");
const playlistEntriesDB = database.collection<AdventureListEntry>("playlist_entries");

export const ensurePlaylistIndexes = async (): Promise<void> => {
    await playlistDB.createIndex({ ownerId: 1 });
    await playlistDB.createIndex({ visibility: 1 });
    await playlistEntriesDB.createIndex({ adventureListId: 1 });
    await playlistEntriesDB.createIndex({ adventureId: 1 });
    console.log('[PlaylistUtils] Playlist indexes created');
}

export const getPlaylistByUserId = async (userId: string, visibility: "private" | "public" | "notListed"): Promise<AdventureListWithMeta[]> => {
    const result = await playlistDB.find({ ownerId: userId, visibility }).toArray();

    const playlistsWithMeta = result.map(hydratePlaylistWithMeta);
    if (visibility === "private") {
        playlistsWithMeta.unshift(hydrateLikedAdevnturesList(DEFAULT_LIKED_LIST(userId)));
    }

    return await Promise.all(playlistsWithMeta);
};

const hydratePlaylistWithMeta = async (playlist: UserList): Promise<AdventureListWithMeta> => {
    const entryCount = await playlistDB.countDocuments({ adventureListId: playlist._id });
    const previewEntries = playlistDB.aggregate([
        { $match: { adventureListId: playlist._id } },
        { $sort: { createdAt: -1 } },
        { $limit: 4 },
        {
            $lookup: {
                from: "adventures",
                localField: "adventureId",
                foreignField: "_id",
                as: "adventureDetails"
            }
        },
        { $unwind: "$adventureDetails" },
        { $project: { "adventureDetails.images": 1 } },
    ]).toArray();

    const result = await previewEntries;
    const previewImages = result.flatMap(entry => entry.adventureDetails.images.slice(0, 1)); // nur erstes Bild pro Abenteuer

    const ownerObject = await getUserById(playlist.ownerId);

    if (!ownerObject) {
        //Der Owner kann null sein, wenn der Benutzer gelöscht wurde. In diesem Fall setzen wir den Owner auf einen Platzhalter. TODO
        throw new Error("Owner not found for playlist");
    }

    return { ...playlist, entryCount, previewImages, owner: ownerObject };
};

export const getPlaylistInfo = async (playlistId: string): Promise<AdventureListWithMeta> => {
    if (playlistId.startsWith("sys:")) {
        const [_, type, userId] = playlistId.split(":");
        if (type === "liked") {
            return hydrateLikedAdevnturesList(DEFAULT_LIKED_LIST(userId!));
        }

        throw new Error("Unknown system playlist type");
    }

    const playlist = await playlistDB.findOne({ _id: playlistId });
    if (!playlist) {
        throw new Error("Playlist not found");
    }

    return hydratePlaylistWithMeta(playlist);
};

export const getPlaylistEntries = async (playlistId: string, ownerId: string | undefined, skip: number, limit: number): Promise<AdventureListEntry[]> => {
    const playlistType = playlistId.startsWith("sys:") ? "virtual" : "user";
    const playlistKey = playlistType === "virtual" ? playlistId.split(":")[1] : playlistId;

    if (playlistType === "virtual") {
        if (!ownerId) {
            throw new Error("Owner ID is required for accessing virtual playlists");
        }

        if (playlistKey === "liked") {
            return await getLikedAdventuresByUserId(ownerId, skip, limit);
        }

        throw new Error("Unknown virtual playlist type");
    }

    const result = await playlistEntriesDB.aggregate([
        { $match: { adventureListId: playlistId } },
        { $sort: { order: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: "adventures",
                localField: "adventureId",
                foreignField: "_id",
                as: "adventureDetails"
            }
        },
        { $unwind: "$adventureDetails" },
    ]).toArray();

    return result.map(entry => ({
        _id: entry._id,
        adventureListId: entry.adventureListId,
        adventureId: entry.adventureId,
        order: entry.order,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        populatedAdventure: entry.adventureDetails,
    }));
}

export const hasAccessToPlaylist = async (playlist: string, userId?: string) => {
    if (playlist.startsWith("sys:")) {
        const [_, type, ownerId] = playlist.split(":");
        if (type === "liked") {
            return userId === ownerId; // nur Besitzer hat Zugriff auf die Liked-Playlist
        }

        throw new Error("Unknown system playlist type");
    }
    const response = await playlistDB.findOne({ _id: playlist, visibility: { $in: ["notListed", "public"] } });

    return response !== null;
}