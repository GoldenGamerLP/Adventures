import type { EventSchedule } from "#shared/types/EventTypes";
import type { GeoLocation } from "#shared/types/GeoTypes";
import type { UserSummary } from "./UserProfileTypes";

export interface AdventureSourceReview {
    reviewerId: string;
    reviewedAt: Date;
    decision: 'approved' | 'rejected';
    reason?: string;
}

export interface AdventureSourceBase {
    provider: 'user' | 'wikipedia';
}

export interface UserAdventureSource extends AdventureSourceBase {
    provider: 'user';
    userId: string; // ID des Users, der das Adventure erstellt hat
}

export interface WikipediaAdventureSource extends AdventureSourceBase {
    provider: 'wikipedia';
    wikipediaPageId: string; // z.B. "Q12345"
    externalUrl?: string;    // z.B. Link zum Original
    attribution?: string;    // Wichtig für ODbL / CC-Lizenzen
    review?: AdventureSourceReview;
}

export type AdventureSource = UserAdventureSource | WikipediaAdventureSource;

//Interface for protoyping purposes
export interface Adventure {
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
    //Draft id ist nun redundant da DraftId und AdventureId immer gleich sind.
    //draftId?: string; // Optional: Seed-Adventures durchlaufen nicht zwingend den Draft-Prozess
    visibility: 'public' | 'private' | 'unlisted';

    // --- Future Proofing & Seeding ---
    source: AdventureSource;
}

export interface AdventureWithMeta extends Adventure {
    author: UserSummary;
    location?: GeoLocation & {
        distance?: number; // in meters
    };
    viewCount: AdventureViewCounter;
    isLikedByUser: boolean;
    likesCount: number;
    adventureListIds: string[]; // IDs der Playlists, in denen dieses Adventure ist (nur für eingeloggte User)
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


export const SELECTOR_ICON_KEYS = [
    // Outdoor
    'Footprints', 'Bike', 'MountainSnow', 'Mountain', 'Waves', 'Tent', 'Fish', 'Leaf', 'Sailboat',
    // Indoor / Sport
    'Dumbbell', 'Swords', 'Gamepad2', 'GraduationCap',
    // Creative
    'Camera', 'Palette', 'Ticket',
    // Social / Events
    'Music', 'PartyPopper', 'Tv', 'CookingPot', 'Users',
    // Travel
    'Car', 'Landmark', 'Backpack',
    // Misc
    'Headset',
] as const;

export type SelectorIconKey = typeof SELECTOR_ICON_KEYS[number];

export interface AdventureType {
    key: string;
    label: string;
    iconKey: SelectorIconKey;
    category: 'outdoor' | 'indoor' | 'social' | 'creative' | 'travel';
}

export const ADVENTURE_TYPES: AdventureType[] = [
    // Outdoor
    { key: 'hiking', label: 'Wandern', iconKey: 'Footprints', category: 'outdoor' },
    { key: 'cycling', label: 'Radfahren', iconKey: 'Bike', category: 'outdoor' },
    { key: 'mountainbiking', label: 'Mountainbiking', iconKey: 'MountainSnow', category: 'outdoor' },
    { key: 'climbing', label: 'Klettern', iconKey: 'Mountain', category: 'outdoor' },
    { key: 'swimming', label: 'Schwimmen', iconKey: 'Waves', category: 'outdoor' },
    { key: 'water_sports', label: 'Wassersport', iconKey: 'Sailboat', category: 'outdoor' },
    { key: 'camping', label: 'Camping', iconKey: 'Tent', category: 'outdoor' },
    { key: 'fishing', label: 'Angeln', iconKey: 'Fish', category: 'outdoor' },
    { key: 'nature', label: 'Natur erkunden', iconKey: 'Leaf', category: 'outdoor' },
    // Indoor / Sport
    { key: 'fitness', label: 'Fitness', iconKey: 'Dumbbell', category: 'indoor' },
    { key: 'combat_sports', label: 'Kampfsport', iconKey: 'Swords', category: 'indoor' },
    { key: 'gaming_night', label: 'Spieleabend', iconKey: 'Gamepad2', category: 'indoor' },
    { key: 'workshop', label: 'Workshop / Kurs', iconKey: 'GraduationCap', category: 'indoor' },
    // Creative
    { key: 'photography', label: 'Fotografie', iconKey: 'Camera', category: 'creative' },
    { key: 'crafts', label: 'Kreativ / Kunst', iconKey: 'Palette', category: 'creative' },
    { key: 'theater', label: 'Theater / Kultur', iconKey: 'Ticket', category: 'creative' },
    // Social / Events
    { key: 'concert', label: 'Konzert', iconKey: 'Music', category: 'social' },
    { key: 'festival', label: 'Festival', iconKey: 'PartyPopper', category: 'social' },
    { key: 'public_viewing', label: 'Public Viewing', iconKey: 'Tv', category: 'social' },
    { key: 'culinary', label: 'Kulinarik', iconKey: 'CookingPot', category: 'social' },
    { key: 'meetup', label: 'Meetup / Treffen', iconKey: 'Users', category: 'social' },
    { key: 'family_friendly', label: 'Familienfreundlich', iconKey: 'Users', category: 'social' },
    // Travel
    { key: 'day_trip', label: 'Tagesausflug', iconKey: 'Backpack', category: 'travel' },
    { key: 'roadtrip', label: 'Roadtrip', iconKey: 'Car', category: 'travel' },
    { key: 'sightseeing', label: 'Sightseeing', iconKey: 'Landmark', category: 'travel' },
    // Misc
    { key: 'esports', label: 'E-Sports / LAN', iconKey: 'Headset', category: 'indoor' },
];
export const ADVENTURE_TYPE_KEYS = ADVENTURE_TYPES.map(t => t.key) as [string, ...string[]];
export type AdventureTypeKey = typeof ADVENTURE_TYPES[number]['key'];