import type { DraftPicture } from '#shared/types/PictureTypes';
import type { DraftFormInput } from '../schema/DraftSchema';
import type { AdventureCategory } from './AdventureTypes';
import type { EventSchedule } from './EventTypes';
import type { GeoLocation } from './GeoTypes';

/**
 * Draft status für Picture und Adventure-Drafts
 * 
 * - 'draft': Noch nicht veröffentlicht, kann bearbeitet und gelöscht werden
 * - 'published': Wird nicht mehr als Draft gelistet, sondern nur vorübergehend als Referenz um etwas zu Editieren. Hat kürzere ttl als Drafts, wird automatisch gelöscht wenn die Bearbeitung abgeschlossen ist.
 */
export type DraftStatus = 'draft' | 'published';

/**
 * Formular-Daten die im Draft gespeichert werden
 * Alle Felder optional da Draft jederzeit gespeichert werden kann
 */
export interface AdventureDraftFormData {
    title?: string;
    description?: string;
    location?: GeoLocation;
    difficulty?: 'easy' | 'medium' | 'hard';
    category?: AdventureCategory;
    tags?: string[];
    /** Event-Zeitplanung (ersetzt date/duration) */
    schedule: EventSchedule;
    visibility?: 'public' | 'private' | 'unlisted';
}


/**
 * Adventure Draft - temporärer Entwurf vor Veröffentlichung
 * Wird automatisch nach expiresAt gelöscht (MongoDB TTL Index)
 */
export interface AdventureDraft {
    _id: string;

    state: DraftStatus;

    /** User der den Draft erstellt hat */
    authorId: string;

    /** Formular-Daten (teilweise ausgefüllt) */
    formData: DraftFormInput;

    /** IDs der hochgeladenen Bilder */
    pictureIds: string[];

    /** Erstellungszeitpunkt */
    createdAt: Date;

    /** Letztes Update */
    updatedAt: Date;

    /** Ablaufzeitpunkt für TTL-Index (automatische Löschung) */
    expiresAt: Date;
}

/**
 * Daten für Draft-Erstellung
 */
export type CreateDraftInput = Pick<AdventureDraft, 'authorId'>;

/**
 * Daten für Draft-Update (alle Felder optional außer updatedAt)
 */
export type UpdateDraftInput = Partial<Pick<AdventureDraft, 'formData' | 'pictureIds'>>;

/**
 * Draft mit berechneten Feldern für Frontend
 */
export interface AdventureDraftWithMeta extends AdventureDraft {
    /** Verbleibende Zeit bis zur Löschung in Sekunden */
    expiresInSeconds: number;

    /** Anzahl der hochgeladenen Bilder */
    pictureCount: number;

    /** Fortschritt in Prozent (basierend auf ausgefüllten Pflichtfeldern) */
    completionPercent: number;
}

export interface AdventureDraftWithPictures extends AdventureDraft {
    pictures: DraftPicture[];
}
