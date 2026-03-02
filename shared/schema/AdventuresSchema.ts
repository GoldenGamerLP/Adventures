import * as z from 'zod';
import { DRAFT_CONFIG } from '~~/shared/constants/Constants';
import { AdventureSearchQueryKeys } from '../constants/Constants';
import { AdventureCategory } from '../types/AdventureTypes';
import { ObjectIdSchema } from '../validation/utils';

export const AdventuresQueryFilterSchema = z.object({
    [AdventureSearchQueryKeys.QUERY]: z.string().min(1).max(100).optional(),
    [AdventureSearchQueryKeys.DIFFICULTY]: z.enum(['easy', 'medium', 'hard']).optional(),
    //Duration in format "min,max" e.g. "2,5"
    [AdventureSearchQueryKeys.DURATION]: z.tuple([z.coerce.number().min(15).max(1440), z.coerce.number().min(15).max(1440)]).refine(data => data[0] <= data[1], {
        message: 'Minimale Dauer muss kleiner oder gleich der maximalen Dauer sein',
    }).optional(),
    [AdventureSearchQueryKeys.LOCATION]: z.tuple([z.coerce.number().min(-180).max(180), z.coerce.number().min(-90).max(90)]),
    [AdventureSearchQueryKeys.RADIUS]: z.coerce.number().min(0).optional(),
    [AdventureSearchQueryKeys.SORT]: z.enum(['popular', 'new', 'recommended', 'near_me']).optional().default('popular'),
    [AdventureSearchQueryKeys.CATEGORY]: z.enum([AdventureCategory.INDOOR, AdventureCategory.OUTDOOR, AdventureCategory.MIXED]).optional(),
    //Tags as comma separated string e.g. "tag1,tag2,tag3"
    [AdventureSearchQueryKeys.TAGS]: z.array(z.string().min(1).max(30)).max(10).optional()
});

export type AdventuresQueryFilterType = z.infer<typeof AdventuresQueryFilterSchema>;

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
    type: z.enum(['single', 'range', 'recurring', 'flexible']),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    estimatedDuration: z.object({
        min: z.number().min(15).max(1440),
        max: z.number().min(15).max(1440),
    }).refine(data => data.min <= data.max, {
        message: 'Minimale Dauer muss kleiner oder gleich der maximalen Dauer sein',
    }),
    isApproximate: z.coerce.boolean(),
});

export type EventScheduleInput = z.infer<typeof EventScheduleSchema>;

export const DraftFormSchema = z.object({
    pictureIds: z.array(ObjectIdSchema).max(DRAFT_CONFIG.MAX_PICTURES_PER_DRAFT).min(DRAFT_CONFIG.MIN_PICTURES_PER_DRAFT),
    title: z.string().min(3).max(100),
    description: z.string().min(10).max(5000),
    tags: z.array(z.coerce.string()).max(10),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    category: z.enum(['indoor', 'outdoor', 'mixed']),
    location: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.coerce.number(), z.coerce.number()]), // [longitude, latitude]
    }).optional(),
    schedule: EventScheduleSchema.default({
        type: 'flexible',
        estimatedDuration: { min: 60, max: 120 },
        isApproximate: false,
    }),
    visibility: z.enum(['public', 'private', 'unlisted']),
});

export const AdventureLikeSchema = z.object({
    adventureId: ObjectIdSchema,
});

export const AdventureStartEditSchema = z.object({
    adventureId: ObjectIdSchema,
});

export const AdventureGetByIdSchema = z.object({
    adventureId: ObjectIdSchema,
});