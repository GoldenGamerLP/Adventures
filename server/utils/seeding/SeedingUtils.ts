import { getRequestHeaders } from "h3";
import { ObjectId } from "mongodb";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";
import type { SeedingAdventureUploadInput, SeedingDecisionInput } from "~~/shared/schema/SeedingSchema";
import type { Adventure, AdventureSource } from "~~/shared/types/AdventureTypes";
import type { AdventureSeedData, SeedingDecision, SeedingStatus } from "~~/shared/types/SeedingTypes";
import { createAdventure } from "../adventures/AdventureUtils";
import { getCollection } from "../database/DBUtils";
import { createKeyedError } from "../errors/ApiErrorUtils";

const getSeedingApprovalDatabase = async () => getCollection<AdventureSeedData>('seeding_approvals');
const getSeedingAdventureDatabase = async () => getCollection<AdventureSeedData>('seeding_adventures');

export const assertSeedingApiKey = (event: Parameters<typeof getRequestHeaders>[0]) => {
    const headers = getRequestHeaders(event);

    if (!process.env.SEEDING_API_KEY || headers['x-api-key'] !== process.env.SEEDING_API_KEY) {
        throw createKeyedError(401, APP_ERROR_CODES.SEEDING_API_KEY_INVALID);
    }
};

const mapUploadToSeedRecord = (
    input: SeedingAdventureUploadInput,
    pictureIds: string[],
): AdventureSeedData => {
    const now = new Date();

    const normalizedSchedule = {
        type: input.schedule.type,
        estimatedDuration: input.schedule.estimatedDuration,
        isApproximate: input.schedule.isApproximate,
        repeatsAnnually: input.schedule.repeatsAnnually,
        slots: input.schedule.slots,
        startDate: input.schedule.startDate ? input.schedule.startDate.toISOString() : undefined,
        endDate: input.schedule.endDate ? input.schedule.endDate.toISOString() : undefined,
    } as unknown as AdventureSeedData['schedule'];

    const normalizedCategory = input.category as unknown as AdventureSeedData['category'];

    return {
        _id: new ObjectId().toString(),
        title: input.title,
        description: input.description,
        location: input.location,
        schedule: normalizedSchedule,
        difficulty: input.difficulty,
        category: normalizedCategory,
        createdAt: now,
        updatedAt: now,
        pictureIds,
        tags: input.tags as AdventureSeedData['tags'],
        draftId: undefined,
        visibility: input.visibility,
        status: 'pending',
        source: input.source,
    };
};

export const findSeedingAdventureById = async (adventureId: string): Promise<AdventureSeedData | null> => {
    const database = await getSeedingAdventureDatabase();
    return database.findOne({ _id: adventureId });
};

export const listSeedingAdventures = async (status?: SeedingStatus): Promise<AdventureSeedData[]> => {
    const database = await getSeedingAdventureDatabase();
    const query = status ? { status } : {};

    return database
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
};

export const seedingExists = async (title: string): Promise<boolean> => {
    const database = await getSeedingAdventureDatabase();
    const existing = await database.countDocuments({ title });
    return existing > 0;
};

export const createSeedingAdventure = async (input: SeedingAdventureUploadInput, pictureIds: string[]): Promise<AdventureSeedData> => {
    const database = await getSeedingAdventureDatabase();
    const now = new Date();
    const record = mapUploadToSeedRecord(input, pictureIds);

    const result = await database.findOneAndUpdate(
        {
            'source.provider': input.source.provider,
            ...(input.source.provider === 'wikipedia'
                ? { 'source.wikipediaPageId': input.source.wikipediaPageId }
                : { 'source.userId': input.source.userId }),
        },
        {
            $set: {
                ...record,
                status: 'pending',
                reviewedAt: undefined,
                reviewerId: undefined,
                rejectionReason: undefined,
                updatedAt: now,
                createdAt: record.createdAt, // createdAt bleibt erhalten, falls bereits vorhanden
            },
        },
        { upsert: true, returnDocument: 'after' }
    );

    return result ?? record;
};

const buildDecision = (decision: SeedingDecisionInput): SeedingDecision => ({
    adventureId: decision.adventureId,
    approved: decision.approved,
    reviewerId: decision.reviewerId,
    reason: decision.reason,
    reviewedAt: decision.reviewedAt,
});

export const approveOrRejectSeedingAdventure = async (decision: SeedingDecisionInput): Promise<{ seed: AdventureSeedData; adventure?: Adventure; decision: SeedingDecision }> => {
    const seedDatabase = await getSeedingAdventureDatabase();
    const approvalDatabase = await getSeedingApprovalDatabase();
    const seed = await seedDatabase.findOne({ _id: decision.adventureId });

    if (!seed) {
        throw createKeyedError(404, APP_ERROR_CODES.SEEDING_NOT_FOUND);
    }

    if (seed.status !== 'pending') {
        throw createKeyedError(409, APP_ERROR_CODES.SEEDING_ALREADY_REVIEWED);
    }

    const review = buildDecision(decision);
    const nextStatus: SeedingStatus = review.approved ? 'approved' : 'rejected';
    const now = review.reviewedAt;

    const updatedSeed: AdventureSeedData = {
        ...seed,
        status: nextStatus,
        reviewedAt: now,
        reviewerId: review.reviewerId,
        rejectionReason: review.approved ? undefined : review.reason,
        updatedAt: now,
    };

    await seedDatabase.updateOne(
        { _id: seed._id },
        {
            $set: {
                status: updatedSeed.status,
                reviewedAt: updatedSeed.reviewedAt,
                reviewerId: updatedSeed.reviewerId,
                rejectionReason: updatedSeed.rejectionReason,
                updatedAt: updatedSeed.updatedAt,
            },
        }
    );

    await approvalDatabase.updateOne(
        { _id: seed._id },
        { $set: updatedSeed },
        { upsert: true }
    );

    if (!review.approved) {
        return { seed: updatedSeed, decision: review };
    }

    const adventureSource: AdventureSource = updatedSeed.source.provider === 'wikipedia'
        ? {
            ...updatedSeed.source,
            review: {
                reviewerId: review.reviewerId,
                reviewedAt: review.reviewedAt,
                decision: 'approved',
            },
        }
        : updatedSeed.source;

    const adventure = await createAdventure({
        title: updatedSeed.title,
        description: updatedSeed.description,
        location: updatedSeed.location,
        schedule: updatedSeed.schedule,
        difficulty: updatedSeed.difficulty,
        category: updatedSeed.category,
        pictureIds: updatedSeed.pictureIds,
        tags: updatedSeed.tags,
        visibility: 'public', // Seed-Adventures werden immer öffentlich, unabhängig von der ursprünglichen Sichtbarkeit
        source: adventureSource,
        createdAt: new Date(), // Das tatsächliche Erstellungsdatum des Adventures ist das Datum der Genehmigung
    });

    return {
        seed: updatedSeed,
        adventure,
        decision: review,
    };
};
