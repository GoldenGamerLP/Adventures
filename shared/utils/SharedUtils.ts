import { PICTURE_API_PATH } from "../constants/Constants";

const distanceFormatter = new Intl.NumberFormat('de-DE', {
    style: 'unit',
    unit: 'kilometer',
    unitDisplay: 'narrow',
    maximumFractionDigits: 0,
});

export const formatDistance = (distanceInMeters?: number): string => {
    if (distanceInMeters === undefined) {
        return 'unbekannt';
    }

    return distanceFormatter.format(distanceInMeters / 1000);
}

export const toPicturePath = (pictureId?: string): string => {
    return PICTURE_API_PATH.replace('%s', pictureId || '');
}

export const sanitizedFileName = (originalName: string, index: number) => {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    return `${nameWithoutExt}_${index}.webp`;
};

export const formatFileSize = (sizeBytes: number, decimalPlaces = 2): string => {
    if (sizeBytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimalPlaces < 0 ? 0 : decimalPlaces;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(sizeBytes) / Math.log(k));
    return parseFloat((sizeBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const calculateCompletionPercent = (draft: { pictureIds: string[]; formData: Record<string, any> }): number => {
    const requiredFields = ['title', 'description', 'visibility', 'difficulty', 'tags', 'category', 'schedule'] as const;
    const filledFields = requiredFields.filter(field => {
        const value = draft.formData[field];
        return value !== undefined && value !== null && value !== '';
    });

    const formProgress = (filledFields.length / requiredFields.length) * 80;
    const pictureProgress = draft.pictureIds.length > 0 ? 20 : 0;

    return Math.round(formProgress + pictureProgress);
};