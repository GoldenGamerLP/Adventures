import { PictureUploadSchema } from '#shared/schema/PictureSchema';
import { uploadPictures } from '~~/server/utils/pictures/PictureUtils';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        return createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
    const formData = await readFormData(event);
    const bucketIdFound = formData.get('bucketId') as string;
    //Needs to be converted to undefined if not present because of Zod optional handling
    const entryIdFound = formData.get('entryId') ?? undefined as string | undefined;
    const imagesFound = formData.getAll('compressedImages') as File[] | undefined;

    const { data, error } = await PictureUploadSchema.safeParseAsync({
        bucketId: bucketIdFound,
        entryId: entryIdFound,
        compressedImages: imagesFound,
    });

    if (error) {
        return createError({ statusCode: 400, statusMessage: 'Invalid request data', data: error });
    }

    const { bucketId, compressedImages, entryId } = data;

    await uploadPictures(bucketId, user._id, entryId, compressedImages);

    setResponseStatus(event, 201, 'Pictures uploaded successfully');
});
