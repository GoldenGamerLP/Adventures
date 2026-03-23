import type { Adventure } from "./AdventureTypes";
import type { UserSummary } from "./UserProfileTypes";

export type AdventureList = UserList | VirtualList;

interface BaseList {
    _id: string;
    name: string;
    description: string;
    listType: "user" | "virtual";
    ownerId: string;
}

/**
 * UserList: Von Nutzern erstellte Listen, die Abenteuer enthalten können. Sie haben Berechtigungen und Sichtbarkeitsoptionen.
 */
export interface UserList extends BaseList {
    listType: "user";
    createdAt: string;
    updatedAt: string;
    permissions: {
        canRead: string[];
        canWrite: string[];
    };
    visibility: "private" | "public" | "notListed";
}

/**
 * VirtualList: Systemgenerierte Listen, die auf bestimmten Kriterien basieren (z.B. "Liked Adventures"). Sie sind nicht bearbeitbar und haben keine Berechtigungen, da sie automatisch generiert werden.
 */
export interface VirtualList extends BaseList {
    listType: "virtual";
    systemKey: "liked" | "history"; // später erweiterbar: "recentlyViewed" | ...
}

type ListMeta = {
    entryCount: number;
    previewImages: string[];
    owner: UserSummary;
};

export type WithMeta<T extends AdventureList = AdventureList> = T & ListMeta;
export type AdventureListWithMeta = WithMeta;

export interface AdventureListEntry {
    _id: string;
    adventureListId: string;
    adventureId: string;
    order: number; // statt string
    createdAt: string;
    updatedAt: string;
    populatedAdventure?: Adventure; // typo korrigiert
}

