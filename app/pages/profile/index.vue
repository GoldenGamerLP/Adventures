<template>
  <div class="max-w-2xl mx-auto w-full">
    <Empty v-if="!userData">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchAlert />
        </EmptyMedia>
        <EmptyTitle>{{ $t('empty_title') }}</EmptyTitle>
        <EmptyDescription>
          {{ $t('empty_description') }}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
    <main v-else class="relative">
      <!-- Top action bar -->
      <div class="absolute top-4 inset-x-4 z-20 flex items-center justify-between">
        <AppNavigationGoBackButton :variant="'secondary'" />
        <Button variant="secondary" size="icon" @click="settingsOpen = true">
          <Settings />
          <span class="sr-only">{{ $t('sr_settings') }}</span>
        </Button>
      </div>

      <!-- Background image -->
      <div class="sticky top-0">
        <div class="w-full h-48 sm:h-72 flex justify-center items-center ">
          <template v-if="userData.backgroundPictureId">
            <img
              :src="toPicturePath(userData.backgroundPictureId)"
              alt="Hintergrundbild"
              class="w-full h-full object-cover"
            />
          </template>
          <template v-else>
            <div
              class="w-full h-full bg-linear-to-r from-primary/20 to-secondary/20 rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center gap-2"
            >
              <ImageOffIcon class="size-6 text-muted-foreground" />
              <span class="text-sm text-muted-foreground">{{ $t('common_no_background_image') }}</span>
            </div>
          </template>
          <AppProfileChangeBackgroundImage v-model="userData">
            <Button size="sm" class="absolute bottom-8 right-4 z-20">
              <EditIcon />
              {{ $t('background_change') }}
            </Button>
          </AppProfileChangeBackgroundImage>
        </div>
        <div class="absolute bg-linear-to-t from-background pointer-events-none inset-x-0 top-36 sm:top-56 h-16"></div>
      </div>

      <!-- Content card -->
      <div class="p-4 bg-background -mt-6 z-10 relative shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <!-- Profile header -->
        <header class="flex items-center gap-4 mb-2">
          <AppProfileImage v-model="userData" />
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

        <!-- Tabs -->
        <RekaTabsRoot :default-value="useRoute().hash.slice(1) || 'about'" class="flex flex-col">
          <RekaTabsList
            class="relative shrink-0 flex mb-4 p-1.5 rounded-lg text-sm overflow-x-auto overflow-y-hidden justify-around bg-muted"
            aria-label="Profil-Tabs"
          >
            <RekaTabsIndicator
              class="absolute px-8 left-0 h-0.5 bottom-0 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position) translate-y-px rounded-t-lg transition-all duration-300"
            >
              <div class="bg-primary w-full h-full"></div>
            </RekaTabsIndicator>
            <RekaTabsTrigger
              value="about"
              class="flex-1 flex items-center justify-center py-1.5 rounded-md data-[state=active]:text-primary data-[state=active]:font-medium"
            >
              {{ $t('tabs_about') }}
            </RekaTabsTrigger>
            <RekaTabsTrigger
              value="adventures"
              class="flex-1 flex items-center justify-center py-1.5 rounded-md data-[state=active]:text-primary data-[state=active]:font-medium"
            >
              {{ $t('tabs_adventures') }}
            </RekaTabsTrigger>
            <RekaTabsTrigger
              value="playlists"
              class="flex-1 flex items-center justify-center py-1.5 rounded-md data-[state=active]:text-primary data-[state=active]:font-medium"
            >
              {{ $t('tabs_playlists') }}
            </RekaTabsTrigger>
          </RekaTabsList>

          <!-- Über -->
          <RekaTabsContent value="about">
            <div class="space-y-6">
              <!-- Interests -->
              <section>
                <h2 class="text-base font-semibold">
                  {{ $t('interests_title') }}
                </h2>
                <p class="text-sm text-muted-foreground mb-3">
                  {{ $t('interests_description', { max: MAX_INTERESTS }) }}
                </p>
                <AppProfileInterestSelector :max="MAX_INTERESTS" :interests="userData.interests" />
              </section>

              <Separator />

              <!-- Biography -->
              <section>
                <AppProfileBiographyEditor :initial-biography="userData.biography" />
              </section>

              <Separator />

              <!-- Profile picture -->
              <section class="flex items-center gap-4">
                <Avatar class="size-12 shrink-0">
                  <AvatarFallback>
                    <ImageOffIcon class="size-5" />
                  </AvatarFallback>
                  <AvatarImage
                    v-if="userData.profilePictureId"
                    :src="toPicturePath(userData.profilePictureId)"
                    alt="Profilbild"
                  />
                </Avatar>
                <div class="flex flex-col min-w-0 flex-1">
                  <span class="text-sm font-semibold">{{ $t('common_profile_picture') }}</span>
                  <span class="text-xs text-muted-foreground">{{ $t('profile_picture_description') }}</span>
                </div>
                <AppProfileImage v-model="userData">
                  <Button variant="outline" size="sm" class="shrink-0">
                    {{ $t('common_actions_edit') }}
                  </Button>
                </AppProfileImage>
              </section>
            </div>
          </RekaTabsContent>

          <!-- Abenteuer -->
          <RekaTabsContent value="adventures">
            <LazyAppProfileAdventuresList :author-id="userData._id" />
          </RekaTabsContent>

          <!-- Playlists -->
          <RekaTabsContent value="playlists">
            <AppPlaylistsShowPlaylists />
          </RekaTabsContent>
        </RekaTabsRoot>
      </div>

      <!-- Settings Sheet -->
      <Sheet v-model:open="settingsOpen">
        <SheetContent side="bottom" class="max-w-2xl mx-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{{ $t('settings_title') }}</SheetTitle>
            <SheetDescription>
              {{ $t('settings_description') }}
            </SheetDescription>
          </SheetHeader>
          <div class="space-y-2 py-4">
            <Item>
              <ItemMedia variant="icon">
                <Palette />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{{ $t('settings_theme_title') }}</ItemTitle>
                <ItemDescription>{{ $t('settings_theme_description') }}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <AppMiscThemeToggle variant="outline" />
              </ItemActions>
            </Item>
            <ItemSeparator />
            <Item>
              <ItemMedia variant="icon">
                <Languages />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{{ $t('settings_language_title') }}</ItemTitle>
                <ItemDescription>{{ $t('settings_language_description') }}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <AppMiscLanguageSwitcher />
              </ItemActions>
            </Item>
            <ItemSeparator />
            <Item>
              <ItemMedia variant="icon">
                <LogOut class="text-destructive" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle class="text-destructive">
                  {{ $t('common_actions_logout') }}
                </ItemTitle>
                <ItemDescription>{{ $t('settings_logout_description') }}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <AppAuthLogoutButton />
              </ItemActions>
            </Item>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { toPicturePath } from '#shared/utils/SharedUtils';
import { EditIcon, ImageOffIcon, Languages, LogOut, Palette, SearchAlert, Settings } from 'lucide-vue-next';
import {
  TabsContent as RekaTabsContent,
  TabsIndicator as RekaTabsIndicator,
  TabsList as RekaTabsList,
  TabsRoot as RekaTabsRoot,
  TabsTrigger as RekaTabsTrigger,
} from 'reka-ui';
import type { UserProfileWithMeta } from '~~/shared/types/UserProfileTypes';
import { MAX_INTERESTS } from '~~/shared/types/UserProfileTypes';

definePageMeta({
  layout: 'navigation-bar',
  middleware: 'auth-requirement',
});


const { $t, td } = useI18n();
const user = useUser();
const settingsOpen = ref(false);

const { data: userData } = await useFetch<UserProfileWithMeta>(
  `/api/v1/app/profile/${user.value?._id}/public`,
);

useHead({
  title: $t('common_nav_profile') as string,
  titleTemplate(title) {
    return title ? `${title} - ${$t('common_app_name')}` : $t('common_app_name') as string;
  },
});
</script>