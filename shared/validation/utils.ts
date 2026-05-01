import * as z from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const ObjectIdSchema = z.string().regex(objectIdPattern, 'VALIDATION_OBJECT_ID_FORMAT');

/**
 * A string that is safe to use in URLs and file names, allowing letters, numbers, spaces, and common punctuation. Must start with a letter or number.
 */
export const SafeStringSchema = z.string().trim().regex(
    /^[\p{L}\p{N}][\p{L}\p{N}\s_,.\-()'&]*$/u,
    'VALIDATION_SAFE_STRING',
);
