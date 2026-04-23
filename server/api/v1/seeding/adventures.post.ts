import { createKeyedError } from "~~/server/utils/errors/ApiErrorUtils";
import { uploadSeedingPictures } from "~~/server/utils/pictures/PictureUtils";
import { assertSeedingApiKey, createSeedingAdventure } from "~~/server/utils/seeding/SeedingUtils";
import { APP_ERROR_CODES } from "~~/shared/constants/Constants";
import { SeedingAdventureUploadSchema } from "~~/shared/schema/SeedingSchema";

export default defineEventHandler(async (event) => {
    assertSeedingApiKey(event);

    const formData = await readFormData(event);
    const pictures = formData.getAll('pictures').filter((picture): picture is File => picture instanceof File);

    const payload = {
        title: formData.get('title'),
        description: formData.get('description'),
        tags: formData.get('tags'),
        difficulty: formData.get('difficulty'),
        category: formData.get('category'),
        location: formData.get('location'),
        schedule: formData.get('schedule'),
        visibility: formData.get('visibility'),
        authorId: formData.get('authorId'),
        source: formData.get('source'),
        pictures,
    };

    const { data, error } = await SeedingAdventureUploadSchema.safeParseAsync(payload);

    if (error) {
        throw createKeyedError(400, APP_ERROR_CODES.SEEDING_INVALID_PAYLOAD, {
            issues: error.issues,
        });
    }

    const uploadedPictures = await uploadSeedingPictures(data.pictures);
    const seed = await createSeedingAdventure(data, uploadedPictures.map(picture => picture._id));

    setResponseStatus(event, 201);

    return {
        success: true,
        message: 'Adventure seeded successfully',
        seed,
    };
});