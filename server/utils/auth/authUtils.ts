import type { RegisterSchemaType } from "#shared/schema/AuthenticationSchema";
import type { Session, User } from "#shared/types/AuthenticationTypes";
import { SessionDetails } from "#shared/types/AuthenticationTypes";
import type { EventHandlerRequest, H3Event } from "h3";
import type { Collection } from "mongodb";
import { ObjectId } from "mongodb";
import type { UserSummary } from "~~/shared/types/UserProfileTypes";
import database from "../database/DBUtils";
import { createUserProfile } from "../profiles/UserProfileUtils";

export const sessionCookieName = "auth_session";
export const expireAfterSeconds = 60 * 60 * 24 * 7; // 1 week

export const users = database.collection("users") as Collection<User>;
const sessions = database.collection("sessions") as Collection<Session>;

export function userNameToId(userMail: string) {
  return users.findOne({
    mail: userMail,
  });
}

export const registerLogin = async (
  user: User,
  sessionDetails: [SessionDetails, string][] | undefined,
): Promise<Session> => {
  //await setLastLogin(user._id, ip);
  return createSession(user._id, sessionDetails);
};

const setLastLogin = (userId: string, sessionDetails: [SessionDetails, string][] | undefined,
) => {
  return users.updateOne(
    { _id: userId },
    { $set: { last_login: new Date().toUTCString() } }
  );
};

export async function createUser(userToCreate: RegisterSchemaType, currentIp: string | undefined) {
  const user: User = {
    _id: new ObjectId().toHexString(),
    email: userToCreate.email.toLowerCase(),
    name: userToCreate.name,
    password_hash: hashPassword(userToCreate.password),
    createdAt: new Date().toUTCString(),
    lastLogin: new Date().toUTCString(),
    lastIP: currentIp,
  };

  const response = await users.insertOne(user);
  await createUserProfile(user._id);
  return response.acknowledged ? { user } : null;
}

export async function getSessionsByUserId(userId: string) {
  return sessions.find({ user_id: userId }).toArray();
}

/**
 * Updates the Profile Picture of a user. Returns the old user document before the update for deleting the old profile picture if it exists.
 * @param userId 
 * @param pictureId 
 * @returns 
 */
export const updateProfilePicture = async (userId: string, pictureId?: string) => {
  return users.findOneAndUpdate(
    { _id: userId },
    { $set: { "profilePictureId": pictureId } },
    { returnDocument: "before" }
  );
}

export async function invalidateSession(sessionId: string, userId?: string) {
  const session = await sessions.findOne({ _id: sessionId });

  if (!session || (userId && session.user_id !== userId)) {
    throw new Error("Session not found");
  }

  return sessions.deleteOne({ _id: sessionId });
}

export async function invalidateAllSessionsForUser(userId: string) {
  return sessions.deleteMany({ user_id: userId });
}

function verifyHash(hashedPassword: number, password: string) {
  return cyrb53(password) === hashedPassword;
}

function hashPassword(password: string) {
  return cyrb53(password);
}

export const findSession = async (sessionId: string) => {
  return sessions.findOne({ _id: sessionId });
};

export async function getUserById(
  userId: string
): Promise<UserSummary | null> {
  return users.findOne(
    { _id: userId },
    {
      projection: {
        _id: 1,
        email: 1,
        name: 1,
        profilePictureId: 1,
      },
    }
  ) as Promise<UserSummary | null>;
}

export async function createSession(
  userIdentity: string,
  sessionDetails: [SessionDetails, string][] | undefined
) {
  await sessions.deleteMany({ user_id: userIdentity });

  const session: Session = {
    _id: new ObjectId().toHexString(),
    user_id: userIdentity,
    expires_at: new Date(Date.now() + expireAfterSeconds * 1000),
    created_at: new Date(),
    details: sessionDetails || [],
  };

  await sessions.insertOne(session);
  return session;
}

interface SessionCookie {
  name: string;
  value: string;
  attributes: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    expires: Date;
  };
}

export function createSessionCookie(sessionId: string): SessionCookie {
  return {
    name: sessionCookieName,
    value: sessionId,
    attributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(Date.now() + expireAfterSeconds * 1000),
    },
  };
}

export const verifyPassword = async (
  mail: string,
  password: string
): Promise<User | null> => {
  const user = await users.findOne({ email: mail.toLowerCase() });
  if (!user) return null;

  if (!verifyHash(user.password_hash, password)) return null;

  return user;
};

export function usernameToUserIdentity(email: string) {
  return users.findOne({ email: email.toLowerCase() });
}

export const constructSessionDetailsFromEvent = (event: H3Event<EventHandlerRequest>) => {
  const details: [SessionDetails, string][] = [];

  const ip = event.node.req.headers["x-forwarded-for"] || event.node.req.socket.remoteAddress;
  if (ip) {
    details.push([SessionDetails.IP_ADDRESS, Array.isArray(ip) ? ip[0] : ip]);
  }

  const userAgent = event.node.req.headers["user-agent"];
  if (userAgent) {
    details.push([SessionDetails.USER_AGENT, userAgent]);
  }

  const device = event.node.req.headers["sec-ch-ua-platform"];
  if (device) {
    details.push([SessionDetails.DEVICE, Array.isArray(device) ? device[0] : device]);
  }

  return details;
}

export const searchForUser = async (
  userMail: string
): Promise<UserSummary[] | null> => {
  const user = await users.findOne(
    { mail: userMail },
    { projection: { _id: 1, mail: 1, name: 1, lastname: 1 } }
  );

  if (!user) return [];

  return [
    {
      _id: user._id,
      name: user.name,
      profilePictureId: user.profilePictureId,
    },
  ];
};

const cyrb53 = (str: string, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
