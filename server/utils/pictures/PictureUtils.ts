import type {
    DraftPicture,
    Picture,
    PublishedPicture,
} from "#shared/types/PictureTypes";
import { ObjectId } from "mongodb";
import { DRAFT_CONFIG } from "~~/shared/constants/Constants";
import database from "../database/DBUtils";
import { deleteFile, getFileStream, uploadFileFromWeb } from "../database/FileUtils";

const pictureDatabase = database.collection<Picture>("pictures");

/**
 * Erstellt Indexes für Picture-Collection
 */
export async function ensurePictureIndexes(): Promise<void> {
    // Index für Draft-Bilder (für Cleanup)
    await pictureDatabase.createIndex({ status: 1, draftId: 1 });

    // Index für Adventure-Bilder
    await pictureDatabase.createIndex({ status: 1, adventureId: 1 });

    // Index für User-Abfragen
    await pictureDatabase.createIndex({ uploadedBy: 1 });

    // TTL-Index nicht erstellen um cronjob-basierten Cleanup zu ermöglichen da gridfs delete operationen nicht mit TTL-Index kompatibel sind
    // TODO: In Zukunft

    console.log('[PictureUtils] Picture indexes created');
}

/**
 * Lädt Bilder für einen Draft hoch
 * Bilder werden mit status: 'draft' erstellt
 */
const uploadDraftPictures = async (
    draftId: string,
    userId: string,
    files: File[]
): Promise<DraftPicture[]> => {
    if (!files || files.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Keine Dateien zum Hochladen',
        });
    }

    const uploadedPictures: DraftPicture[] = [];

    for (const file of files) {
        const fileId = new ObjectId();

        // Upload zu GridFS
        await uploadFileFromWeb(fileId, file);

        // Erstelle Picture-Dokument
        const picture: DraftPicture = {
            _id: new ObjectId().toString(),
            fileId: fileId.toString(),
            status: 'draft',
            draftId,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            meta: {
                contentType: file.type,
                fileName: file.name,
                lastModified: new Date(file.lastModified).toISOString(),
                size: file.size,
            },
            ttl: new Date(Date.now() + DRAFT_CONFIG.TTL_MS), // Ablaufzeitpunkt für automatische Löschung
        };

        await pictureDatabase.insertOne(picture);
        uploadedPictures.push(picture);
    }

    return uploadedPictures;
};

const removeDecorationPictures = async (userId: string, type: 'profile' | 'background') => {
    const result = await pictureDatabase.find({ uploadedBy: userId, status: type }).toArray();

    if (result) {
        await Promise.all(result.map((img) => deleteFile(new ObjectId(img.fileId))));
        await pictureDatabase.deleteMany({ uploadedBy: userId, status: type });
    }

    return result;
};

const storeDecorationalUserPicture = async (
    userId: string,
    file: File | File[],
    status: 'profile' | 'background',
): Promise<Picture[]> => {
    const oldImages = await pictureDatabase.find({ uploadedBy: userId, status }).toArray();

    if (oldImages.length > 0) {
        // Lösche alte Bilder aus GridFS
        for (const img of oldImages) {
            console.log(`Deleting old ${status} picture for user ${userId}: ${img._id} (fileId: ${img.fileId})`);
            try {
                await deleteFile(new ObjectId(img.fileId));
            } catch (error) {
                console.error(`Failed to delete old picture file ${img.fileId}:`, error);
            }
        }

        // Lösche alte Bild-Dokumente
        await pictureDatabase.deleteMany({ uploadedBy: userId, status });
    }

    const uploadedPictures: Picture[] = [];
    for (const f of Array.isArray(file) ? file : [file]) {
        const fileId = new ObjectId();

        // Upload zu GridFS
        await uploadFileFromWeb(fileId, f);
        // Erstelle Picture-Dokument
        const picture: Picture = {
            _id: new ObjectId().toString(),
            fileId: fileId.toString(),
            status,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            meta: {
                contentType: f.type,
                fileName: f.name,
                lastModified: new Date(f.lastModified).toISOString(),
                size: f.size,
            },
        };

        uploadedPictures.push(picture);
    }

    await pictureDatabase.insertMany(uploadedPictures);

    return uploadedPictures;
};

/**
 * Promotet Draft-Bilder zu Published-Bildern
 * Wird aufgerufen wenn ein Adventure veröffentlicht wird
 */
const promotePicturesToPublished = async (
    draftId: string,
    adventureId: string,
    pictureIds: string[]
): Promise<number> => {
    const now = new Date().toISOString();

    const result = await pictureDatabase.updateMany(
        {
            _id: { $in: pictureIds },
            status: 'draft',
            draftId,
        },
        {
            $set: {
                status: 'published',
                adventureId,
                publishedAt: now,
            },
            $unset: {
                draftId: '',
            },
        }
    );

    return result.modifiedCount;
};

/**
 * Holt alle Bilder für einen Draft
 */
const getPicturesByDraftId = async (draftId: string): Promise<DraftPicture[]> => {
    const pictures = await pictureDatabase
        .find({ draftId } as Partial<DraftPicture>)
        .toArray();

    return pictures as DraftPicture[];
};

/**
 * Holt alle veröffentlichten Bilder für ein Adventure
 */
const getPicturesByAdventureId = async (adventureId: string): Promise<PublishedPicture[]> => {
    const pictures = await pictureDatabase
        .find({ status: 'published', adventureId } as Partial<PublishedPicture>)
        .toArray();

    return pictures as PublishedPicture[];
};

const markPicturesAsPublished = async (draft: { _id: string }): Promise<void> => {
    const now = new Date().toISOString();
    await pictureDatabase.updateMany(
        { status: 'draft', draftId: draft._id },
        {
            $set: {
                status: 'published',
                publishedAt: now,
            },
        }
    );
};

/**
 * Holt ein einzelnes Bild anhand der ID
 */
const getPictureById = async (pictureId: string): Promise<Picture | null> => {
    return pictureDatabase.findOne({ _id: pictureId });
};

/**
 * Löscht ein Draft-Bild (nur status: 'draft')
 */
const deleteDraftPicture = async (
    pictureId: string,
    draftId: string,
    userId: string
): Promise<boolean> => {
    const picture = await pictureDatabase.findOne({
        _id: pictureId,
        status: 'draft',
        draftId,
        uploadedBy: userId,
    } as Partial<DraftPicture>);

    if (!picture) return false;

    // Lösche Datei aus GridFS
    await deleteFile(new ObjectId(picture.fileId));

    // Lösche Dokument
    const result = await pictureDatabase.deleteOne({ _id: pictureId });

    return result.deletedCount > 0;
};

/**
 * Löscht alle Draft-Bilder für einen Draft
 * Wird bei Draft-Löschung oder -Ablauf aufgerufen
 */
const deleteAllDraftPictures = async (draftId: string): Promise<number> => {
    const pictures = await getPicturesByDraftId(draftId);

    // Lösche alle Dateien aus GridFS
    for (const picture of pictures) {
        try {
            await deleteFile(new ObjectId(picture.fileId));
        } catch (error) {
            console.error(`Failed to delete file ${picture.fileId}:`, error);
        }
    }

    // Lösche alle Dokumente
    const result = await pictureDatabase.deleteMany({
        status: 'draft',
        draftId
    } as Partial<DraftPicture>);

    return result.deletedCount;
};

/**
 * Öffnet einen Download-Stream für ein Bild
 */
const openDownloadStreamForPicture = (picture: Picture) => {
    return getFileStream(new ObjectId(picture.fileId));
};

// ============= Legacy Functions (für Abwärtskompatibilität) =============

/**
 * @deprecated Verwende uploadDraftPictures stattdessen
 */
const uploadPictures = async (
    bucketId: string,
    user: string,
    entryId?: string,
    files?: File[]
) => {
    console.warn('uploadPictures is deprecated, use uploadDraftPictures instead');

    if (!files || files.length === 0) {
        throw new Error('No files provided for upload');
    }

    // Fallback auf alte Logik wenn nötig
    for (const file of files) {
        const objId = new ObjectId();
        await uploadFileFromWeb(objId, file);
        await addPictureLegacy(objId, bucketId, user, entryId, {
            filename: file.name,
            filetype: file.type,
            lastModified: file.lastModified,
            size: file.size,
        });
    }
};

const addPictureLegacy = async (
    fileId: ObjectId,
    bucketId: string,
    user: string,
    entryId: string | undefined,
    fileMeta: { filename: string; filetype: string; lastModified: number; size: number }
) => {
    // Legacy-Format
    const legacyPicture = {
        _id: new ObjectId().toString(),
        fileId: fileId.toString(),
        bucketId,
        entryId,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user,
        meta: {
            contentType: fileMeta.filetype,
            fileName: fileMeta.filename,
            lastModified: new Date(fileMeta.lastModified).toISOString(),
            size: fileMeta.size,
        },
    };

    await pictureDatabase.insertOne(legacyPicture as any);
    return legacyPicture;
};

const getFileFromPictureId = (pictureId: string) => {
    return pictureDatabase.findOne({ _id: pictureId });
};

const getPictureFromBucket = async (bucketId: string): Promise<Picture[]> => {
    const results = await pictureDatabase.find(
        { bucketId } as any,
        { sort: { uploadedAt: -1 } }
    ).toArray();
    return results;
};

export {
    deleteAllDraftPictures, deleteDraftPicture, getFileFromPictureId, getPictureById, getPictureFromBucket, getPicturesByAdventureId, getPicturesByDraftId, markPicturesAsPublished, openDownloadStreamForPicture, promotePicturesToPublished, removeDecorationPictures, storeDecorationalUserPicture,
    // Neue API
    uploadDraftPictures,
    // Legacy API
    uploadPictures
};

