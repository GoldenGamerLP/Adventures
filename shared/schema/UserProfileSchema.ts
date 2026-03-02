import * as z from 'zod';

/**
 * Validierung für den Profil-Header (kurzer Untertitel)
 * z.B. "Outdoor-Enthusiast", "Bücherwurm"
 */
export const UpdateHeaderSchema = z.object({
    header: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(60, 'Maximal 60 Zeichen'),
});

/**
 * Validierung für die Biografie (längerer Text)
 */
export const UpdateBiographySchema = z.object({
    biography: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(500, 'Maximal 500 Zeichen'),
});

/**
 * Validierung für Tags (Interessen / Stichworte)
 */
export const UpdateTagsSchema = z.object({
    tags: z.array(
        z.string().trim().min(2, 'Mindestens 2 Zeichen pro Tag').max(30, 'Maximal 30 Zeichen pro Tag')
    ).max(15, 'Maximal 15 Tags'),
});

export type UpdateHeaderInput = z.infer<typeof UpdateHeaderSchema>;
export type UpdateBiographyInput = z.infer<typeof UpdateBiographySchema>;
export type UpdateTagsInput = z.infer<typeof UpdateTagsSchema>;
