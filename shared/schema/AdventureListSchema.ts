import { z } from "zod";
import { ObjectIdSchema, SafeStringSchema } from "../validation/utils";

export const AdventureListCreateSchema = z.object({
    name: SafeStringSchema.max(100),
    description: z.string().max(500).optional(),
    visibility: z.enum(["private", "public", "unlisted"]).default("private"),
});

export type AdventureListCreateInput = z.infer<typeof AdventureListCreateSchema>;

export const DeleteAdventureListSchema = z.object({
    adventureListId: ObjectIdSchema,
    userId: z.string(),
});

export type DeleteAdventureListInput = z.infer<typeof DeleteAdventureListSchema>;

export const UpdateAdventureListSchema = z.object({
    adventureListId: ObjectIdSchema,
    userId: z.string(),
    name: SafeStringSchema.max(100).optional(),
    description: z.string().max(500).optional(),
    visibility: z.enum(["private", "public", "unlisted"]).optional(),
});

export type UpdateAdventureListInput = z.infer<typeof UpdateAdventureListSchema>;

export const RemoveAdventureFromListSchema = z.object({
    adventureEntryId: ObjectIdSchema,
});

export type RemoveAdventureFromListInput = z.infer<typeof RemoveAdventureFromListSchema>;

export const ChangeAdventureOrderSchema = z.object({
    adventureListId: ObjectIdSchema,
    adventureEntryId: ObjectIdSchema,
    newOrder: z.number().int().nonnegative(),
});

export type ChangeAdventureOrderInput = z.infer<typeof ChangeAdventureOrderSchema>;

export const PlaylistIdParamSchema = z.object({
    playlistId: ObjectIdSchema,
});

export type PlaylistIdParam = z.infer<typeof PlaylistIdParamSchema>;