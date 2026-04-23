import type { AdventureSource } from "../schema/AdventuresSchema";
import type { AdventureCategory, AdventureTypeKey } from "./AdventureTypes";
import type { EventSchedule } from "./EventTypes";
import type { GeoLocation } from "./GeoTypes";

export type SeedingStatus = 'pending' | 'approved' | 'rejected';

export interface AdventureSeedData {
    _id: string;
    title: string;
    description: string;
    location?: GeoLocation;
    /** Event-Zeitplanung mit flexibler Dauer */
    schedule: EventSchedule;
    difficulty: 'easy' | 'medium' | 'hard';
    category: AdventureCategory;
    createdAt: Date;
    updatedAt: Date;
    pictureIds: string[];
    tags: AdventureTypeKey[];
    authorId: string;
    draftId?: string; // Optional: Seed-Adventures durchlaufen nicht zwingend den Draft-Prozess
    visibility: 'public' | 'private' | 'unlisted';
    status: SeedingStatus;
    reviewedAt?: Date;
    reviewerId?: string;
    rejectionReason?: string;

    // --- Future Proofing & Seeding ---
    source: AdventureSource;
}

// Interface für Seeding Entscheidungen, von wem und wie das Adventure genehmigt oder abgelehnt wird
export interface SeedingDecision {
    adventureId: string;
    approved: boolean;
    reviewerId: string; // Wer hat die Entscheidung getroffen?
    reason?: string; // Optional: Grund für Ablehnung oder Anmerkungen zur Genehmigung
    reviewedAt: Date;
}

export interface SeedingAdventureWithDecision extends AdventureSeedData {
    decision?: SeedingDecision;
}