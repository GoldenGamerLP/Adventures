import { FETCH_KEY_FOR_YOU_PAGE } from '~~/shared/constants/Constants';
import type { AdventuresQueryFilterType } from '~~/shared/schema/AdventuresSchema';

export const useSearchMask = () => {
    const { geolocation } = useGeoLocation();

    const state = useState('searchMask', () => reactive({
        searchPopoverOpen: false,
        extendedSearchOpen: false,
        mask: {} as Partial<AdventuresQueryFilterType>,
    }));

    watch(geolocation, (newCoords) => {
        if (newCoords) {
            state.value.mask.location = [newCoords.location.latitude, newCoords.location.longitude];
        }
    }, { immediate: true, deep: true });

    /** Geo-Daten in die Suchmaske übernehmen */
    const applyGeoFilter = () => {
        if (!geolocation.value) return;
        state.value.mask.location = [geolocation.value.location.latitude, geolocation.value.location.longitude];
    };

    const resetFilters = () => {
        state.value.mask = {};
        applyGeoFilter();
    };

    const refreshSearch = () => {
        return refreshNuxtData(FETCH_KEY_FOR_YOU_PAGE);
    }

    return {
        mask: toRef(state.value, 'mask'),
        searchPopoverOpen: toRef(state.value, 'searchPopoverOpen'),
        extendedSearchOpen: toRef(state.value, 'extendedSearchOpen'),
        resetFilters,
        applyGeoFilter,
        refreshSearch,
    };
};