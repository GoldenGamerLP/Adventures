import { FETCH_KEY_FOR_YOU_PAGE } from '~~/shared/constants/Constants';
import type { AdventuresQueryFilterType } from '~~/shared/schema/AdventuresSchema';

export const useSearchMask = () => {
    const { coordinates } = useGeoLocation();

    const state = useState('searchMask', () => reactive({
        searchPopoverOpen: false,
        extendedSearchOpen: false,
        mask: {} as Partial<AdventuresQueryFilterType>,
    }));

    watch(coordinates, (newCoords) => {
        if (newCoords) {
            state.value.mask.location = newCoords;
        }
    }, { immediate: true, deep: true });

    /** Geo-Daten in die Suchmaske übernehmen */
    const applyGeoFilter = () => {
        if (!coordinates.value) return;
        state.value.mask.location = coordinates.value;
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