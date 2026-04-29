import type { AdventuresQueryFilterType } from '~~/shared/schema/AdventuresSchema';

const PAGE_SIZE = 3;

export const useSearchMask = () => {
    const currentPage = useState('currentPage', () => 1);
    //Anfangszustand true: Damit die loading skeletons angezeigt werden
    const isFetchingNewAdventures = useState('isFetchingNewAdventures', () => true);
    const { geolocation } = useGeoLocation();
    const accumulatedAdventures = useState<AdventureWithMeta[]>('accumulatedAdventures', () => []);
    const fetchingError = useState<string | null>('fetchingError', () => null);

    const state = useState('searchMask', () => reactive({
        searchPopoverOpen: false,
        extendedSearchOpen: false,
        mask: {} as Partial<AdventuresQueryFilterType>,
    }));

    const fetchNextPage = async (force = false) => {
        if (isFetchingNewAdventures.value && !force || fetchingError.value) return;

        isFetchingNewAdventures.value = true;

        try {
            const data = await $fetch('/api/v1/app/adventures/infinite', {
                query: {
                    ...computedQuery.value,
                },
                priority: 'low',
            });

            if (data) {
                accumulatedAdventures.value.push(...data);
                currentPage.value += 1;
            }

            if (!data || data.length < PAGE_SIZE && accumulatedAdventures.value.length === 0) {
                fetchingError.value = "No adventures found with the current filters.";
            }

        } catch (error) {
            console.error('Error fetching adventures:', error);
            if (error instanceof Error) {
                fetchingError.value = error.message;
            }
        }
        finally {
            isFetchingNewAdventures.value = false;
        }
    };

    const computedQuery = computed(() => {
        return {
            ...state.value.mask,
            pageParam: currentPage.value,
            limit: PAGE_SIZE,
        }
    });

    const computedHasNextPage = computed(() => {
        return accumulatedAdventures.value.length % PAGE_SIZE === 0;
    });

    const hasError = computed(() => !!fetchingError.value);

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
        fetchingError.value = null;
        accumulatedAdventures.value = [];
        currentPage.value = 1;
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
        isFetchingNewAdventures,
        fetchNextPage,
        hasNextPage: computedHasNextPage,
        hasError,
        errorMessage: toRef(fetchingError),
    };
};