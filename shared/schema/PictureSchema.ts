import * as z from "zod";
import { ObjectIdSchema } from "../validation/utils";
import { MAX_BUNDLE_SIZE_BYTES, MAX_FILE_SIZE_BYTES } from "../constants/Constants";

export const PictureUploadSchema = z.object({
    bucketId: ObjectIdSchema,
    entryId: ObjectIdSchema.optional(),
    compressedImages: z.array(
        z.instanceof(File)
            .refine(file => file instanceof File && file.size < MAX_FILE_SIZE_BYTES, 'app_validation_errors_file_too_large')
    ).min(1)
        .refine(files => files.reduce((acc, file) => acc + file.size, 0) < MAX_BUNDLE_SIZE_BYTES, 'app_validation_errors_file_too_large'),
});

export const PictureGetSchema = z.object({
    pictureId: ObjectIdSchema,
});