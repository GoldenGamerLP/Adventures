<template>
  <Card>
    <CardHeader>
      <CardTitle>Bilder</CardTitle>
      <CardDescription>Lade Bilder hoch um dein Abenteuer zu dokumentieren</CardDescription>
    </CardHeader>
    <CardContent>
      <Alert v-if="error" variant="destructive" class="mb-4">
        <FileExclamationPointIcon />
        <AlertTitle>{{ error?.titel }}</AlertTitle>
        <AlertDescription>
          {{ error?.message }}
        </AlertDescription>
      </Alert>
      <div
        class="w-full h-72 bg-muted rounded-lg relative border-dashed border-2 border-input flex items-center justify-center mb-4"
      >
        <img
          v-if="model.length > 0"
          :src="toPicturePath(model[0]!)"
          alt="Titelbild Vorschau"
          class="w-full object-cover rounded-lg h-full aspect-video"
        />
        <span
          class="absolute top-[50%] right-[50%] translate-x-[50%] translate-y-[-50%] text-sm text-primary p-4 bg-accent/50 rounded-lg"
        >Titelbild</span>
      </div>
      <div ref="imageContainer" class="flex flex-row flex-nowrap overflow-x-auto gap-4">
        <Button
          type="button"
          :disabled="model.length >= DRAFT_CONFIG.MAX_PICTURES_PER_DRAFT"
          variant="outline"
          class="size-16 flex-col"
          @click="open"
        >
          <PlusIcon class="size-6 text-primary" />
          <span class="text-xs text-muted-foreground mt-1">Hinzufügen</span>
        </Button>
        <div
          v-for="(image, idx) in model"
          :key="idx"
          :index="idx"
          class="flex-none relative"
        >
          <img
            :src="toPicturePath(image)"
            :alt="lookupImageId(image)?.meta.fileName"
            :title="lookupImageId(image)?.meta.fileName"
            class="object-cover rounded-lg aspect-video h-16"
          />
          <button
            class="bg-background text-foreground rounded-bl-lg rounded-tr-lg absolute -top-1 -right-1 z-20 p-2"
            @click="removeRegisteredFile(idx)"
          >
            <Trash2Icon class="size-4" />
            <span class="sr-only">Lösche {{ idx }}</span>
          </button>
        </div>
        <div v-for="(image, idx) in previews" :key="`preview-${idx}`" class="flex-none relative opacity-50">
          <img
            :src="image.url"
            :alt="image.name"
            :title="image.name"
            class="object-cover rounded-lg aspect-video h-16"
          />
          <div
            class="bg-background text-foreground rounded-bl-lg rounded-tr-lg absolute -top-1 -right-1 z-20 p-2"
          >
            <Trash class="size-4" />
            <span class="sr-only">Vorschau {{ idx }}</span>
          </div>
        </div>
      </div>
      <div class="mt-4">
        <Progress :model-value="compPercentageUsed" class="mt-1" />
        <p class="mt-2 text-sm text-muted-foreground text-right">
          Bilder verwendet: {{ model.length }} / {{ DRAFT_CONFIG.MAX_PICTURES_PER_DRAFT }} &nbsp;|&nbsp;
          Speicher verwendet: {{ formatFileSize(accumulatedFileSize) }} / {{
            formatFileSize(MAX_BUNDLE_SIZE_BYTES) }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>

<script lang="ts" setup>
import { DRAFT_CONFIG, MAX_BUNDLE_SIZE_BYTES, SUPPORTED_FILE_TYPES } from '#shared/constants/Constants';
import type { DraftPicture } from "#shared/types/PictureTypes";
import { formatFileSize, sanitizedFileName, toPicturePath } from "#shared/utils/SharedUtils";
import { useDebounceFn, useFileDialog } from '@vueuse/core';
import { useDragAndDrop } from 'fluid-dnd/vue';
import { FileExclamationPointIcon, PlusIcon, Trash, Trash2Icon } from 'lucide-vue-next';
import { compressImages } from '~~/app/utils/PictureUtils';

const props = defineProps<{
    draftId: string;
    draftPictures?: DraftPicture[];
}>();

const emit = defineEmits<{
    'order-changed': [pictureIds: string[]]
}>();
const model = defineModel<string[]>({ default: () => [] });
const draftPictures = toRef<DraftPicture[]>(props.draftPictures || []);

const notRegisteredImages = ref<{ url: string; name: string; size: number; type: string; file: File }[]>([]);

const [imageContainer] = useDragAndDrop(model, {
    direction: 'horizontal',
    handlerSelector: '.dragHandler',
});

const error = ref<{ titel: string; message: string }>();

const { open, onChange: handleFilesChange } = useFileDialog({
    multiple: true,
    accept: SUPPORTED_FILE_TYPES.join(','),
    capture: 'camera',
    directory: false,
});

handleFilesChange((event: FileList | null) => {
    if (!event) return;
    const list: FileList = event;

    //Start off with the registered file size
    let accSize = accRegisteredFileSize.value;
    for (let i = 0; i < list.length; i++) {
        const currentFile = list.item(i);
        if (!currentFile) continue;
        if (imageTypeIsSupported(currentFile.type) && (currentFile?.size || 0) <= MAX_BUNDLE_SIZE_BYTES) {
            notRegisteredImages.value.push({
                url: URL.createObjectURL(currentFile),
                name: currentFile.name,
                size: currentFile.size,
                type: currentFile.type,
                file: currentFile,
            });
        } else {
            error.value = {
                titel: 'Ungültige Datei',
                message: `Die Datei "${currentFile?.name}" ist entweder zu groß oder hat ein nicht unterstütztes Format.`
            };
        }

        accSize += currentFile?.size || 0;
    }

    if (accSize > MAX_BUNDLE_SIZE_BYTES) {
        error.value = {
            titel: 'Zu große Dateibündel',
            message: `Die ausgewählten Dateien überschreiten die maximale Bündelgröße von ${formatFileSize(MAX_BUNDLE_SIZE_BYTES)}.`
        };
        return;
    }
});

const lookupImageId = (imageId: string) => {
    return draftPictures.value.find((pic) => pic._id === imageId);
};

const imageTypeIsSupported = (type: string) => {
    const lowerType = type.toLowerCase();
    return SUPPORTED_FILE_TYPES.some((ext) => lowerType.includes(ext));
};

const accumulatedFileSize = computed(() =>
    notRegisteredImages.value.reduce((sum, file) => sum + (file.size || 0), 0) + accRegisteredFileSize.value
);

const accRegisteredFileSize = computed(() =>
    model.value.reduce((sum, picture) => sum + (lookupImageId(picture)?._id ? lookupImageId(picture)?.meta.size || 0 : 0), 0)
);

const compPercentageUsed = computed(() =>
    (accumulatedFileSize.value / MAX_BUNDLE_SIZE_BYTES) * 100
);

const previews = computed(() => {
    if (!notRegisteredImages.value) return [];

    return notRegisteredImages.value.map((currentItem, idx) => {
        return {
            url: currentItem.url,
            name: currentItem.name,
            size: currentItem.size,
            type: currentItem.type,
            file: currentItem.file,
        }
    });
});

const removeRegisteredFile = async (index: number) => {
    const removedId = model.value[index];
    if (!removedId) return;

    try {
        // Entferne vom Server
        await $fetch(`/api/v1/app/adventures/drafts/${props.draftId}/pictures/${removedId}`, {
            method: 'DELETE',
        });

        // Entferne aus lokalem State
        model.value.splice(index, 1);
        const picIndex = draftPictures.value.findIndex(p => p._id === removedId);
        if (picIndex !== -1) {
            draftPictures.value.splice(picIndex, 1);
        }

        // Emit neue Reihenfolge
        emit('order-changed', [...model.value]);
    } catch (err: any) {
        error.value = {
            titel: 'Löschen fehlgeschlagen',
            message: err?.data?.message || 'Bild konnte nicht gelöscht werden.'
        };
    }
};

// Watch für Drag-and-Drop Reihenfolge-Änderungen
const debouncedOrderSave = useDebounceFn(async (newOrder: string[]) => {
    try {
        await $fetch(`/api/v1/app/adventures/drafts/${props.draftId}/save`, {
            method: 'POST',
            body: {
                pictureIds: newOrder,
            },
        });
        emit('order-changed', newOrder);
    } catch (err) {
        console.error('Reihenfolge speichern fehlgeschlagen:', err);
    }
}, 1000);

// Reagiere auf Drag-and-Drop (useDragAndDrop ändert model.value)
watch(() => [...model.value], (newOrder, oldOrder) => {
    // Nur wenn sich die Reihenfolge geändert hat (nicht bei Add/Remove)
    if (newOrder.length === oldOrder.length &&
        newOrder.some((id, i) => id !== oldOrder[i])) {
        debouncedOrderSave(newOrder);
    }
}, { deep: true });


const registerFiles = async () => {
    if (!props.draftId) {
        error.value = {
            titel: 'Fehler',
            message: 'Draft-ID fehlt. Bitte lade die Seite neu.'
        };
        return;
    }

    try {
        const compressedFiles: Blob[] = await compressImages(notRegisteredImages.value.map(file => file.file));
        const formData = new FormData();

        compressedFiles.forEach((blob, index) => {
            const fileName = notRegisteredImages.value[index]!.name;
            formData.append('pictures', blob, sanitizedFileName(fileName, index));
        });

        // Separater Draft-Upload-Endpoint
        const uploadedPictures = await $fetch<DraftPicture[]>(
            `/api/v1/app/adventures/drafts/${props.draftId}/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        // Füge hochgeladene Bilder zum Model hinzu
        model.value.push(...uploadedPictures.map(pic => pic._id));
        draftPictures.value.push(...uploadedPictures);

        // Entferne Previews
        notRegisteredImages.value.forEach((file) => {
            URL.revokeObjectURL(file.url);
        });
        notRegisteredImages.value = [];

        // Clear error nach erfolgreichem Upload
        error.value = undefined;
    } catch (uploadError: any) {
        console.error('Fehler beim Hochladen der Bilder:', uploadError);
        error.value = {
            titel: 'Upload fehlgeschlagen',
            message: uploadError?.data?.message || 'Die Bilder konnten nicht hochgeladen werden. Bitte versuche es erneut.'
        };
    }
}

// Auto-Upload wenn neue Dateien hinzugefügt werden
watch(() => notRegisteredImages.value.length, async (newLength, oldLength) => {
    if (newLength > oldLength && newLength > 0) {
        // Warte kurz falls Benutzer mehrere Dateien auswählt
        await new Promise(resolve => setTimeout(resolve, 500));
        await registerFiles();
    }
});

onUnmounted(() => {
    previews.value.forEach((image) => {
        URL.revokeObjectURL(image.url);
    });
});
</script>