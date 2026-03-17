import type { GeoDBEntry } from "#shared/types/GeoTypes";
import { readFileSync } from "node:fs";
import database from "../database/DBUtils";

//Collection for geographic data from https://github.com/zauberware/postal-codes-json-xml-csv/blob/master/data/DE.zip
//Index on: zipcode, place (full text) and search index on place
const zipcodeJsonFile = "./data/DE_zipcodes.json";
const GeoDB = database.collection<GeoDBEntry>("zipcodes");

const ensureGeoIndexes = async () => {
    initializeGeoDB(); // Ensure DB is initialized before creating indexes

    await GeoDB.createIndex({ zipcode: 1 });
    await GeoDB.createIndex({ place: "text" });
    await GeoDB.createIndex({ location: "2dsphere" });
}

const searchCityFullText = async (query: string, limit = 10): Promise<GeoDBEntry[]> => {
    const response = GeoDB.aggregate([
        { $search: { autocomplete: { query, path: "place", tokenOrder: "sequential" } } },
        { $limit: limit }
    ]);

    return (await response.toArray()) as GeoDBEntry[];
};

const getCityByZipcode = async (zipcode: string): Promise<GeoDBEntry | null> => {
    const response = await GeoDB.findOne({ zipcode });
    return response;
};

const findNearestCity = async (latitude: number, longitude: number): Promise<GeoDBEntry | null> => {
    const response = await GeoDB.findOne({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [latitude, longitude]
                }
            }
        }
    });
    return response;
};

const initializeGeoDB = async () => {
    try {
        const count = await GeoDB.estimatedDocumentCount();
        if (count === 0) {
            const startTime = Date.now();
            console.log("Initializing GeoDB with data from JSON file...");
            const rawData = readFileSync(zipcodeJsonFile, "utf-8");
            const entries = JSON.parse(rawData).map(convertJsonToGeoJsonEntry);
            await GeoDB.insertMany(entries);
            console.log("GeoDB initialization complete. ", Date.now() - startTime, "ms");
        } else {
            console.log("GeoDB already initialized with", count, "entries.");
        }
    } catch (error) {
        console.error("Error initializing GeoDB:", error);
    }
}

const convertJsonToGeoJsonEntry = (entry: any) => {
    return {
        ...entry,
        location: {
            type: "Point",
            coordinates: [parseFloat(entry.latitude), parseFloat(entry.longitude)],
        }
    };
}

export { ensureGeoIndexes, findNearestCity, GeoDB, getCityByZipcode, searchCityFullText };
