export const useSafeRedirect = () => {
    const route = useRoute();

    if (!route.query.redirect) return;

    const redirectPath = route.query.redirect as string;

    // Sicherheit: Nur relative Pfade innerhalb der App erlauben
    if (redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
        return navigateTo(redirectPath);
    } else {
        // Optional: Logge einen Fehler oder zeige eine Benachrichtigung an, dass der Redirect ungültig ist
        console.warn(`Ungültiger Redirect-Pfad: ${redirectPath}`);
    }

    return Promise.resolve(); // Kein Redirect, einfach fortfahren
};
