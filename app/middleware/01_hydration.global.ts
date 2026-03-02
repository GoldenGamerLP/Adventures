export default defineNuxtRouteMiddleware(async (_from, _to) => {
  await hydrateUser();
});
