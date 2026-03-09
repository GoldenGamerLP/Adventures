<template>
  <Dialog>
    <DialogTrigger as-child>
      <slot></slot>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Ändere dein Hintergrundbild</DialogTitle>
        <DialogDescription>
          <Avatar>
            <AvatarFallback>
              <ImageOffIcon />
            </AvatarFallback>
            <AvatarImage :src="toPicturePath(model.backgroundPictureId)" alt="Hintergrundbild ändern" />
          </Avatar> Wähle ein neues Hintergrundbild aus, um es hochzuladen und zu verwenden. Unterstützte
          Formate
          sind JPG,
          PNG und WEBP mit einer maximalen Größe von 5MB.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" :disabled="isLoading" @click="open">
            Hintergrundbild ändern
          </Button>
          <Button variant="outline" :disabled="isLoading" @click="deleteBackgroundPicture">
            Hintergrundbild entfernen
          </Button>
        </DialogFooter>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { sanitizedFileName, toPicturePath } from "#shared/utils/SharedUtils";
import { useFileDialog } from '@vueuse/core';
import { ImageOffIcon } from 'lucide-vue-next';
import { compressImage } from "~/utils/PictureUtils";
import { MAX_FILE_SIZE_BYTES, SUPPORTED_FILE_TYPES } from '~~/shared/constants/Constants';
import type { UserProfile, UserProfileWithMeta } from "~~/shared/types/UserProfileTypes";


const model = defineModel<UserProfileWithMeta>({ required: true });

const { open, onChange: handleFilesChange } = useFileDialog({
  multiple: false,
  accept: SUPPORTED_FILE_TYPES.join(','),
});

const isLoading = ref(false);

const deleteBackgroundPicture = async () => {
  isLoading.value = true;
  try {
    await $fetch('/api/v1/app/profile/banner/delete', {
      method: 'DELETE',
    });

    model.value.backgroundPictureId = undefined;
  } catch (error) {
    alert('Beim Entfernen des Hintergrundbildes ist ein Fehler aufgetreten. Bitte versuche es erneut.');
    console.error('Error removing background picture:', error);
  } finally {
    isLoading.value = false;
  }
};

handleFilesChange(async (event: FileList | null) => {
  if (!event || event.length === 0) {
    return;
  }

  const file = event[0];
  isLoading.value = true;

  if (!file) {
    alert('Es wurde keine Datei ausgewählt. Bitte wähle eine Datei aus.');
    isLoading.value = false;
    return;
  }

  if (file?.size > MAX_FILE_SIZE_BYTES) {
    alert('Die ausgewählte Datei ist zu groß. Bitte wähle eine Datei mit maximal 5MB aus.');
    isLoading.value = false;
    return;
  }

  if (!SUPPORTED_FILE_TYPES.includes(file.name.split('.').pop()?.toLowerCase() || '')) {
    alert('Der ausgewählte Dateityp wird nicht unterstützt. Bitte wähle eine gültige Bilddatei aus.');
    isLoading.value = false;
    return;
  }

  const image = await compressImage(file);

  const formData = new FormData();
  formData.append('image', image, sanitizedFileName(file.name, 0));

  try {
    //Response is the new background picture id
    const response = await $fetch<UserProfile>('/api/v1/app/profile/banner/upload', {
      method: 'POST',
      body: formData,
    });

    model.value.backgroundPictureId = response.backgroundPictureId;
  } catch (error) {
    alert('Beim Hochladen des Hintergrundbildes ist ein Fehler aufgetreten. Bitte versuche es erneut.');
    console.error('Error uploading background picture:', error);
  } finally {
    isLoading.value = false;
  }
});
</script>