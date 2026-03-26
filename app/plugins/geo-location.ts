export default defineNuxtPlugin(async () => {
    await callOnce('geo-ip', hydrateGeoLocation);
});