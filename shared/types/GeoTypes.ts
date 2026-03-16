export interface GeoEntry {
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
    coordinates: [number, number];
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
    _id?: string;
    ip: string;                    // Gehashte IP (Privacy!)
    coordinates: [number, number]; // [lat, lng]
    city?: string;
    region?: string;
    country: string;
    resolvedAt: string;            // ISO — für TTL
}

export interface GeoIPLocation {
    coordinates: [number, number]; // [lat, lng]
    city?: string;
    region?: string;
    country: string;
}