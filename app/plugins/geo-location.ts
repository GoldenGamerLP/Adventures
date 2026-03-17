export default defineNuxtPlugin(async () => {

    // Einmal beim App-Start auflösen — callOnce verhindert
    // doppelte Ausführung bei SSR→Client Hydration
    await callOnce('geo-ip', hydrateGeoLocation);
});