import { LoginSchema } from "#shared/schema/AuthenticationSchema";
import { constructSessionDetailsFromEvent } from "~~/server/utils/auth/authUtils";

export default defineEventHandler(async (event) => {
  const { success, data } = await readValidatedBody(
    event,
    LoginSchema.safeParseAsync,
  );

  if (!success) {
    throw createError({
      status: 400,
      statusText: "VALIDATION_ERROR",
      data: { code: "VALIDATION_ERROR" },
    });
  }

  const { email, password, "cf-turnstile-response": turnstileResponse } = data;

  // In Produktion: Turnstile-Validierung
  if (process.env.NODE_ENV === 'production') {
    if (!turnstileResponse) {
      throw createError({
        status: 400,
        statusText: "TURNSTILE_MISSING",
        data: { code: "TURNSTILE_MISSING" },
      });
    }

    const isTurnstileValid = await verifyTurnstileToken(turnstileResponse);
    if (!isTurnstileValid) {
      throw createError({
        status: 400,
        statusText: "TURNSTILE_INVALID",
        data: { code: "TURNSTILE_INVALID" },
      });
    }
  }

  const user = await verifyPassword(email, password);

  if (!user) {
    throw createError({
      status: 401,
      statusText: "INVALID_CREDENTIALS",
      data: { code: "INVALID_CREDENTIALS" },
    });
  }

  const session = await registerLogin(user, constructSessionDetailsFromEvent(event));

  const cookie = createSessionCookie(session._id);

  setCookie(event, cookie.name, cookie.value, cookie.attributes);

  setResponseStatus(event, 200, "Login successful");
});
