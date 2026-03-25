import * as z from 'zod';
import { AdventureSearchQueryKeys } from '../constants/Constants';
import { AdventureCategory } from '../types/AdventureTypes';
import { ObjectIdSchema } from '../validation/utils';

export const AdventuresQueryFilterSchema = z.object({
    [AdventureSearchQueryKeys.QUERY]: z.string().min(1).max(100).optional(),
    [AdventureSearchQueryKeys.DIFFICULTY]: z.enum(['easy', 'medium', 'hard']).optional(),
    //Duration in format "min,max" e.g. "2,5"
    [AdventureSearchQueryKeys.DURATION]: z.tuple([z.coerce.number().min(15).max(1440), z.coerce.number().min(15).max(1440)]).refine(data => data[0] <= data[1], {
        message: 'VALIDATION_DURATION_MIN_MAX_ORDER',
    }).optional(),
    [AdventureSearchQueryKeys.LOCATION]: z.tuple([z.coerce.number().min(-180).max(180), z.coerce.number().min(-90).max(90)]),
    [AdventureSearchQueryKeys.RADIUS]: z.coerce.number().min(0).optional(),
    [AdventureSearchQueryKeys.SORT]: z.enum(['popular', 'new', 'recommended', 'near_me']).optional().default('recommended'),
    [AdventureSearchQueryKeys.CATEGORY]: z.enum([AdventureCategory.INDOOR, AdventureCategory.OUTDOOR, AdventureCategory.MIXED]).optional(),
    //AdventureTypeKey als Tags
    [AdventureSearchQueryKeys.TAGS]: z.coerce.string().array().optional(),
});

export type AdventuresQueryFilterType = z.infer<typeof AdventuresQueryFilterSchema>;


export const AdventureLikeSchema = z.object({
    adventureId: ObjectIdSchema,
});

export const AdventureStartEditSchema = z.object({
    adventureId: ObjectIdSchema,
});

export const AdventureGetByIdSchema = z.object({
    adventureId: ObjectIdSchema,
});