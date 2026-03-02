
export type UserProfile = {
    _id: string;         // gleiche ID wie User
    userId: string;      // Referenz

    //Short header text, z.B. "Outdoor-Enthusiast", "Bücherwurm", etc.
    header?: string;
    //Längere Biografie, z.B. "Ich liebe es, neue Abenteuer zu erleben und meine Erfahrungen zu teilen..."
    biography?: string;
    // Interessen oder Stichworte, z.B. "Wandern", "Klettern", "Reisen", etc.
    tags?: string[];

    backgroundPictureId?: string;
}

export type UserSummary = {
    _id: string;
    name: string;
    profilePictureId?: string;
    createdAt: Date | string;
}

export type UserProfileWithMeta = UserProfile & UserSummary;