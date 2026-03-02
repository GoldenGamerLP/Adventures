import type { Session } from "#shared/types/AuthenticationTypes";
import type { UserSummary } from "~~/shared/types/UserProfileTypes";
import {
  findSession,
  getUserById,
  sessionCookieName,
} from "../utils/auth/authUtils";

export default defineEventHandler(async (event) => {
  // Origin verification
  if (event.method !== "GET") {
    const originHeader = getHeader(event, "Origin") ?? null;
    const hostHeader = getHeader(event, "Host") ?? null;
    if (!originHeader || !hostHeader) {
      return event.node.res.writeHead(403).end();
    }
  }

  const sessionId = getCookie(event, sessionCookieName) ?? null;
  if (!sessionId) {
    event.context.session = null;
    event.context.user = null;
    return;
  }

  // Get session with roles
  const session = await findSession(sessionId);
  if (!session || session.expires_at < new Date()) {
    setCookie(event, sessionCookieName, "", { expires: new Date(0) });
    event.context.session = null;
    event.context.user = null;
    return;
  }

  // Get user data
  const user = await getUserById(session.user_id);
  if (!user) {
    setCookie(event, sessionCookieName, "", { expires: new Date(0) });
    event.context.session = null;
    event.context.user = null;
    return;
  }

  event.context.session = session;
  event.context.user = user;
});

declare module "h3" {
  interface H3EventContext {
    user: UserSummary | null;
    session: Session | null;
  }
}
