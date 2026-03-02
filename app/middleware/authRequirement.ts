export default defineNuxtRouteMiddleware((to, from) => {
    const user = useUser();

    if (!user.value) {
        // User ist nicht authentifiziert, leite zur Login-Seite weiter: /only-logged-in mit query paramter "redirect" für die Rückkehr nach dem Login
        return navigateTo(`/only-logged-in?redirect=${encodeURIComponent(to.fullPath)}`);
    }
});