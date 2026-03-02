import { RegisterSchema } from "#shared/schema/AuthenticationSchema";
import { constructSessionDetailsFromEvent } from "~~/server/utils/auth/authUtils";

export default defineEventHandler(async (event) => {
  const { success, data } = await readValidatedBody(
    event,
    RegisterSchema.safeParseAsync
  );

  if (!success) {
    throw createError({
      status: 400,
      statusText: "VALIDATION_ERROR",
      data: { code: "VALIDATION_ERROR" },
    });
  }

  const { "cf-turnstile-response": turnstileResponse } = data;

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

  const { email } = data;

  // Check if passwords match - maybe redundant due to schema validation
  if (data.password !== data.confirmPassword) {
    throw createError({
      status: 400,
      statusText: "PASSWORDS_DO_NOT_MATCH",
      data: { code: "PASSWORDS_DO_NOT_MATCH" },
    });
  }

  // Check if user exists
  const existingUser = await usernameToUserIdentity(email);
  if (existingUser) {
    throw createError({
      status: 409,
      statusText: "EMAIL_IN_USE",
      data: { code: "EMAIL_IN_USE" },
    });
  }

  // Create new user
  const result = await createUser(data, getRequestIP(event));

  if (!result) {
    throw createError({
      status: 500,
      statusText: "USER_CREATE_FAILED",
      data: { code: "USER_CREATE_FAILED" },
    });
  }

  // Create session and set cookie
  const session = await registerLogin(result.user, constructSessionDetailsFromEvent(event));
  const cookie = createSessionCookie(session._id);
  setCookie(event, cookie.name, cookie.value, cookie.attributes);

  setResponseStatus(event, 201, "User created successfully");
});
