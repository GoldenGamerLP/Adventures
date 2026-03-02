<template>
  <div class="mx-auto max-w-2xl w-full relative">
    <template v-if="!userData">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageOffIcon />
          </EmptyMedia>
          <EmptyTitle>Benutzer nicht gefunden</EmptyTitle>
          <EmptyDescription>
            Der angeforderte Benutzer existiert nicht oder wurde gelöscht.
          </EmptyDescription>
          <EmptyContent>
            <Button variant="outline" as-child>
              <NuxtLink :to="{ name: 'index' }">
                Zur Startseite
              </NuxtLink>
            </Button>
          </EmptyContent>
        </EmptyHeader>
      </Empty>
    </template>
    <template v-else>
      <Button
        variant="default"
        size="icon"
        class="absolute top-4 left-4 z-50"
        as-child
      >
        <NuxtLink :to="{ name: 'index' }">
          <ChevronLeft />
          <span class="sr-only">Zurück zum Profil</span>
        </NuxtLink>
      </Button>
      <div class="absolute bg-linear-to-t from-background pointer-events-none inset-x-0 top-52 h-16"></div>


      <div class="w-full h-72 flex justify-center items-center">
        <img
          v-if="userData.backgroundPictureId"
          :src="toPicturePath(userData.backgroundPictureId)"
          alt="Hintergrundbild"
          class="w-full h-full object-cover"
        />
        <ImageOffIcon v-else class="text-muted-foreground" />
      </div>

      <div class="rounded-lg p-4 bg-background -mt-8 z-10 relative shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <header class="flex items-center gap-4 mb-4">
          <Avatar class="size-10">
            <AvatarFallback>
              <ImageOff />
            </AvatarFallback>
            <AvatarImage
              v-if="userData.profilePictureId"
              :src="toPicturePath(userData.profilePictureId)"
              alt="Profilbild"
            />
          </Avatar>
          <div>
            <h1 class="text-xl font-bold">
              Profil von {{ userData.name }}
            </h1>
            <p class="text-sm text-muted-foreground">
              {{ userData.header || 'Noch keine Profilbeschreibung...' }}
            </p>
          </div>
        </header>
        <RekaTabsRoot default-value="about" class="flex flex-col">
          <RekaTabsList
            class="relative shrink-0 flex mb-4 bg-accent p-2 rounded-lg"
            aria-label="Profile Tabs"
          >
            <RekaTabsIndicator
              class="absolute px-8 left-0 h-0.5 bottom-0 w-[var(--reka-tabs-indicator-size)] translate-x-[var(--reka-tabs-indicator-position)] translate-y-[1px] rounded-tr-lg rounded-tl-lg transition-all duration-300"
            >
              <div class="bg-primary w-full h-full"></div>
            </RekaTabsIndicator>
            <RekaTabsTrigger
              value="about"
              class="flex-1 flex items-center justify-center data-[state=active]:text-primary data-[state=active]:font-medium"
            >
              Über
            </RekaTabsTrigger>
            <RekaTabsTrigger
              value="adventures"
              class="flex-1 flex items-center justify-center data-[state=active]:text-primary data-[state=active]:font-medium"
            >
              Abenteuer
            </RekaTabsTrigger>
          </RekaTabsList>
          <RekaTabsContent value="about">
            <div class="space-y-8">
              <div>
                <h2 class="text-lg font-semibold mb-2">
                  Tags
                </h2>
                <ol v-if="userData.tags && userData.tags.length > 0" class="flex flex-wrap gap-2">
                  <Badge
                    v-for="tag in userData.tags"
                    :key="tag"
                    variant="secondary"
                    as-child
                  >
                    <li>
                      #{{ tag }}
                    </li>
                  </Badge>
                </ol>
              </div>
              <div>
                <h2 class="text-lg font-semibold mb-2">
                  Biografie
                </h2>
                <p v-if="userData.biography" class="text-sm text-muted-foreground line-clamp-2">
                  {{ userData.biography }}
                </p>
              </div>
              <Empty
                v-if="!userData.biography && (!userData.tags || userData.tags.length === 0)"
                class="pt-6"
              >
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ImageOffIcon />
                  </EmptyMedia>
                  <EmptyTitle>Keine Informationen</EmptyTitle>
                  <EmptyDescription>
                    Dieser Benutzer hat noch keine Informationen in seinem Profil hinzugefügt.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
              <p class="text-sm text-muted-foreground text-right">
                Beigetreten am
                <NuxtTime :datetime="userData.createdAt" :date-style="'full'" />
              </p>
            </div>
          </RekaTabsContent>
          <RekaTabsContent value="adventures">
            <AppAdventuresListByAuthor :author-id="authorId" />
          </RekaTabsContent>
        </RekaTabsRoot>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { toPicturePath } from "#shared/utils/SharedUtils";
import { ChevronLeft, ImageOff, ImageOffIcon } from 'lucide-vue-next';
import { TabsContent as RekaTabsContent, TabsIndicator as RekaTabsIndicator, TabsList as RekaTabsList, TabsRoot as RekaTabsRoot, TabsTrigger as RekaTabsTrigger } from 'reka-ui';

const authorId = useRoute().params.authorId as string;

const { data: userData, error } = await useFetch(`/api/v1/app/profile/${authorId}/public`);
</script>