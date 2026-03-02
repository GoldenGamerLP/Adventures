import * as z from 'zod';

export const GeoSearchCitySchema = z.object({
    query: z.string().min(3).max(100),
});

export const GeoZipcodeSchema = z.object({
    zipcode: z.string().min(3).max(20),
});

export const resolveLatLongSchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
});