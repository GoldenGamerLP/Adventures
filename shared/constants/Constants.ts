export const COLOR_MODE_STORAGE_KEY = 'color-mode';
export const COLOR_MODE_STORAGE_AGE_SECONDS = 60 * 60 * 24 * 365;

export enum AdventureSearchQueryKeys {
    QUERY = 'query',
    DIFFICULTY = 'difficulty',
    DURATION = 'duration',
    LOCATION = 'location',
    RADIUS = 'radius',
    SORT = 'sort',
    CATEGORY = 'category',
    TAGS = 'tags',
}

export const DEFAULT_MAX_SEARCH_RADIUS_KM = 550;

// File upload related constants
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_BUNDLE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const SUPPORTED_FILE_TYPES = ["jpeg", "jpg", "png", "gif", "bmp", "tiff", "webp"];

export const DRAFT_CONFIG = {
    /** Lebensdauer eines Drafts in Millisekunden (24 Stunden) */
    TTL_MS: 24 * 60 * 60 * 1000,

    EDIT_TTL_MS: 60 * 60 * 1000, // 1 Stunde für veröffentlichte Drafts (Edit-Referenzen)

    MIN_PICTURES_PER_DRAFT: 1,

    /** Maximale Anzahl aktiver Drafts pro User */
    MAX_DRAFTS_PER_USER: 5,

    /** Maximale Anzahl Bilder pro Draft */
    MAX_PICTURES_PER_DRAFT: 10,
} as const;

/**
 * Maximale Anzahl an Adventure-Views die von nicht eingeloggten Usern gespeichert werden, danach werden die Views von nicht eingeloggten Usern nicht mehr gezählt.
 */
export const ADVENTURE_NONE_CLIENT_VIEW_LIMIT = 300;

export const PICTURE_API_PATH = '/api/v1/app/pictures/%s'; // %s wird durch die Bild-ID ersetzt

export const FETCH_KEY_FOR_YOU_PAGE = 'adventures-for-you-page';

export const MAX_ADVENTURE_DURATION_MINUTES = 24 * 60; // 24 Stunden in Minuten

export const MAX_SELECTORS_SELECTED = 2;

export const DEFAULT_GEOIP = {
    location: {
        latitude: 51.1657,
        longitude: 10.4515,
    },
    city: 'Germany',
    state: 'Germany',
    country: 'Germany',
    postalCode: 'geo_unknown_postal_code',
} as const;

export const APP_ERROR_CODES = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_DRAFT_ID: 'INVALID_DRAFT_ID',
    DRAFT_ID_REQUIRED: 'DRAFT_ID_REQUIRED',
    DRAFT_FORBIDDEN: 'DRAFT_FORBIDDEN',
    DRAFT_NOT_FOUND: 'DRAFT_NOT_FOUND',
    INVALID_DRAFT_PICTURE_IDS: 'INVALID_DRAFT_PICTURE_IDS',
    NO_PICTURES_TO_UPLOAD: 'NO_PICTURES_TO_UPLOAD',
    DRAFT_PICTURE_LIMIT_EXCEEDED: 'DRAFT_PICTURE_LIMIT_EXCEEDED',
    DRAFT_PICTURE_FILE_SIZE_EXCEEDED: 'DRAFT_PICTURE_FILE_SIZE_EXCEEDED',
    DRAFT_PICTURE_BUNDLE_SIZE_EXCEEDED: 'DRAFT_PICTURE_BUNDLE_SIZE_EXCEEDED',
    DRAFT_PICTURE_UPLOAD_FAILED: 'DRAFT_PICTURE_UPLOAD_FAILED',
    DRAFT_PICTURE_ID_REQUIRED: 'DRAFT_PICTURE_ID_REQUIRED',
    DRAFT_PICTURE_NOT_FOUND: 'DRAFT_PICTURE_NOT_FOUND',
    INVALID_GEO_QUERY: 'INVALID_GEO_QUERY',
    GEO_CITY_NOT_FOUND: 'GEO_CITY_NOT_FOUND',
    INVALID_PLAYLIST_QUERY: 'INVALID_PLAYLIST_QUERY',
    PLAYLIST_FORBIDDEN: 'PLAYLIST_FORBIDDEN',
    INVALID_REQUEST_BODY: 'INVALID_REQUEST_BODY',
    INVALID_REQUEST_PARAMS: 'INVALID_REQUEST_PARAMS',
} as const;

// Konfig
export const MAX_GUEST_VIEWS_PER_ADVENTURE = 100; // Danach keine neuen Gäste mehr tracken
export const VIEW_COOLDOWN_MS = 5 * 60 * 1000;      // 5 Min Cooldown zwischen Views