import { PictureGetSchema } from "#shared/schema/PictureSchema";
import { isDraftPicture, isPublishedPicture, isUserSourcePicture } from "#shared/types/PictureTypes";
import { getPictureById, openDownloadStreamForPicture } from "~~/server/utils/pictures/PictureUtils";

export default defineEventHandler(async (event) => {
    const { data, error } = await getValidatedRouterParams(event, PictureGetSchema.safeParseAsync);

    if (error) {
        throw createError({
            status: 500,
            message: "Invalid Picture ID",
            data: error.cause,
        })
    }

    const { pictureId } = data;

    const picture = await getPictureById(pictureId);

    if (!picture) {
        throw createError({
            status: 404,
            message: "Picture not found"
        })
    }

    // Zugriffslogik basierend auf Picture-Status
    let hasAccess = false;

    if (isPublishedPicture(picture) || isUserSourcePicture(picture)) {
        hasAccess = true; // Öffentlich zugänglich
    } else {
        if (isDraftPicture(picture)) {
            const user = event.context.user;
            if (user && picture.uploadedBy === user._id) {
                hasAccess = true; // Eigentümer des Draft-Bildes
            }
        }
    }

    if (!hasAccess) {
        throw createError({
            status: 401,
            message: "UNAUTHORIZED",
        })
    }

    const { size, contentType, fileName } = picture.meta;

    handleCacheHeaders(event, {
        maxAge: 1 * 60,
        cacheControls: ["private"]
    });

    setResponseHeader(event, "Content-Type", contentType);
    setResponseHeader(event, "Content-Length", size);
    setResponseHeader(event, "Content-Disposition", `inline; filename="${fileName}"`);

    return openDownloadStreamForPicture(picture);
});