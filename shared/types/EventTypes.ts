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

/**
 * Event-Typ zur Unterscheidung der Zeitangabe
 */
export type EventType =
    | 'single'      // Einzelner Termin (z.B. "15. März 2026, 14:00")
    | 'range'       // Zeitraum (z.B. "15. - 17. März 2026")
    | 'recurring'   // Wiederkehrend (zukünftig) - not used TODO: implementation
    | 'flexible';   // Flexibel / Jederzeit möglich

/**
 * Vollständiges Event-Schedule-Objekt
 */
export interface EventSchedule {
    /** Art des Events */
    type: EventType;

    /** Startdatum/zeit als ISO String */
    startDate?: string;

    /** Enddatum für mehrtägige Events (ISO String) */
    endDate?: string;

    /** Startzeit als HH:MM String (optional, für ganztägige Events) */
    startTime?: string;

    /** Geschätzte Dauer als Range */
    estimatedDuration: DurationRange;

    /** Markiert ungefähre/flexible Angaben */
    isApproximate?: boolean;
}

/**
 * Helper: Minuten zu lesbarem String formatieren
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} Min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
        return hours === 1 ? '1 Stunde' : `${hours} Stunden`;
    }
    return `${hours}h ${remainingMinutes}min`;
}

/**
 * Helper: DurationRange zu lesbarem String formatieren
 */
export function formatDurationRange(range: DurationRange): string {
    if (range.min === range.max) {
        return formatDuration(range.min);
    }
    return `${formatDuration(range.min)} - ${formatDuration(range.max)}`;
}

/**
 * Helper: Prüft ob Duration ein Preset entspricht
 */
export function matchDurationPreset(range: DurationRange): DurationPreset | null {
    for (const [key, preset] of Object.entries(DURATION_PRESETS)) {
        if (preset.min === range.min && preset.max === range.max) {
            return key as DurationPreset;
        }
    }
    return null;
}

/**
 * Default EventSchedule für neue Adventures
 */
export const DEFAULT_EVENT_SCHEDULE: EventSchedule = {
    type: 'flexible',
    estimatedDuration: { min: 60, max: 120 },
    isApproximate: true,
};
