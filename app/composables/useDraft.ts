import { parseZonedDateTime } from "@internationalized/date";
import type { AdventureDraftStored } from "~~/shared/types/DraftTypes";

export const useDraft = () => {
    const draft = ref<AdventureDraft | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const loadDraft = async (draftId: string) => {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await $fetch(`/api/v1/app/adventures/drafts/${draftId}`);
            draft.value = parseAdventureDraft(response as AdventureDraftStored);
        } catch (err) {
            error.value = 'Fehler beim Laden des Entwurfs';
        } finally {
            isLoading.value = false;
        }
    };

    const saveDraft = async (draftData: AdventureDraft) => {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await $fetch(`/api/drafts/${draftData._id}`, {
                method: 'POST',
                body: draftData,
            });
            draft.value = response as AdventureDraft;
        } catch (err) {
            error.value = 'Fehler beim Speichern des Entwurfs';
        }
        finally {
            isLoading.value = false;
        }
    };

    const parseAdventureDraft = (data: AdventureDraftStored): AdventureDraft => {
        const { formData } = data;
        const { schedule } = formData;

        if (!schedule?.type) {
            throw new Error("Ungültiger Entwurf: schedule.type fehlt");
        }

        return {
            ...data,
            formData: {
                ...data.formData,
                schedule: {
                    ...schedule,
                    type: schedule.type,
                    startDate: schedule.startDate ? parseZonedDateTime(schedule.startDate) : undefined,
                    endDate: schedule.endDate ? parseZonedDateTime(schedule.endDate) : undefined,
                },
            },
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            expiresAt: new Date(data.expiresAt),
        };
    }


    return {
        draft,
        isLoading,
        error,
        loadDraft,
        saveDraft,
    };
}