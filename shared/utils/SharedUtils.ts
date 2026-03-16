import { PICTURE_API_PATH } from "../constants/Constants";
import type { DurationPreset, DurationRange, EventSchedule } from "../types/EventTypes";

const distanceFormatter = new Intl.NumberFormat('de-DE', {
    style: 'unit',
    unit: 'kilometer',
    unitDisplay: 'narrow',
    maximumFractionDigits: 0,
});

export const formatDistance = (distanceInMeters?: number): string => {
    if (distanceInMeters === undefined) {
        return 'unbekannt';
    }

    return distanceFormatter.format(distanceInMeters / 1000);
}

export const toPicturePath = (pictureId?: string): string => {
    return PICTURE_API_PATH.replace('%s', pictureId || '');
}

export const sanitizedFileName = (originalName: string, index: number) => {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    return `${nameWithoutExt}_${index}.webp`;
};

export const formatFileSize = (sizeBytes: number, decimalPlaces = 2): string => {
    if (sizeBytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimalPlaces < 0 ? 0 : decimalPlaces;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(sizeBytes) / Math.log(k));
    return parseFloat((sizeBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const calculateCompletionPercent = (draft: { pictureIds: string[]; formData: Record<string, any> }): number => {
    const requiredFields = ['title', 'description', 'visibility', 'difficulty', 'tags', 'category', 'schedule'] as const;
    const filledFields = requiredFields.filter(field => {
        const value = draft.formData[field];
        return value !== undefined && value !== null && value !== '';
    });

    const formProgress = (filledFields.length / requiredFields.length) * 80;
    const pictureProgress = draft.pictureIds.length > 0 ? 20 : 0;

    return Math.round(formProgress + pictureProgress);
};


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

export function formatRelativeTime(minutes: number): string {
    //Minute 0 ab Mitternacht als 24h darstellen
    if (minutes === 0) {
        return '00:00';
    }

    if (minutes < 60) {
        //00:00 mit nullen auf 2 stellen formatieren
        return `00:${minutes.toString().padStart(2, '0')}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
        return hours === 1 ? `01:00` : `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
    }

    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
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


/*
* Basiert auf RFC 5545 / Mimetype text/calendar
* Siehe: https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.5
*/
export function scheduleToCalenderFormat(schedule: EventSchedule): string {
    const standardTimezone = "Europe/Berlin"; // TODO: tatsächliche Zeitzone des Events verwenden

    if (schedule.type === 'single' && schedule.startDate) {
        return `DTSTART;TZID=${standardTimezone}:${new Date(schedule.startDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    }

    if (schedule.type === 'range' && schedule.startDate && schedule.endDate) {
        return `DTSTART;TZID=${standardTimezone}:${new Date(schedule.startDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z\nDTEND;TZID=${standardTimezone}:${new Date(schedule.endDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    }

    // Für flexible Events könnte man eine vCard mit RRULE oder eine Beschreibung zurückgeben, da keine festen Zeiten vorliegen
    return `DESCRIPTION:Dieses Event hat flexible Zeitangaben. Geschätzte Dauer: ${formatDurationRange(schedule.estimatedDuration)}. Bitte überprüfen Sie die Details für weitere Informationen.`;
}