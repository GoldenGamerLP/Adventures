import { z } from "zod";
import { SafeStringSchema } from "../validation/utils";

export const AdventureListCreateSchema = z.object({
    name: SafeStringSchema.max(100),
    description: z.string().max(500).optional(),
    visibility: z.enum(["private", "public", "unlisted"]).default("private"),
});

export type AdventureListCreateInput = z.infer<typeof AdventureListCreateSchema>;