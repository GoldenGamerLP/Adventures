import { z } from "zod";
import { ObjectIdSchema } from "../validation/utils";

export const PublicPlaylistsQuerySchema = z.object({
    userId: ObjectIdSchema,
});

export const PlaylistGetSchema = z.object({
    playlistId: ObjectIdSchema.or(z.string().startsWith("sys:")), // system playlists have ids like "sys:liked"
    skip: z.coerce.number().optional().default(0),
    limit: z.coerce.number().optional().default(20),
});

export const PlaylistInfoQuerySchema = z.object({
    playlistId: ObjectIdSchema.or(z.string().startsWith("sys:")),
});

export const AddToPlaylistQuerySchema = z.object({
    playlistId: ObjectIdSchema,
});

export const AddToPlaylistBodySchema = z.object({
    adventureId: ObjectIdSchema,
    force: z.boolean().optional().default(false),
});

export const GetPlaylistsByAdventureQuerySchema = z.object({
    includeVirtual: z.string().optional().transform((val) => val === "true"),
    mode: z.enum(["private", "public", "unlisted"]).default("public"),
});

export type GetPlaylistsByAdventureQueryType = z.infer<typeof GetPlaylistsByAdventureQuerySchema>;