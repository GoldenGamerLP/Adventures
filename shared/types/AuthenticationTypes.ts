export type User = {
  _id: string;
  name: string;
  email: string;
  password_hash: number;

  // Leichtgewichtig - wird fast überall gebraucht
  profilePictureId?: string;

  createdAt: string;
  lastLogin: string;
  lastIP?: string;

  //Rollen und Berechtigungen
  roles: UserPermissionRoles[];
};

export enum SessionDetails {
  IP_ADDRESS = "ip_address",
  USER_AGENT = "user_agent",
  DEVICE = "device",
}

export enum UserPermissionRoles {
  SEEDING = "seeding",
  ADVENTURE_MODERATION = "adventure_moderation",
}

export type Session = {
  _id: string;
  user_id: string;
  expires_at: Date | string;
  created_at: Date | string;
  details: [SessionDetails, string][];
};