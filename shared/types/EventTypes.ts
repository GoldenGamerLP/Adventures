/**
 * Event Schedule Types für Adventures
 * Ermöglicht flexible Zeit- und Dauerangaben
 */

/**
 * Dauer-Presets für schnelle Auswahl
 */
export const DURATION_PRESETS = {
    SHORT: { min: 30, max: 60, label: 'Kurz (30min - 1h)' },
    HALF_DAY: { min: 120, max: 240, label: 'Halbtag (2-4h)' },
    FULL_DAY: { min: 360, max: 480, label: 'Ganztag (6-8h)' },
    MULTI_DAY: { min: 480, max: 1440, label: 'Mehrtägig' },
} as const;

export const OPENING_HOURS_PRESETS = {
    FULL_DAY: { label: 'Ganztägig', hours: { from: 0, to: 1440 } },
    MORNING: { label: 'Morgens', hours: { from: 360, to: 720 } },
    AFTERNOON: { label: 'Nachmittags', hours: { from: 720, to: 1080 } },
    EVENING: { label: 'Abends', hours: { from: 1080, to: 1440 } },
} as const;

export const WEEK_DAYS = [
    { label: 'Montag', value: 0 },
    { label: 'Dienstag', value: 1 },
    { label: 'Mittwoch', value: 2 },
    { label: 'Donnerstag', value: 3 },
    { label: 'Freitag', value: 4 },
    { label: 'Samstag', value: 5 },
    { label: 'Sonntag', value: 6 },
] as const;

export type DurationPreset = keyof typeof DURATION_PRESETS;

/**
 * Geschätzte Dauer als Range
 * Erlaubt Angaben wie "2-4 Stunden"
 */
export interface DurationRange {
    /** Minimale Dauer in Minuten */
    min: number;
    /** Maximale Dauer in Minuten */
    max: number;
}

export interface OpeningHours {
    dayOfWeek: number; // 0=Montag, 6=Sonntag
    from: number; // Minuten seit Mitternacht (0-1439)
    to: number;   // Minuten seit Mitternacht (0-1439)
}

/**
 * Event-Typ zur Unterscheidung der Zeitangabe
 */
export type EventType =
    | 'single'      // Einzelner Termin (z.B. "15. März 2026, 14:00")
    | 'range'       // Zeitraum (z.B. "15. - 17. März 2026")
    | 'flexible';   // Flexibel / Jederzeit möglich

/**
 * Vollständiges Event-Schedule-Objekt
 */
export interface EventSchedule {
    /** Art des Events */
    type: EventType;

    /** Startdatum/zeit als ZonedDateTime String, ISO 8601 */
    startDate?: string;

    /** Enddatum für mehrtägige Events als ZonedDateTime String, ISO 8601 */
    endDate?: string;

    /** Geschätzte Dauer als Range */
    estimatedDuration: DurationRange;

    /** Jährlich wiederholend - nur bei single/range */
    repeatsAnnually?: boolean;

    /** Öffnungszeiten */
    slots?: OpeningSlots[];

    /** Markiert ungefähre/flexible Angaben */
    isApproximate?: boolean;
}

export interface OpeningSlots {
    dayOfWeek: number; // 0=Montag, 6=Sonntag
    from: number; // Minuten seit Mitternacht (0-1439)
    to: number;   // Minuten seit Mitternacht (0-1439)
}
