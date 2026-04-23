export interface GeoDBEntry {
    _id: string;
    country_code: string;
    zipcode: string;
    place: string;
    state: string;
    state_code: string;
    province: string;
    province_code: string;
    community: string;
    community_code: string;
    latitude: number;
    longitude: number;
    //GeoJSON Point format for geospatial queries
    location: {
        type: "Point";
        coordinates: [number, number];
    }
}

// Internal type (camelCase, used in your app)
export interface GeoLocation {
    type: 'Point';
    displayname: string;
    name?: string;
    coordinates: [number, number]; // [latitude, longitude]
    address?: Record<string, string>;
}

// Nominatim API response type (snake_case, external API)
export interface NominatimLocation {
    display_name: string;
    name: string;
    lat: string;
    lon: string;
    addresstype?: string;
    address?: Record<string, string>;
    boundingbox?: [string, string, string, string];
}

export interface ResolvedGeoIP {
    coordinates: [number, number]; // [latitude, longitude]
    latitude: number;
    longitude: number;
    city?: string;
    region?: string;
    country?: string;
}

export interface FrontEndGeoState {
    //Can be user location (manuell gesetzt) oder IP-basierte Location (automatisch ermittelt)
    location: {
        latitude: number;
        longitude: number;
    };

    //z.B Recklinghausen
    city: string;

    //z.B Nordrhein-Westfalen
    state: string;

    //z.B Germany
    country: string;

    //Optional: Postleitzahl, falls verfügbar
    postalCode: string;
}