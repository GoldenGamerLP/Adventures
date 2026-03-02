export default defineNuxtPlugin(async () => {
    const { resolve } = useGeoLocation();

    // Einmal beim App-Start auflösen — callOnce verhindert
    // doppelte Ausführung bei SSR→Client Hydration
    await callOnce('geo-ip', resolve);
});