import * as z from "zod";
import { DRAFT_CONFIG, MAX_FILE_SIZE_BYTES, MAX_SELECTORS_SELECTED } from "../constants/Constants";
import { ObjectIdSchema, SafeStringSchema } from "../validation/utils";
import { AdventureSource as AdventureSourceSchema } from "./AdventuresSchema";
import { EventScheduleSchema } from "./DraftSchema";
import { GeoLocationSchema } from "./GeoSchema";

const jsonValue = <T extends z.ZodTypeAny>(schema: T) => z.preprocess((value) => {
    if (typeof value !== 'string') {
        return value;
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
        return undefined;
    }

    try {
        return JSON.parse(trimmed);
    }
    catch {
        return value;
    }
}, schema);

const fileSchema = z.instanceof(File).refine(file => file.size <= MAX_FILE_SIZE_BYTES, { message: 'Picture size must be less than 5MB' });

export const SeedingAdventureUploadSchema = z.object({
    title: SafeStringSchema.min(4).max(100),
    description: z.string().min(10).max(5000),
    tags: jsonValue(z.array(z.enum(ADVENTURE_TYPE_KEYS)).max(MAX_SELECTORS_SELECTED)),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    category: z.enum(['indoor', 'outdoor', 'mixed']),
    location: jsonValue(GeoLocationSchema.optional()),
    schedule: jsonValue(EventScheduleSchema.default({
        type: 'flexible',
        estimatedDuration: {
            min: 60,
            max: 120,
        },
    })),
    visibility: z.enum(['public', 'private', 'unlisted']),
    source: jsonValue(AdventureSourceSchema),
    pictures: z.array(fileSchema).max(DRAFT_CONFIG.MAX_PICTURES_PER_DRAFT).min(DRAFT_CONFIG.MIN_PICTURES_PER_DRAFT),
});

export type SeedingAdventureUploadInput = z.infer<typeof SeedingAdventureUploadSchema>;

export const SeedingAdventureRecordSchema = z.object({
    _id: ObjectIdSchema,
    title: SafeStringSchema.min(4).max(100),
    description: z.string().min(10).max(5000),
    location: GeoLocationSchema.optional(),
    schedule: EventScheduleSchema,
    difficulty: z.enum(['easy', 'medium', 'hard']),
    category: z.enum(['indoor', 'outdoor', 'mixed']),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    pictureIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'VALIDATION_OBJECT_ID_FORMAT')),
    tags: z.array(z.enum(ADVENTURE_TYPE_KEYS)).max(MAX_SELECTORS_SELECTED),
    draftId: ObjectIdSchema.optional(),
    visibility: z.enum(['public', 'private', 'unlisted']),
    status: z.enum(['pending', 'approved', 'rejected']),
    reviewedAt: z.coerce.date().optional(),
    reviewerId: ObjectIdSchema.optional(),
    rejectionReason: z.string().max(1000).optional(),
    source: AdventureSourceSchema,
});

export type SeedingAdventureRecordInput = z.infer<typeof SeedingAdventureRecordSchema>;

export const SeedingDecisionSchema = z.object({
    adventureId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'VALIDATION_OBJECT_ID_FORMAT'),
    approved: z.boolean(),
    reviewerId: ObjectIdSchema,
    reason: z.string().max(1000).optional(),
    reviewedAt: z.coerce.date().default(() => new Date()),
});

export type SeedingDecisionInput = z.infer<typeof SeedingDecisionSchema>;
