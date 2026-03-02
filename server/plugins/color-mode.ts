import { COLOR_MODE_STORAGE_KEY } from "#shared/constants/Constants";

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('render:html', (html, { event }) => {
        const theme = getCookie(event, COLOR_MODE_STORAGE_KEY);
        if (theme === 'dark') {
            html.htmlAttrs = html.htmlAttrs || ''
            html.htmlAttrs.push(' class="dark"')
        }
    })
})   