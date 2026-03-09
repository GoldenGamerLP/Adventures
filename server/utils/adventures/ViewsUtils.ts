import type { Adventure, AdventureViewCounter, AdventureViewRecord, EnrichedViewRecord } from '~~/shared/types/AdventureTypes';
import database from '../database/DBUtils';

const viewRecords = database.collection<AdventureViewRecord>('adventure_view_records');
const viewCounters = database.collection<AdventureViewCounter>('adventure_view_counters');

// Konfig
const MAX_GUEST_VIEWS_PER_ADVENTURE = 100; // Danach keine neuen Gäste mehr tracken
const VIEW_COOLDOWN_MS = 5 * 60 * 1000;      // 5 Min Cooldown zwischen Views

export const ensureViewIndexes = async (): Promise<void> => {
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
    return viewRecords
        .find({ userId })
        .sort({ firstViewedAt: -1 })
        .limit(limit)
        .toArray();
};

export const getEnrichedRecentlyViewed = async (
    userId: string,
    limit = 20
): Promise<EnrichedViewRecord[]> => {
    const records = await getRecentlyViewed(userId, limit);
    return enrichViewRecords(records);
}


const enrichViewRecords = async (records: AdventureViewRecord[]): Promise<EnrichedViewRecord[]> => {
    const adventureIds = records.map(r => r.adventureId);
    const adventures = await database.collection<Adventure>('adventures')
        .find({ _id: { $in: adventureIds } })
        .toArray();

    const adventureMap = new Map(adventures.map(a => [a._id, a]));

    return records
        .map(r => {
            const adventure = adventureMap.get(r.adventureId);
            if (!adventure) return null; // Sollte nicht passieren
            return { ...adventure, view: r };
        })
        .filter((x): x is EnrichedViewRecord => x !== null);
}