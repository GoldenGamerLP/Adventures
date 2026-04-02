import { ObjectId } from "mongodb";
import type { AdventureListCreateInput, ChangeAdventureOrderInput, DeleteAdventureListInput, UpdateAdventureListInput } from "~~/shared/schema/AdventureListSchema";
import type { GetPlaylistsByAdventureQueryType } from "~~/shared/schema/PlaylistSchema";
import type { AdventureListEntry, AdventureListWithMeta } from "~~/shared/types/AdventureListsTypes";
import { getLikedAdventuresByUserId, hydrateLikedAdevnturesList } from "../adventures/LikeUtils";
import { getHistoryEntries, hydrateHistoryAdventuresList } from "../adventures/ViewsUtils";
import { getCollection } from "../database/DBUtils";


export const DEFAULT_LIKED_LIST = (userId: string): VirtualList => ({
    _id: `sys:liked:${userId}`,
    name: "components_playlists_liked_title",
    description: "components_playlists_liked_description",
    listType: "virtual",
    systemKey: "liked",
    ownerId: userId,
});

//TODO: Translation der Namen und Beschreibungen der System-Playlists
export const DEFAULT_HISTORY_LIST = (userId: string): VirtualList => ({
    _id: `sys:history:${userId}`,
    name: "components_playlists_history_title",
    description: "components_playlists_history_description",
    listType: "virtual",
    systemKey: "history",
    ownerId: userId,
});

const getPlaylistDB = async () => getCollection<UserList>("adventure_lists");
const getPlaylistEntriesDB = async () => getCollection<AdventureListEntry>("adventure_list_entries");

export const ensurePlaylistIndexes = async (): Promise<void> => {
    const playlistDB = await getPlaylistDB();
    const playlistEntriesDB = await getPlaylistEntriesDB();

    await playlistDB.createIndex({ ownerId: 1 });
    await playlistDB.createIndex({ visibility: 1 });
    await playlistEntriesDB.createIndex({ adventureListId: 1 });
    await playlistEntriesDB.createIndex({ adventureId: 1 });
    await playlistEntriesDB.createIndex({ adventureIds: 1, ownerId: 1 });
    console.log('[PlaylistUtils] Playlist indexes created');
}

export const createPlaylist = async (user: string, data: AdventureListCreateInput): Promise<void> => {
    const playlistDB = await getPlaylistDB();

    const newPlaylist: UserList = {
        _id: new ObjectId().toString(),
        name: data.name,
        description: data.description,
        ownerId: user,
        visibility: data.visibility,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        listType: "user",
        permissions: {
            canRead: [],
            canWrite: [],
        }
    };

    await playlistDB.insertOne(newPlaylist);
}

export const deletePlaylist = async (data: DeleteAdventureListInput): Promise<void> => {
    const playlistDB = await getPlaylistDB();
    const playlistEntriesDB = await getPlaylistEntriesDB();

    const playlist = await playlistDB.findOneAndDelete({ _id: data.adventureListId, ownerId: data.userId });

    if (!playlist) {
        throw new Error("Playlist not found or user is not the owner");
    }

    await playlistEntriesDB.deleteMany({ adventureListId: data.adventureListId });
}

export const updatePlaylist = async (data: UpdateAdventureListInput): Promise<void> => {
    const playlistDB = await getPlaylistDB();
    const updateData: Partial<UserList> = { ...data, updatedAt: new Date().toISOString() };

    const result = await playlistDB.updateOne({ _id: data.adventureListId, ownerId: data.userId }, { $set: updateData });
    if (result.matchedCount === 0) {
        throw new Error("Playlist not found or user is not the owner");
    }
}

export const removeAdventureFromPlaylist = async (adventurelistid: string, adventureentryid: string): Promise<void> => {
    const playlistEntriesDB = await getPlaylistEntriesDB();

    //Benutzen von entryId da es mehrere Einträge mit adventureId geben kann (wenn force add aktiviert ist, duplikate)
    await playlistEntriesDB.deleteMany({ adventureListId: adventurelistid, _id: adventureentryid });
}

export const changeAdventureOrderInPlaylist = async (data: ChangeAdventureOrderInput): Promise<void> => {
    const playlistEntriesDB = await getPlaylistEntriesDB();

    await playlistEntriesDB.updateOne({ adventureListId: data.adventureListId, _id: data.adventureEntryId }, { $set: { order: data.newOrder, updatedAt: new Date().toISOString() } });
}

export const getPlaylistByUserId = async (userId: string, query: GetPlaylistsByAdventureQueryType): Promise<AdventureListWithMeta[]> => {
    const playlistDB = await getPlaylistDB();

    const visibilityFilter = getHigherOrderVisibility(query.mode) as ("private" | "unlisted" | "public")[];
    const result = await playlistDB.find({ ownerId: userId, visibility: { $in: visibilityFilter } }).toArray();

    const playlistsWithMeta = result.map(hydratePlaylistWithMeta);
    if (query.includeVirtual && query.mode === "private") {
        playlistsWithMeta.unshift(hydrateLikedAdevnturesList(DEFAULT_LIKED_LIST(userId)));
        playlistsWithMeta.unshift(hydrateHistoryAdventuresList(DEFAULT_HISTORY_LIST(userId)));
    }

    return await Promise.all(playlistsWithMeta);
};

const getHigherOrderVisibility = (visibility: "private" | "public" | "unlisted") => {
    if (visibility === "private") return ["private", "unlisted", "public"];
    if (visibility === "unlisted") return ["unlisted", "public"];
    return ["public"];
}

const hydratePlaylistWithMeta = async (playlist: UserList): Promise<AdventureListWithMeta> => {
    const entriesDB = await getPlaylistEntriesDB();

    const entryCount = await entriesDB.countDocuments({ adventureListId: playlist._id });
    const previewEntries = await entriesDB.aggregate([
        { $match: { adventureListId: playlist._id } },
        { $sort: { updatedAt: -1 } },
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
        {
            $group: {
                _id: null,
                images: { $addToSet: { $first: "$adventureDetails.pictureIds" } }
            }
        }
    ]).toArray();

    const ownerObject = await getUserById(playlist.ownerId);

    if (!ownerObject) {
        //Der Owner kann null sein, wenn der Benutzer gelöscht wurde. In diesem Fall setzen wir den Owner auf einen Platzhalter. TODO
        throw new Error("Owner not found for playlist");
    }

    return { ...playlist, entryCount, previewImages: previewEntries[0]?.images || [], owner: ownerObject };
};

export const getPlaylistInfo = async (playlistId: string): Promise<AdventureListWithMeta> => {
    const playlistDB = await getPlaylistDB();

    if (playlistId.startsWith("sys:")) {
        const [_, type, userId] = playlistId.split(":");
        if (type === "liked") {
            return hydrateLikedAdevnturesList(DEFAULT_LIKED_LIST(userId!));
        }
        if (type === "history") {
            return hydrateHistoryAdventuresList(DEFAULT_HISTORY_LIST(userId!));
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
    const playlistEntriesDB = await getPlaylistEntriesDB();

    const playlistType = playlistId.startsWith("sys:") ? "virtual" : "user";
    const playlistKey = playlistType === "virtual" ? playlistId.split(":")[1] : playlistId;

    if (playlistType === "virtual") {
        if (!ownerId) {
            throw new Error("Owner ID is required for accessing virtual playlists");
        }

        if (playlistKey === "liked") {
            return await getLikedAdventuresByUserId(ownerId, skip, limit);
        }

        if (playlistKey === "history") {
            return await getHistoryEntries(ownerId, skip, limit);
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
};

interface AddResult {
    status: "added" | "already_exists";
}

export const addAdventureToPlaylist = async (playlistId: string, adventureId: string, userId: string, force: boolean): Promise<AddResult> => {
    const playlistEntriesDB = await getPlaylistEntriesDB();

    const existingEntry = await playlistEntriesDB.findOne({ adventureListId: playlistId, adventureId });
    if (existingEntry) {
        if (!force) {
            return { status: "already_exists" };
        }
        //Wenn der EIntrag schon exestiert duplizieren wir ihn, damit er in der Playlist weiter unten nochmal auftaucht
        await playlistEntriesDB.insertOne({
            _id: new ObjectId().toString(),
            adventureListId: playlistId,
            adventureId,
            order: existingEntry.order + 0.0001, // minimal höherer Wert, damit die Reihenfolge erhalten bleibt
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        return { status: "added" };
    }

    await playlistEntriesDB.insertOne({
        _id: new ObjectId().toString(),
        adventureListId: playlistId,
        adventureId,
        order: Date.now(), // neuer Eintrag bekommt aktuellen Timestamp als Order, damit er am Ende der Liste erscheint
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    return { status: "added" };
}


export const hasAccessToPlaylist = async (playlist: string, userId?: string) => {
    const playlistDB = await getPlaylistDB();

    if (playlist.startsWith("sys:")) {
        const [_, type, ownerId] = playlist.split(":");
        if (type === "liked" || type === "history") {
            return userId === ownerId; // nur Besitzer hat Zugriff auf die Liked-Playlist
        }

        throw new Error("Unknown system playlist type");
    }
    const response = await playlistDB.countDocuments({
        _id: playlist,
        $or: [
            { visibility: "public" },
            { visibility: "unlisted" },
            { ownerId: userId }
        ]
    });

    return response > 0;
}