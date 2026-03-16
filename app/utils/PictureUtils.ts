import { useWebWorkerFn } from "@vueuse/core";

const compressImageAndTransformToWebp = async (file: File) => {
    const offscreenCanvas = new OffscreenCanvas(1920, 1080);
    const ctx = offscreenCanvas.getContext('2d');
    const imageBitmap = await createImageBitmap(file);
    const scale = Math.min(1920 / imageBitmap.width, 1080 / imageBitmap.height);
    const width = imageBitmap.width * scale;
    const height = imageBitmap.height * scale;

    offscreenCanvas.width = width;
    offscreenCanvas.height = height;

    ctx?.drawImage(imageBitmap, 0, 0, width, height);
    return await offscreenCanvas.convertToBlob({ type: 'image/webp', quality: 0.2 });
}

const { workerFn: compressImageWorkerFn, workerTerminate } = useWebWorkerFn(
    file => compressImageAndTransformToWebp(file),
    { localDependencies: [compressImageAndTransformToWebp] }
);

const compressImages = async (files: File[]) => {
    const compressedFiles: Blob[] = [];

    for (const file of files) {
        try {
            const compressed = await compressImageWorkerFn(file);
            if (compressed) {
                compressedFiles.push(compressed);
            }
        } catch (error) {
            console.error('Error compressing image:', error);
        }
    }

    workerTerminate('SUCCESS');

    return compressedFiles;
}

const compressImage = async (file: File) => {
    try {
        return await compressImageWorkerFn(file);
    } catch (error) {
        console.error('Error compressing image:', error);
    } finally {
        workerTerminate('SUCCESS');
    }
}

export {
    compressImage, compressImages
};

