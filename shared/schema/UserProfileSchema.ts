import * as z from 'zod';
import { INTEREST_KEY_SET, MAX_INTERESTS } from '../types/UserProfileTypes';

/**
 * Validierung für die Biografie (längerer Text)
 */
export const UpdateBiographySchema = z.object({
    biography: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(500, 'Maximal 500 Zeichen'),
});

/**
 * Validierung für Interessen (vorgegebene Keys)
 */
export const UpdateInterestsSchema = z.object({
    interests: z.enum(INTEREST_KEY_SET).array().max(MAX_INTERESTS),
});

export type UpdateBiographyInput = z.infer<typeof UpdateBiographySchema>;
export type UpdateInterestsInput = z.infer<typeof UpdateInterestsSchema>;