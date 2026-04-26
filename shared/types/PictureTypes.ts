/**
 * Status eines Bildes im System
 * - draft: Temporär hochgeladen, noch nicht veröffentlicht
 * - published: Teil eines veröffentlichten Adventures
 */
export type PictureStatus = 'draft' | 'published' | 'profile' | 'background';

/**
 * Gemeinsame Basis-Felder für alle Picture-Typen
 */
interface PictureBase {
    _id: string;

    /** GridFS File-ID */
    fileId: string;

    /** Optionaler GridFS Bucket-Name (Standard: uploads) */
    bucketId?: string;


    /** User der das Bild hochgeladen hat */
    uploadedBy: string;

    /** Upload-Zeitpunkt (ISO string) */
    uploadedAt: string;

    /** Metadaten der Originaldatei */
    meta: PictureMeta;

    /** Status des Bildes */
    status: PictureStatus;

}

/**
 * Metadaten eines Bildes
 */
export interface PictureMeta {
    contentType: string;
    fileName: string;
    lastModified: string;
    size: number;
}

/**
 * Bild im Draft-Status (noch nicht veröffentlicht)
 * Gehört zu einem AdventureDraft
 */
export interface DraftPicture extends PictureBase {
    status: 'draft';

    /** ContentId - Eindeutige ID die auf entweder ein Draft oder Adventure zeigt, Draft & Adventure haben die gleiche Id. */
    contentId: string;

    ttl: Date; // Zeit in Sekunden bis das Bild automatisch gelöscht wird (für TTL-Index)
}

export interface UserSourcePicture extends PictureBase {
    status: 'profile' | 'background';
}

/**
 * Veröffentlichtes Bild (Teil eines Adventures)
 */
export interface PublishedPicture extends PictureBase {
    status: 'published';

    /** ContentId - Eindeutige ID die auf entweder ein Draft oder Adventure zeigt, Draft & Adventure haben die gleiche Id. */
    contentId: string;

    /** Zeitpunkt der Veröffentlichung */
    publishedAt: string;
}

export type Picture = DraftPicture | PublishedPicture | UserSourcePicture;

/**
 * Type Guard für DraftPicture
 */
export function isDraftPicture(picture: Picture): picture is DraftPicture {
    return picture.status === 'draft';
}

/**
 * Type Guard für PublishedPicture
 */
export function isPublishedPicture(picture: Picture): picture is PublishedPicture {
    return picture.status === 'published';
}

export function isUserSourcePicture(picture: Picture): picture is UserSourcePicture {
    return picture.status === 'profile' || picture.status === 'background';
}

/**
 * Input für Bild-Upload (ohne generierte Felder)
 */
export interface CreatePictureInput {
    fileId: string;
    uploadedBy: string;
    meta: PictureMeta;
}

/**
 * Legacy-Kompatibilität: Alte Picture-Struktur
 * @deprecated Verwende Picture (Discriminated Union) stattdessen
 */
export interface LegacyPicture {
    _id?: string;
    fileId: string;
    bucketId: string;
    entryId?: string;
    uploadedAt: string;
    uploadedBy: string;
    meta: {
        contentType: string;
        fileName: string;
        lastModified: string;
        size: number;
    };
}