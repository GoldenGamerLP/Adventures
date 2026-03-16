import * as z from 'zod';
import { DRAFT_CONFIG, MAX_ADVENTURE_DURATION_MINUTES, MAX_SELECTORS_SELECTED } from '../constants/Constants';
import { ObjectIdSchema, SafeStringSchema } from '../validation/utils';
import { GeoLocationSchema } from './GeoSchema';

export const DraftIdGetSchema = z.object({
    draftId: ObjectIdSchema,
});

export const DraftPictureSchema = z.object({
    _id: ObjectIdSchema,
    fileId: z.string(),
    uploadedBy: z.string(),
    uploadedAt: z.string(),
    meta: z.object({
        contentType: z.string(),
        fileName: z.string(),
        lastModified: z.string(),
        size: z.number(),
    }),
    status: z.literal('draft'),
    draftId: z.string(),
});

/**
 * Schema für EventSchedule (Zeitplanung)
 */
export const EventScheduleSchema = z.object({
    type: z.enum(['single', 'range', 'flexible']).default('flexible'),
    // Für 'single' und 'range' müssen Start- und Endzeit angegeben werden
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    estimatedDuration: z.object({
        min: z.number().min(15).max(MAX_ADVENTURE_DURATION_MINUTES),
        max: z.number().min(15).max(MAX_ADVENTURE_DURATION_MINUTES),
    }).refine(data => data.min <= data.max, {
        message: 'Minimale Dauer muss kleiner oder gleich der maximalen Dauer sein',
    }),
    isApproximate: z.coerce.boolean().default(false),
    repeatsAnnually: z.coerce.boolean().default(false),
    slots: z.array(z.object({
        dayOfWeek: z.number().min(0).max(6), // 0=Montag, 6=Sonntag
        from: z.number().min(0).max(MAX_ADVENTURE_DURATION_MINUTES), // Minuten seit Mitternacht
        to: z.number().min(0).max(MAX_ADVENTURE_DURATION_MINUTES), // Minuten seit Mitternacht
    })).optional().default([]),
}).refine(data => {
    if (data.type === 'single') {
        return !!data.startDate && !data.endDate;
    }
    return true;
}, {
    message: 'Ungültige Kombination von Zeitplan-Typ und Zeitangaben',
}).refine(data => {
    if (data.type === 'range') {
        return !!data.startDate && !!data.endDate;
    }
    return true;
}, {
    message: 'Ungültige Kombination von Zeitplan-Typ und Zeitangaben',
});

export type EventScheduleInput = z.infer<typeof EventScheduleSchema>;

export const DraftFormSchema = z.object({
    pictureIds: z.array(ObjectIdSchema).max(DRAFT_CONFIG.MAX_PICTURES_PER_DRAFT).min(DRAFT_CONFIG.MIN_PICTURES_PER_DRAFT),
    title: SafeStringSchema.min(4).max(100),
    description: z.string().min(10).max(5000),
    tags: z.array(z.enum(ADVENTURE_TYPE_KEYS)).max(MAX_SELECTORS_SELECTED),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    category: z.enum(['indoor', 'outdoor', 'mixed']),
    location: GeoLocationSchema.optional(),
    schedule: EventScheduleSchema.default({
        type: 'flexible',
        estimatedDuration: {
            min: 60,
            max: 120,
        },
    }),
    visibility: z.enum(['public', 'private', 'unlisted']),
});

export type DraftFormInput = z.infer<typeof DraftFormSchema>;