<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <slot></slot>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('component_profile_avatar_title') }}</DialogTitle>
        <DialogDescription>
          <Avatar>
            <AvatarFallback>
              <ImageOffIcon />
            </AvatarFallback>
            <AvatarImage :src="toPicturePath(model.profilePictureId)" :alt="t('component_profile_avatar_alt')" />
          </Avatar>
          {{ t('component_profile_avatar_description') }}
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" :disabled="isLoading" @click="open">
            {{ t('component_profile_avatar_change') }}
          </Button>
          <Button variant="outline" :disabled="isLoading" @click="deleteProfilePicture">
            {{ t('component_profile_avatar_remove') }}
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

const { t } = useI18n();

const isOpen = ref(false);

const { open, onChange: handleFilesChange } = useFileDialog({
  multiple: false,
  accept: SUPPORTED_FILE_TYPES.join(','),
});

const isLoading = ref(false);

const deleteProfilePicture = async () => {
  isLoading.value = true;
  try {
    await $fetch('/api/v1/app/profile/avatar/delete', {
      method: 'DELETE',
    });

    model.value.profilePictureId = undefined;
  } catch (error) {
    alert(t('component_profile_avatar_remove_failed'));
    console.error('Error removing profile picture:', error);
  } finally {
    isLoading.value = false;
  }
};

handleFilesChange(async (event: FileList | null) => {
  if (!event || event.length === 0 || isLoading.value) {
    return;
  }

  const file = event[0];
  isLoading.value = true;

  if (!file) {
    alert(t('component_profile_file_none_selected'));
    isLoading.value = false;
    return;
  }

  if (file?.size > MAX_FILE_SIZE_BYTES) {
    alert(t('component_profile_file_too_large'));
    isLoading.value = false;
    return;
  }

  if (!SUPPORTED_FILE_TYPES.includes(file.name.split('.').pop()?.toLowerCase() || '')) {
    alert(t('component_profile_file_invalid_type'));
    isLoading.value = false;
    return;
  }

  const image = await compressImage(file);
  if (!image) {
    alert(String(t('component_profile_avatar_upload_failed')));
    isLoading.value = false;
    return;
  }

  const formData = new FormData();
  formData.append('image', image, sanitizedFileName(file.name, 0));

  try {
    const response = await $fetch<UserProfile>('/api/v1/app/profile/avatar/upload', {
      method: 'POST',
      body: formData,
    });

    model.value.profilePictureId = response.profilePictureId;
    useUser().value!.profilePictureId = response.profilePictureId;
    isOpen.value = false;
  } catch (error) {
    alert(t('component_profile_avatar_upload_failed'));
    console.error('Error uploading profile picture:', error);
  } finally {
    isLoading.value = false;
  }
});
</script>