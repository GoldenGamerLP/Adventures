import type {
    AdventureDraft,
    AdventureDraftWithMeta,
    AdventureDraftWithPictures,
    CreateDraftInput,
    UpdateDraftInput
} from "#shared/types/DraftTypes";
import { ObjectId } from "mongodb";
import { DRAFT_CONFIG } from "~~/shared/constants/Constants";
import { calculateCompletionPercent } from "~~/shared/utils/SharedUtils";
import { getCollection } from "../database/DBUtils";
import { markPicturesAsPublished } from "../pictures/PictureUtils";
import { publishFromDraft } from "./AdventureUtils";

const getDraftDB = async () => getCollection<AdventureDraft>('adventure_drafts');

/**
 * Erstellt TTL-Index für automatische Draft-Löschung
 * Sollte beim Server-Start aufgerufen werden
 */
export async function ensureDraftIndexes(): Promise<void> {
    const draftDB = await getDraftDB();

    // TTL-Index: MongoDB löscht Dokumente automatisch wenn expiresAt < now
    await draftDB.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 }
    );

    // Index für schnelle User-Abfragen
    await draftDB.createIndex({ authorId: 1 });

    console.log('[DraftUtils] Draft indexes created');
}

export async function canCreateNewDraft(authorId: string): Promise<boolean> {
    const draftDB = await getDraftDB();

    const existingCount = await draftDB.countDocuments({
        authorId
    });

    return existingCount < DRAFT_CONFIG.MAX_DRAFTS_PER_USER;
}

/**
 * Erstellt einen neuen Draft für einen User
 */
export async function createDraft(input: CreateDraftInput): Promise<AdventureDraft | null> {
    const now = new Date();

    const draft: AdventureDraft = {
        _id: new ObjectId().toString(),
        state: 'draft',
        authorId: input.authorId,
        formData: {},
        pictureIds: [],
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(now.getTime() + DRAFT_CONFIG.TTL_MS),
    };

    const draftDB = await getDraftDB();
    const result = await draftDB.insertOne(draft);

    if (!result.acknowledged) return null;

    return draft;
}

/**
 * Holt einen Edit-Draft für ein Adventure oder erstellt einen neuen, wenn keiner existiert
 * @param adventureId 
 * @param authorId 
 * @returns 
 */
export async function getOrCreateNewEditableDraft(adventureId: string, authorId: string): Promise<AdventureDraft> {
    const adventure = await getAdventureById(adventureId);

    if (!adventure) {
        throw createError({ statusCode: 404, statusMessage: 'Adventure not found' });
    }

    const draftDB = await getDraftDB();
    const existingDraft = await draftDB.findOne({
        _id: adventure.draftId,
        authorId,
        state: 'published', // Nur veröffentlichte Drafts sind gültige Edit-Drafts
    });

    if (existingDraft) {
        return existingDraft;
    }

    const newDraft = convertAdventureToDraft(adventure);

    await draftDB.insertOne(newDraft);

    return newDraft;
}

/**
 * Holt einen Draft anhand der ID
 * Validiert optional den Owner
 */
export async function getDraftById(
    draftId: string,
    authorId?: string
): Promise<AdventureDraft | null> {
    const query: Partial<AdventureDraft> = { _id: draftId };

    if (authorId) {
        query.authorId = authorId;
    }

    const draftDB = await getDraftDB();
    return draftDB.findOne(query);
}

/**
 * Holt einen Draft mit zusätzlichen Meta-Informationen
 */
export async function getDraftWithMeta(
    draftId: string,
    authorId: string
): Promise<AdventureDraftWithPictures | null> {
    const draft = await getDraftById(draftId, authorId);

    if (!draft) return null;

    const draftWithMeta: AdventureDraftWithMeta = enrichDraftWithMeta(draft);
    const draftWithPictures: AdventureDraftWithPictures = await enrichDraftWithPictures(draftWithMeta);

    return draftWithPictures;
}

const enrichDraftWithPictures = async (draft: AdventureDraftWithMeta): Promise<AdventureDraftWithPictures> => {
    const pictures = await getPicturesByDraftId(draft._id);

    return {
        ...draft,
        pictures,
    };
};

/**
 * Holt alle Drafts eines Users
 */
export async function getDraftsByAuthor(authorId: string): Promise<AdventureDraft[]> {
    const draftDB = await getDraftDB();
    return draftDB
        .find({ authorId, state: 'draft' })
        .sort({ updatedAt: -1 })
        .toArray();
}

/**
 * Aktualisiert einen Draft
 * Verlängert automatisch die Ablaufzeit
 */
export async function updateDraft(
    draftId: string,
    authorId: string,
    input: UpdateDraftInput
): Promise<AdventureDraft | null> {
    const now = new Date();

    const draft = await getDraftById(draftId, authorId);

    if (!draft) {
        return null;
    }

    const draftDB = await getDraftDB();
    const result = await draftDB.findOneAndUpdate(
        { _id: draftId, authorId },
        {
            $set: {
                ...input,
                updatedAt: now,
                // Verlängere TTL bei jedem Update je nach Status (Drafts haben längere TTL, Edit-Drafts kürzere TTL)
                expiresAt: new Date(now.getTime() + (draft.state === 'draft' ? DRAFT_CONFIG.TTL_MS : DRAFT_CONFIG.EDIT_TTL_MS)),
            },
        },
        { returnDocument: 'after' }
    );

    return result;
}

/**
 * Fügt ein Bild zum Draft hinzu
 */
export async function addPictureToDraft(
    draftId: string,
    authorId: string,
    pictureId: string
): Promise<AdventureDraft | null> {
    const draft = await getDraftById(draftId, authorId);

    if (!draft) return null;

    if (draft.pictureIds.length >= DRAFT_CONFIG.MAX_PICTURES_PER_DRAFT) {
        throw createError({
            statusCode: 400,
            statusMessage: `Maximale Anzahl von ${DRAFT_CONFIG.MAX_PICTURES_PER_DRAFT} Bildern erreicht`,
        });
    }

    const now = new Date();
    const draftDB = await getDraftDB();

    return draftDB.findOneAndUpdate(
        { _id: draftId, authorId },
        {
            $addToSet: { pictureIds: pictureId },
            $set: {
                updatedAt: now,
                expiresAt: new Date(now.getTime() + DRAFT_CONFIG.TTL_MS),
            },
        },
        { returnDocument: 'after' }
    );
}

/**
 * Entfernt ein Bild aus dem Draft
 */
export async function removePictureFromDraft(
    draftId: string,
    authorId: string,
    pictureId: string
): Promise<AdventureDraft | null> {
    const draftDb = await getDraftDB();
    const now = new Date();

    const result = await draftDb.findOneAndUpdate(
        { _id: draftId, authorId },
        {
            $pull: { pictureIds: pictureId },
            $set: {
                updatedAt: now,
            },
        },
        { returnDocument: 'after' }
    );

    return result;
}

/**
 * Löscht einen Draft manuell
 */
export async function deleteDraft(
    draftId: string,
    authorId: string
): Promise<boolean> {
    const draftDB = await getDraftDB();
    const result = await draftDB.deleteOne({
        _id: draftId,
        authorId
    });

    return result.deletedCount > 0;
}

/**
 * Prüft ob ein Draft existiert und dem User gehört
 */
export async function validateDraftOwnership(
    draftId: string,
    authorId: string
): Promise<boolean> {
    const draftDB = await getDraftDB();
    const count = await draftDB.countDocuments({
        _id: draftId,
        authorId
    });

    return count > 0;
}
/**
 * Veröffentliche eine Draft als Adventure, Draft wird danach Archiviert, sodass wenn man das Adventure Editieren möchte, einfach der alte Draft wiederhergestellt wird.
 * @param draftId 
 * @param authorId 
 */
export async function publishDraft(
    draftId: string,
    authorId: string
): Promise<Adventure> {
    const draft = await getDraftById(draftId, authorId);
    if (!draft) {
        throw createError({ statusCode: 404, statusMessage: 'Draft not found' });
    }

    const draftDB = await getDraftDB();
    await markPicturesAsPublished(draft);
    const adventure = await publishFromDraft(draft);
    await draftDB.deleteOne({ _id: draftId, authorId });

    return adventure;
}

// ============= Helper Functions =============


function convertAdventureToDraft(adventure: Adventure): AdventureDraft {
    const now = new Date();

    const draft: AdventureDraft = {
        _id: adventure.draftId,
        state: 'published',
        authorId: adventure.authorId,
        formData: {
            title: adventure.title,
            description: adventure.description,
            location: adventure.location,
            difficulty: adventure.difficulty,
            category: adventure.category,
            tags: adventure.tags,
            schedule: adventure.schedule,
            visibility: adventure.visibility,
        },
        pictureIds: adventure.pictureIds,
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(now.getTime() + DRAFT_CONFIG.EDIT_TTL_MS), // Kürzere TTL für Edit-Drafts
    };

    return draft;
}

/**
 * Reichert Draft mit Meta-Informationen an
 */
function enrichDraftWithMeta(draft: AdventureDraft): AdventureDraftWithMeta {
    const now = Date.now();
    const expiresAt = new Date(draft.expiresAt).getTime();

    return {
        ...draft,
        expiresInSeconds: Math.max(0, Math.floor((expiresAt - now) / 1000)),
        pictureCount: draft.pictureIds.length,
        completionPercent: calculateCompletionPercent(draft),
    };
}


