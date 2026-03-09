
export type UserProfile = {
    _id: string;         // gleiche ID wie User
    userId: string;      // Referenz

    /** Längere Biografie, z.B. "Ich liebe es, neue Abenteuer zu erleben..." */
    biography?: string;
    /** Interessen -> Keys aus INTEREST_KEY_SET, z.B. ["hiking", "cooking", "gaming"] */
    interests: string[];

    backgroundPictureId?: string;
    profilePictureId?: string;
}

export type UserSummary = {
    _id: string;
    name: string;
    profilePictureId?: string;
    createdAt: Date | string;
}

export type UserProfileWithMeta = UserProfile & UserSummary;

export const INTEREST_ICON_KEYS = [
    'Footprints', 'CookingPot', 'Headset', 'BaggageClaim',
    'Camera', 'Music', 'Bike', 'Mountain', 'Waves', 'Tent',
    'Dumbbell', 'Palette', 'BookOpen', 'Gamepad2', 'Car',
    'Plane', 'Fish', 'Leaf', 'Sword', 'Drama',
] as const;

export type InterestIconKey = typeof INTEREST_ICON_KEYS[number];

export interface Interest {
    key: string;
    label: string;
    iconKey: InterestIconKey;
    category?: 'outdoor' | 'indoor' | 'social' | 'creative';
}

export const INTERESTS: Interest[] = [
    { key: 'hiking', label: 'Wandern', iconKey: 'Footprints', category: 'outdoor' },
    { key: 'cooking', label: 'Kochen', iconKey: 'CookingPot', category: 'indoor' },
    { key: 'gaming', label: 'Gaming', iconKey: 'Gamepad2', category: 'indoor' },
    { key: 'traveling', label: 'Reisen', iconKey: 'Plane', category: 'social' },
    { key: 'photography', label: 'Fotografie', iconKey: 'Camera', category: 'creative' },
    { key: 'music', label: 'Musik', iconKey: 'Music', category: 'creative' },
    { key: 'cycling', label: 'Radfahren', iconKey: 'Bike', category: 'outdoor' },
    { key: 'climbing', label: 'Klettern', iconKey: 'Mountain', category: 'outdoor' },
    { key: 'swimming', label: 'Schwimmen', iconKey: 'Waves', category: 'outdoor' },
    { key: 'camping', label: 'Camping', iconKey: 'Tent', category: 'outdoor' },
    { key: 'fitness', label: 'Fitness', iconKey: 'Dumbbell', category: 'indoor' },
    { key: 'art', label: 'Kunst', iconKey: 'Palette', category: 'creative' },
    { key: 'reading', label: 'Lesen', iconKey: 'BookOpen', category: 'indoor' },
    { key: 'fishing', label: 'Angeln', iconKey: 'Fish', category: 'outdoor' },
    { key: 'nature', label: 'Natur', iconKey: 'Leaf', category: 'outdoor' },
];

export const MAX_INTERESTS = 6;

export const INTEREST_KEY_SET = ["hiking", "cooking", "gaming", "traveling", "photography", "music", "cycling", "climbing", "swimming", "camping", "fitness", "art", "reading", "fishing", "nature"] as const;