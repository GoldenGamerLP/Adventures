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