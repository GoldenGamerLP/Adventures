<template>
  <div class="mx-auto max-w-2xl w-full relative">
    <template v-if="!userData">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageOffIcon />
          </EmptyMedia>
          <EmptyTitle>{{ $t('not_found_title') }}</EmptyTitle>
          <EmptyDescription>
            {{ $t('not_found_description') }}
          </EmptyDescription>
          <EmptyContent>
            <Button variant="outline" as-child>
              <NuxtLink :to="{ name: 'index' }">
                {{ $t('common_actions_back_to_home') }}
              </NuxtLink>
            </Button>
            <AppNavigationGoBackButton :variant="'outline'" class="ml-2" :default-href="'/'" />
          </EmptyContent>
        </EmptyHeader>
      </Empty>
    </template>
    <template v-else>
      <AppNavigationGoBackButton :variant="'secondary'" class="absolute top-4 left-4 z-50" :default-href="'/'" />
      <div class="absolute bg-linear-to-t from-background pointer-events-none inset-x-0 top-52 h-16"></div>


      <div class="w-full h-72 flex justify-center items-center">
        <img
          v-if="userData.backgroundPictureId"
          :src="toPicturePath(userData.backgroundPictureId)"
          :alt="$t('common_background_image') as string"
          class="w-full h-full object-cover"
        />
        <ImageOffIcon v-else class="text-muted-foreground" />
      </div>

      <div class="rounded-lg p-4 bg-background -mt-8 z-10 relative shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border">
        <header class="flex items-center gap-4 mb-4">
          <Avatar class="size-10">
            <AvatarFallback>
              <ImageOff />
            </AvatarFallback>
            <AvatarImage
              v-if="userData.profilePictureId"
              :src="toPicturePath(userData.profilePictureId)"
              :alt="$t('common_profile_picture') as string"
            />
          </Avatar>
          <div class="min-w-0 flex-1">
            <h1 class="text-lg font-bold truncate">
              {{ userData.name }}
            </h1>
            <p class="text-xs text-muted-foreground">
              {{ $t('common_joined') }}
              {{ td(userData.createdAt, { dateStyle: 'medium', timeStyle: 'short' }) }}
            </p>
          </div>
        </header>
        <RekaTabsRoot :default-value="useRoute().hash.slice(1) || 'about'" class="flex flex-col">
          <RekaTabsList class="relative shrink-0 flex mb-4 bg-accent p-2 rounded-lg" :aria-label="$t('tabs_aria')">
            <RekaTabsIndicator
              class="absolute px-8 left-0 h-0.5 bottom-0 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position) translate-y-px rounded-t-lg transition-all duration-300"
            >
              <div class="bg-primary w-full h-full"></div>
            </RekaTabsIndicator>
            <RekaTabsTrigger
              value="about"
              class="flex-1 flex items-center justify-center data-[state=active]:text-primary data-[state=active]:font-medium"
            >
              {{ $t('tabs_about') }}
            </RekaTabsTrigger>
            <RekaTabsTrigger
              value="adventures"
              class="flex-1 flex items-center justify-center data-[state=active]:text-primary data-[state=active]:font-medium"
            >
              {{ $t('tabs_adventures') }}
            </RekaTabsTrigger>
            <RekaTabsTrigger
              value="adventurelists"
              class="flex-1 flex items-center justify-center data-[state=active]:text-primary data-[state=active]:font-medium"
            >
              {{ $t('tabs_adventure_lists') }}
            </RekaTabsTrigger>
          </RekaTabsList>
          <RekaTabsContent value="about">
            <div class="space-y-8">
              <div>
                <h2 class="text-lg font-semibold mb-2">
                  {{ $t('about_interests') }}
                </h2>
                <AppProfileInterestsPreview :interests="userData.interests" />
              </div>
              <div>
                <h2 class="text-lg font-semibold mb-2">
                  {{ $t('about_biography') }}
                </h2>
                <p v-if="userData.biography" class="text-sm text-muted-foreground line-clamp-2">
                  {{ userData.biography }}
                </p>
              </div>
              <Empty
                v-if="!userData.biography && (!userData.interests || userData.interests.length === 0)"
                class="pt-6"
              >
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ImageOffIcon />
                  </EmptyMedia>
                  <EmptyTitle>{{ $t('empty_info_title') }}</EmptyTitle>
                  <EmptyDescription>
                    {{ $t('empty_info_description') }}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          </RekaTabsContent>
          <RekaTabsContent value="adventures">
            <AppAdventuresListByAuthor :author-id="authorId" />
          </RekaTabsContent>
          <RekaTabsContent value="adventurelists">
            <LazyAppPlaylistsPublicShowPlaylists />
          </RekaTabsContent>
        </RekaTabsRoot>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { toPicturePath } from "#shared/utils/SharedUtils";
import { ImageOff, ImageOffIcon } from 'lucide-vue-next';
import { TabsContent as RekaTabsContent, TabsIndicator as RekaTabsIndicator, TabsList as RekaTabsList, TabsRoot as RekaTabsRoot, TabsTrigger as RekaTabsTrigger } from 'reka-ui';

const { $t, td } = useI18n();

const authorId = useRoute().params.authorId as string;

const { data: userData, error } = await useFetch(`/api/v1/app/profile/${authorId}/public`);

useHead({
  title: userData.value ? userData.value.name : $t('common_app_name') as string,
  titleTemplate(title) {
    return title ? `${title} - ${$t('common_app_name')}` : $t('common_app_name') as string;
  },
});

definePageMeta({
  layout: 'navigation-bar',
});
</script>