import * as z from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const ObjectIdSchema = z.string().regex(objectIdPattern, 'VALIDATION_OBJECT_ID_FORMAT');

export const SafeStringSchema = z.string().regex(
    /^\w+(?:[ _]\w+)*$/,
    'VALIDATION_SAFE_STRING',
);
