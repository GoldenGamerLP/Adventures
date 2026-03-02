import { COLOR_MODE_STORAGE_AGE_SECONDS, COLOR_MODE_STORAGE_KEY } from "#shared/constants/Constants";


export const useColorMode = () => {
    const cookieMode = useCookie(COLOR_MODE_STORAGE_KEY, { maxAge: COLOR_MODE_STORAGE_AGE_SECONDS, watch: true });

    const colorMode = useState<'light' | 'dark'>('color-mode', () => {
        return cookieMode.value === 'dark' ? 'dark' : 'light';
    });

    const setColorMode = (mode: 'light' | 'dark') => {
        colorMode.value = mode;
        cookieMode.value = mode;
        document.documentElement.classList.toggle('dark', mode === 'dark');
    };

    const currentColorMode = readonly(colorMode);

    const getColorModes = () => {
        return ['light', 'dark'];
    }

    return {
        setColorMode,
        currentColorMode,
        getColorModes,
    };
}