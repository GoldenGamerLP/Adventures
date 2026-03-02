import * as z from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const ObjectIdSchema = z.string().regex(objectIdPattern, "Invalid ObjectId format");

export const SafeStringSchema = z.string().regex(
    /^\w+(?:[ _]\w+)*$/,
    'app_validation_errors_safe_string',
);

export const GeoLocationSchema = z.object({
    displayName: z.string().max(200),
    latLon: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]),
    address: z.record(z.string(), z.string()).optional(),
});