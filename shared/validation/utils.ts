import * as z from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const ObjectIdSchema = z.string().regex(objectIdPattern, "Invalid ObjectId format");

export const SafeStringSchema = z.string().regex(
    /^\w+(?:[ _]\w+)*$/,
    'Nur Buchstaben, Zahlen, Unterstriche und Leerzeichen erlaubt. Keine Sonderzeichen.',
);
