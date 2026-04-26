import * as z from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const ObjectIdSchema = z.string().regex(objectIdPattern, 'VALIDATION_OBJECT_ID_FORMAT');

/**
 * A string that is safe to use in URLs and file names, allowing only letters, numbers, underscores, and commas and must start and end with a letter or number.
 */
export const SafeStringSchema = z.string().trim().regex(
    /^[a-zA-Z0-9](?:[a-zA-Z0-9_ ,]*[a-zA-Z0-9])?$/,
    'VALIDATION_SAFE_STRING',
);
