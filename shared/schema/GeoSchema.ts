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

export const GeoLocationSchema = z.object({
    type: z.literal('Point'),
    displayname: z.string().max(200),
    name: z.string().max(200).optional(),
    coordinates: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]),
    address: z.record(z.string(), z.string()).optional(),
});