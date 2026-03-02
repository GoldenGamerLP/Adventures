export const useDeviceGeoLocation = () => {
    const lookupPermissionState = async () => await navigator.permissions.query({ name: 'geolocation' });

    const getGeolocation = () => {
        return new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
    }

    return {
        lookupPermissionState,
        getGeolocation,
    };
}