import { readFileSync, writeFileSync, mkdirSync } from "fs";

const convertJsonToGeoJsonEntry = (entry) => {
    return {
        ...entry,
        location: {
            type: "Point",
            coordinates: [entry.latitude, entry.longitude],
        }
    };
}

const startTime = Date.now();
console.log("Initializing GeoDB with data from JSON file...");
const rawData = readFileSync("DE_zipcodes.json", "utf-8");
const entries = JSON.parse(rawData).map(convertJsonToGeoJsonEntry);
console.log("GeoDB initialization complete. ", Date.now() - startTime, "ms");

mkdirSync("./data", { recursive: true });
writeFileSync("./data/DE_zipcodes_converted.json", JSON.stringify(entries, null, 2), "utf-8");

