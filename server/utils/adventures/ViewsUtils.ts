import { MAX_GUEST_VIEWS_PER_ADVENTURE, VIEW_COOLDOWN_MS } from '~~/shared/constants/Constants';
import type { AdventureViewCounter, AdventureViewRecord, EnrichedViewRecord } from '~~/shared/types/AdventureTypes';
import { getCollection } from '../database/DBUtils';

const getViewRecordsDB = () => getCollection<AdventureViewRecord>('adventure_view_records');
const getViewCountersDB = () => getCollection<AdventureViewCounter>('adventure_view_counters');


export const ensureViewIndexes = async (): Promise<void> => {
    const viewRecords = await getViewRecordsDB();
    const viewCounters = await getViewCountersDB();

    // Compound-Index für schnelle Lookups - partialFilterExpression statt sparse
    // um null-Werte korrekt zu ignorieren
    await viewRecords.createIndex(
        { adventureId: 1, userId: 1 },
        { unique: true, partialFilterExpression: { userId: { $exists: true, $type: 'string' } } }
    );
    await viewRecords.createIndex(
        { adventureId: 1, fingerprint: 1 },
        { unique: true, partialFilterExpression: { fingerprint: { $exists: true, $type: 'string' } } }
    );
    // Counter: ein Dokument pro Adventure
    await viewCounters.createIndex(
        { adventureId: 1 },
        { unique: true }
    );

    console.log('[Views] Indexes created');
};

/**
 * Loggt einen View — mit Cooldown um Spam zu verhindern.
 * Aktualisiert sowohl den individuellen Record als auch den globalen Counter.
 */
export const logView = async (
    adventureId: string,
    identifier: { userId: string } | { fingerprint: string }
): Promise<void> => {
    const viewRecords = await getViewRecordsDB();
    const viewCounters = await getViewCountersDB();

    const now = new Date().toISOString();
    const isUser = 'userId' in identifier;

    const filter = isUser
        ? { adventureId, userId: identifier.userId }
        : { adventureId, fingerprint: identifier.fingerprint };

    // 1. Cooldown-Check und atomares Update/Insert
    const existing = await viewRecords.findOne(filter);

    if (existing) {
        const lastView = new Date(existing.lastViewedAt).getTime();
        if (Date.now() - lastView < VIEW_COOLDOWN_MS) {
            return; // Cooldown — nicht zählen
        }

        if (!isUser) {
            const guestCount = await viewRecords.countDocuments({
                adventureId,
                fingerprint: { $exists: true, $type: 'string' },
            });

            //Maximale anzahl an Gästen angeschaut / Verhindern von pushen von views
            if (guestCount >= MAX_GUEST_VIEWS_PER_ADVENTURE) return;
        }

        // Inkrementiere bestehenden Record
        await viewRecords.updateOne(filter, {
            $inc: { viewCount: 1 },
            $set: { lastViewedAt: now },
        });
    }

    //Kein View Record - atomares upsert um Race Conditions zu vermeiden
    if (!existing) {
        // Neuer Record — bei Gästen erst Limit prüfen
        if (!isUser) {
            const guestCount = await viewRecords.countDocuments({
                adventureId,
                fingerprint: { $exists: true, $type: 'string' },
            });
            if (guestCount >= MAX_GUEST_VIEWS_PER_ADVENTURE) {
                return; // Gast-Limit erreicht
            }
        }

        // Verwende updateOne mit upsert statt insertOne um Race Conditions zu vermeiden
        await viewRecords.updateOne(
            filter,
            {
                $setOnInsert: {
                    ...filter,
                    firstViewedAt: now,
                },
                $set: { lastViewedAt: now },
                $inc: { viewCount: 1 },
            },
            { upsert: true }
        );
    }

    // 2. Globalen Counter atomar inkrementieren
    const counterUpdate: Record<string, any> = {
        $inc: { totalViews: 1 },
    };

    // Unique-Count nur bei neuem Record erhöhen
    if (!existing) {
        counterUpdate.$inc[isUser ? 'uniqueUsers' : 'uniqueGuests'] = 1;
    }

    await viewCounters.updateOne(
        { adventureId },
        counterUpdate,
        { upsert: true }
    );
};

/**
 * Holt den View-Counter — O(1), kein Aggregieren nötig
 */
export const getViewCounter = async (
    adventureId: string
): Promise<AdventureViewCounter> => {
    const viewCounters = await getViewCountersDB();

    const counter = await viewCounters.findOne({ adventureId });
    return counter ?? {
        adventureId,
        totalViews: 0,
        uniqueUsers: 0,
        uniqueGuests: 0,
    };
};

/**
 * Holt die letzten Views eines Users (für "Kürzlich angesehen")
 */
export const getRecentlyViewed = async (
    userId: string,
    limit = 20
): Promise<AdventureViewRecord[]> => {
    const viewRecords = await getViewRecordsDB();

    return viewRecords
        .find({ userId })
        .sort({ firstViewedAt: -1 })
        .limit(limit)
        .toArray();
};

export const hydrateHistoryAdventuresList = async (list: VirtualList): Promise<AdventureListWithMeta> => {
    const viewRecords = await getViewRecordsDB();

    const userId = list.ownerId;

    const entryCount = await viewRecords.countDocuments({ userId });
    const result = await viewRecords.aggregate([
        { $match: { userId } },
        { $sort: { lastViewedAt: -1 } },
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

    const previewImages = result.length > 0 ? result[0]!.images : [];
    const owner = await getUserById(userId);

    return { ...list, entryCount, previewImages, owner: owner! };
};

export const getHistoryEntries = async (userId: string, skip: number, limit: number): Promise<AdventureListEntry[]> => {
    const viewRecords = await getViewRecordsDB();

    const records = await viewRecords.aggregate([
        { $match: { userId } },
        { $sort: { lastViewedAt: -1 } },
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

    return records.map(entry => ({
        _id: entry._id,
        adventureListId: entry.adventureListId,
        adventureId: entry.adventureId,
        order: entry.order,
        createdAt: entry.lastViewedAt,
        updatedAt: entry.firstViewedAt,
        populatedAdventure: entry.adventureDetails,
    }));
};

export const getEnrichedRecentlyViewed = async (
    userId: string,
    limit = 20
): Promise<EnrichedViewRecord[]> => {
    const viewRecords = await getViewRecordsDB();

    const result = viewRecords.aggregate([
        { $match: { userId } },
        { $sort: { firstViewedAt: -1 } },
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
    ]);

    const records = await result.toArray();

    return records.map(r => ({
        ...r.adventureDetails,
        view: {
            adventureId: r.adventureId,
            userId: r.userId,
            viewCount: r.viewCount,
            firstViewedAt: r.firstViewedAt,
            lastViewedAt: r.lastViewedAt,
        }
    }));
}