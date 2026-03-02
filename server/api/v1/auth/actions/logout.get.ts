export default defineEventHandler(async (event) => {
  const session = event.context.session;

  if (!session) {
    return {
      status: 401,
      body: {
        error: "No session found",
      },
    };
  }

  await invalidateSession(session._id);

  setResponseStatus(event, 200,"Logout successful");
});
