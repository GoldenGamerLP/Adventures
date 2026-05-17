import { INFINITE_SCROLL_PAGE_SIZE } from '~~/shared/constants/Constants';
import type { AdventuresQueryFilterType } from '~~/shared/schema/AdventuresSchema';

export const useSearchMask = () => {
    const { geolocation } = useGeoLocation();
    const currentPage = useState('currentPage', () => 0);
    //Anfangszustand true: Damit die loading skeletons angezeigt werden
    const infinitScrollState = useState('infiniteScrollState', () => "idle" as 'idle' | 'fetching' | 'error' | 'end');
    const accumulatedAdventures = useState<AdventureWithMeta[]>('accumulatedAdventures', () => []);
    const fetchingError = useState<string | null>('fetchingError', () => null);

    const state = useState('searchMask', () => reactive({
        searchPopoverOpen: false,
        extendedSearchOpen: false,
        mask: {} as Partial<AdventuresQueryFilterType>,
    }));

    const fetchNextPage = async (force = false) => {
        if (infinitScrollState.value === 'fetching' || infinitScrollState.value === 'end' || fetchingError.value && !force) return;

        infinitScrollState.value = 'fetching';

        try {
            const data = await $fetch('/api/v1/app/adventures/infinite', {
                query: {
                    ...computedQuery.value,
                },
                priority: 'low',
            });

            if (data) {
                accumulatedAdventures.value = [...accumulatedAdventures.value, ...data];
                currentPage.value += 1;
            }

            if ((!data || data.length < INFINITE_SCROLL_PAGE_SIZE)) {
                // Kein Ergebnis für die Suchmaske, self-locking, damit nicht ständig neue Anfragen gesendet werden
                infinitScrollState.value = 'end';
                console.log('No adventures found for the current search mask.');
            } else infinitScrollState.value = 'idle';
        } catch (error) {
            console.error('Error fetching adventures:', error);
            if (error instanceof Error) {
                infinitScrollState.value = 'error';
                fetchingError.value = error.message;
            }
        }
    };

    const computedQuery = computed(() => {
        return {
            ...state.value.mask,
            pageParam: currentPage.value,
            limit: INFINITE_SCROLL_PAGE_SIZE,
        }
    });

    const computedHasNextPage = computed(() => {
        if (infinitScrollState.value === 'fetching' || infinitScrollState.value === 'end' || fetchingError.value) return false;
        return accumulatedAdventures.value.length % INFINITE_SCROLL_PAGE_SIZE === 0;
    });

    const hasError = computed(() => infinitScrollState.value === 'error' || !!fetchingError.value);

    /** Geo-Daten in die Suchmaske übernehmen */
    const applyGeoFilter = () => {
        if (!geolocation.value) return;
        state.value.mask.location = [geolocation.value.location.latitude, geolocation.value.location.longitude];
    };

    const resetFilters = () => {
        state.value.mask = {};
        applyGeoFilter();
        refreshSearch();
    };

    const refreshSearch = () => {
        infinitScrollState.value = 'idle';
        fetchingError.value = null;
        accumulatedAdventures.value = [];
        currentPage.value = 0;
        fetchNextPage();
    }



    watch(geolocation, (newCoords) => {
        if (newCoords) {
            state.value.mask.location = [newCoords.location.latitude, newCoords.location.longitude];
        }
    }, { immediate: true, deep: true });

    return {
        mask: toRef(state.value, 'mask'),
        searchPopoverOpen: toRef(state.value, 'searchPopoverOpen'),
        extendedSearchOpen: toRef(state.value, 'extendedSearchOpen'),
        resetFilters,
        applyGeoFilter,
        refreshSearch,
        accumulatedAdventures,
        infinitScrollState,
        fetchNextPage,
        hasNextPage: computedHasNextPage,
        hasError,
        errorMessage: toRef(fetchingError),
    };
};