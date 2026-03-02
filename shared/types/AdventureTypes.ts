import type { GeoLocation } from "#shared/types/GeoTypes";
import type { EventSchedule } from "#shared/types/EventTypes";
import type { UserSummary } from "./UserProfileTypes";

//Interface for protoyping purposes
export interface Adventure {
    _id: string;
    title: string;
    description: string;
    location?: GeoLocation;
    /** Event-Zeitplanung mit flexibler Dauer */
    schedule?: EventSchedule;
    difficulty: 'easy' | 'medium' | 'hard';
    category: AdventureCategory;
    createdAt: Date;
    updatedAt: Date;
    pictureIds: string[];
    tags: string[];
    authorId: string;
    draftId: string;
    visibility: 'public' | 'private' | 'unlisted';
}

export interface AdventureWithMeta extends Adventure {
    author: UserSummary;
    location?: GeoLocation & {
        distance?: number; // in meters
    };
    viewCount: AdventureViewCounter;
    isLikedByUser: boolean;
}

export enum AdventureCategory {
    INDOOR = 'indoor',
    OUTDOOR = 'outdoor',
    MIXED = 'mixed',
}


export interface AdventureFilter {
    location?: string | 'near_me';
    difficulty?: 'easy' | 'medium' | 'hard';
    duration?: { min: number; max: number };
    distance?: { min: number; max: number };
    tags?: string[];
    category?: AdventureCategory;
    sort?: 'popular' | 'new' | 'recommended';
}

//
// View-Tracking Interfaces
//

export interface AdventureViewRecord {
    _id?: string;
    adventureId: string;

    // Entweder userId ODER fingerprint — nie beides
    userId?: string;
    fingerprint?: string;

    viewCount: number;
    firstViewedAt: string;   // ISO
    lastViewedAt: string;    // ISO
}

/**
 * Aggregierter Counter pro Adventure — wird bei jedem View inkrementiert
 * Vermeidet teure Aggregationen bei der Anzeige
 */
export interface AdventureViewCounter {
    _id?: string;
    adventureId: string;
    totalViews: number;
    uniqueUsers: number;
    uniqueGuests: number;
}

export type EnrichedViewRecord = Adventure & { view: AdventureViewRecord };
