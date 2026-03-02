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
    return await offscreenCanvas.convertToBlob({ type: 'image/webp', quality: 0.25 });
}

const { workerFn: compressImageWorkerFn, workerTerminate } = useWebWorkerFn(
    file => compressImageAndTransformToWebp(file),
    { localDependencies: [compressImageAndTransformToWebp] }
);

const compressImages = async (files: File[]) => {
    const compressedFiles: Blob[] = [];
    const promises = files.map(file => compressImageWorkerFn(file));

    try {
        const results = await Promise.all(promises);
        compressedFiles.push(...results);
    } catch (error) {
        console.error('Error compressing images:', error);
    } finally {
        workerTerminate();
    }
    return compressedFiles;
}

const compressImage = async (file: File) => {
    try {
        return await compressImageWorkerFn(file);
    } catch (error) {
        console.error('Error compressing image:', error);
    } finally {
        workerTerminate();
    }
}

export {
    compressImage, compressImages
};
