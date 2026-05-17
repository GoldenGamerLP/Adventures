import fs from "fs/promises";
import type { AdventureTypeKey } from "../shared/types/AdventureTypes";
import type { OpeningSlots } from "../shared/types/EventTypes";
//const { createCanvas, loadImage } = require('canvas') als neues importieren
import { createCanvas, loadImage, Node } from 'canvas';

const wikiDataUrl = "https://www.wikidata.org/w/api.php";
const wikipediaApiUrl = "https://de.wikipedia.org/w/api.php";
const turboPassUrl = "https://overpass-api.de/api/interpreter";

/**
 * 1. Node: tourism=attraction + wikidata tag + name
 * 2. Node: tourism=viewpoint + wikidata tag + name
 * 3. Node: tourism=museum + wikidata tag + name
 */
const query = `
[out:json]
[timeout:85]
;
area(3600062761)->.nrw;
(
  node
    ["tourism"="attraction"]
    ["wikidata"~"^Q[0-9]+$"]
    ["name"~".+"]
    (area.nrw);
  node
    ["tourism"="viewpoint"]
    ["wikidata"~"^Q[0-9]+$"]
    ["name"~".+"]
    (area.nrw);
  node
    ["tourism"="museum"]
    ["wikidata"~"^Q[0-9]+$"]
    ["name"~".+"]
    (area.nrw);
  node
    ["tourism"="attraction"]
    ["attraction"="nature"]
    ["wikidata"~"^Q[0-9]+$"]
    ["name"~".+"]
    (area.nrw);  
  node
    ["tourism"="picnic_site"]
    ["wikidata"~"^Q[0-9]+$"]
    ["name"~".+"]
    (area.nrw);  
);
out body geom;
`;
const maxTries = 3;
const retryDelay = 5000; // 5 seconds

//1. Step: Load Overpass Data
const overpassDataFilePath = "data/overpassData.json";
//2. Step: Collect WikiData IDs
const wikiDataIdsFilePath = "data/wikiIds.json";
//3. Step: Lookup WikiData Details
const wikiDataDetailsFilePath = "data/wikiDataDetails.json";
//4. Step: Combine OSM and WikiData, remove unnecessary fields
const osmAndWikiDataDetailsPath = "data/osmAndWikiData.json";
//5. Step: Enhance with Wikipedia Extracts and Q-ID Labels
const refinedDetailsJsonPath = "data/wikiDataRefinedDetails.json";
//6. Step: Collect real image URLs from Wikimedia Commons
const refinedPicturesJsonPath = "data/wikiDataRefinedDetailsWithPictures.json";
//7. Step: Download images locally
const imagesDirectory = "data/images";

const seedingEndpoint = process.env.SEEDING_ENDPOINT || "http://localhost:3000/api/v1/seeding/adventures";
const seedingApiKey = process.env.SEEDING_API_KEY || "";

const userAgent = "AdventuresAppSeed/1.0 Bot (https://adventures.street14.work)";

interface RefinedAdventure {
    id: string;
    name: string;
    description: string;
    location: {
        lat: number;
        lon: number;
    };
    wikipedia?: string | null;
    pictures: string[];
    facts?: {
        officialWebsite?: string | null;
        inceptionYear?: string | null;
        elevation?: number | null;
        height?: number | null;
        instanceOfQId?: string | null;
        heritageStatusQId?: string | null;
        instanceOfLabel?: string | null;
        heritageStatusLabel?: string | null;
    };
}

const fileExists = async (path: string) => {
    try {
        await fs.access(path, fs.constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getContentType = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        case 'gif':
            return 'image/gif';
        case 'bmp':
            return 'image/bmp';
        case 'tiff':
        case 'tif':
            return 'image/tiff';
        default:
            return 'application/octet-stream';
    }
}

const getImageFileNameFromUrl = (imageUrl: string) => {
    const splitName = imageUrl.split('/');
    return decodeURIComponent(splitName[splitName.length - 1]);
}

/**
 * 
 * Dieser Schritt holt die Rohdaten von der Overpass API, um alle relevanten Orte aus der OSM Query zu bekommen, die als Seeds dienen können. Er speichert die Daten in "data/overpassData.json", damit sie in den nächsten Schritten weiterverarbeitet werden können.
 * (Dieser Schritt ist notwendig, um die Rohdaten von OSM zu bekommen, die wir dann in den nächsten Schritten bereinigen und anreichern. Ohne diesen Schritt hätten wir keine Daten, mit denen wir arbeiten könnten.)
 * 
 * @returns Die Daten werden direkt in "data/overpassData.json" gespeichert, damit sie in den nächsten Schritten weiterverarbeitet werden können.
 */
const loadOverpassData = async () => {
    const isAvailable = await fileExists(overpassDataFilePath);
    if (isAvailable) {
        console.log("Skipping request, found file.")
        return;
    }

    try {
        const response = await fetch(turboPassUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "User-Agent": userAgent,
            },
            body: `data=${encodeURIComponent(query)}`,
        });

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status}`, await response.text());
            throw new Error(`Failed to fetch Overpass data: ${response.status}`);
        }

        const jsonData = await response.json();
        // Save to file
        await fs.mkdir("data", { recursive: true }); // Ensure the directory exists
        await fs.writeFile(overpassDataFilePath, JSON.stringify(jsonData, null, 2));
        console.log(`Overpass data saved to ${overpassDataFilePath}`);
    } catch (error) {
        console.error("Error fetching Overpass data:", error);
        throw error; // Rethrow to trigger retry
    };
}

/**
 * 
 * Dieser Schritt extrahiert alle Wikidata-IDs aus den OSM-Daten, die wir über die Overpass API erhalten haben. Das ist notwendig, weil die OSM-Daten nur die Wikidata-ID enthalten, aber nicht die eigentlichen Informationen wie Beschreibung, Bilder oder andere Fakten, die wir für die Seeds brauchen.
 * (Dieser Schritt ist notwendig, um die Rohdaten von Wikidata zu bekommen, die wir dann in den nächsten Schritten bereinigen und anreichern.)
 * 
 * @returns Die gesammelten Wikidata-IDs werden in "data/wikiIds.json" gespeichert, damit sie in den nächsten Schritten weiterverarbeitet werden können.
 * 
 */
const collectWikiDataTags = async () => {
    const data = await fs.readFile(overpassDataFilePath, { encoding: 'utf8' });

    const jsonTurbopassObject = JSON.parse(data);

    if (!jsonTurbopassObject) {
        console.error("Error while reading file, empty?");
        return;
    }

    const { elements } = jsonTurbopassObject;

    if (!elements) {
        console.error("No elements?");
        return;
    }

    console.log(`Found ${elements.length} items.`);

    const tags = [];
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];

        const data = element.tags.wikidata;
        if (!data) {
            console.warn("Skipped entry, no wikidata");
            continue;
        }

        tags.push(data);
    }
    await fs.mkdir("data", { recursive: true }); // Ensure the directory exists
    await fs.writeFile(wikiDataIdsFilePath, JSON.stringify(tags, null, 2));

    console.log(`Found ${tags.length} wiki Ids.`)
}

async function tryWithRetry(fn: () => Promise<void>, retries: number, delay: number) {
    while (retries > 0) {
        try {
            await fn();
            return; // Success, exit the function
        }
        catch (error) {
            console.error(`Attempt failed: ${error}`);
            retries--;
            if (retries > 0) {
                console.log(`Retrying in ${delay / 1000} seconds... (${retries} attempts left)`);
                await new Promise(res => setTimeout(res, delay));
            }
            else {
                console.error("All attempts failed.");
            }
        }
    }
}

/**
 * 
 * Dieser Schritt holt die vollständigen Details von Wikidata für alle gesammelten Wikidata-IDs. Das ist notwendig, weil die OSM-Daten nur die Wikidata-ID enthalten, aber nicht die eigentlichen Informationen wie Beschreibung, Bilder oder andere Fakten, die wir für die Seeds brauchen.
 * (Dieser Schritt ist Notwendig, um die Rohdaten von Wikidata zu bekommen, die wir dann in den nächsten Schritten bereinigen und anreichern. Ohne diesen Schritt hätten wir nur die Wikidata-IDs, aber keine der eigentlichen Informationen, die wir für die Seeds verwenden können.)
 * 
 * @param batchSize 50: Die Anzahl an Ids pro Anfrage an die WikiData API.
 * @returns Die Daten werden direkt in "data/wikiDataDetails.json" gespeichert, damit sie in den nächsten Schritten weiterverarbeitet werden können.
 */
const lookupWikiDataDetails = async (batchSize: number = 50) => {
    const isAvailable = await fileExists(wikiDataDetailsFilePath);
    if (isAvailable) {
        console.log("Skipping request, found file.")
        return;
    }

    const data = await fs.readFile(wikiDataIdsFilePath, { encoding: 'utf8' });
    const wikiIds = JSON.parse(data);

    const details = [] as any[];

    for (let i = 0; i < wikiIds.length; i += batchSize) {
        const batchIds = wikiIds.slice(i, i + batchSize);
        const idsParam = batchIds.join("|");


        const response = await fetch(`${wikiDataUrl}?action=wbgetentities&ids=${idsParam}&format=json&props=labels|descriptions|claims|sitelinks&languages=de`, {
            headers: {
                "Accept": "application/json",
                "User-Agent": userAgent,
            },
        });

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status}`, await response.text());
            return;
        }

        const jsonData = await response.json();
        details.push(...Object.values(jsonData.entities));
        console.log(`Fetched details for batch ${i / batchSize + 1} (${batchIds.length} items)`);
    }

    console.log(`Fetched details for ${details.length} WikiData items.`);
    await fs.mkdir("data", { recursive: true }); // Ensure the directory exists
    await fs.writeFile(wikiDataDetailsFilePath, JSON.stringify(details, null, 2));
    console.log(`WikiData details saved to ${wikiDataDetailsFilePath}`);
}

/**
 * 
 * Dieser Schritt kombiniert die rohen Wikidata-Details mit den OSM-Daten, um die besten verfügbaren Informationen zu extrahieren. Er entfernt unnötige Felder und speichert nur die relevanten Informationen, die wir für die Seeds brauchen.
 * (Dieser Schritt ist notwendig um die Daten Sauber darzustellen)
 * 
 */
//Combine osm data with wikidata details, remove unnecessary fields and save to new file
//Use OSMName, wiki description, wiki claims for location, and wiki sitelinks for wikipedia links, collect pictures from claims if available
const combineOsmWithWikiData = async () => {
    if (!await fileExists(wikiDataDetailsFilePath) || !await fileExists(overpassDataFilePath)) {
        console.error("Required files not found. Please run the previous steps first.");
        return;
    }

    const wikiData = await fs.readFile(wikiDataDetailsFilePath, { encoding: 'utf8' });
    const wikiDataDetails = JSON.parse(wikiData);
    const osmData = await fs.readFile(overpassDataFilePath, { encoding: 'utf8' });
    const jsonTurbopassObject = JSON.parse(osmData);
    const osmElements = jsonTurbopassObject.elements;

    const refinedDetails = [] as any[];

    for (let i = 0; i < wikiDataDetails.length; i++) {
        const wikiItem = wikiDataDetails[i];
        const osmItem = osmElements.find((el: any) => el.tags.wikidata === wikiItem.id);
        if (!osmItem) {
            console.warn(`No OSM item found for WikiData ID ${wikiItem.id}`);
            continue;
        }


        const refinedItem: any = {
            id: wikiItem.id,
            name: getNameOfDetails(wikiItem, osmItem),
            description: getDescriptionOfDetails(wikiItem, osmItem),
            location: {
                lat: osmItem.lat,
                lon: osmItem.lon,
            },
            wikipedia: wikiItem.sitelinks?.dewiki?.title ? `https://de.wikipedia.org/wiki/${encodeURI(wikiItem.sitelinks.dewiki.title)}` : null,
            pictures: wikiItem.claims?.P18 ? wikiItem.claims.P18.map((claim: any) => claim.mainsnak.datavalue.value) : [],
            // Neue Extraktionen über unsere Hilfsfunktionen:
            facts: {
                officialWebsite: getClaimString(wikiItem, 'P856'), // P856: Website (Text)
                inceptionYear: getClaimYear(wikiItem, 'P571'), // P571: Baujahr/Entstehungsjahr (Date)
                elevation: getClaimQuantity(wikiItem, 'P2044'), // P2044: Höhe (Quantity)
                height: getClaimQuantity(wikiItem, 'P2048'), // P2048: Bauhöhe z.B. von Türmen
                instanceOfQId: getClaimQId(wikiItem, 'P31'), // P31: Ist ein... (Q-ID, z.B. Q34685=Turm)
                heritageStatusQId: getClaimQId(wikiItem, 'P1435'), // P1435: Denkmalschutzstatus
                openingDaysOfWeek: getClaimQId(wikiItem, 'P3025'), // P3025: Öffnungszeiten als Q-ID (z.B. Q100157387 für "tuesday to friday")
                openingStartTime: getClaimQId(wikiItem, 'P8626'), // P8626: Öffnungszeit Beginn als Q-ID
                openingCloseTime: getClaimQId(wikiItem, 'P8627'), // P8627: Öffnungszeit Ende als Q-ID
                osmOpeningHours: osmItem.tags.opening_hours || null, // OSM Öffnungszeiten als Fallback
            }
        };
        refinedDetails.push(refinedItem);
    }

    await fs.mkdir("data", { recursive: true });
    await fs.writeFile(osmAndWikiDataDetailsPath, JSON.stringify(refinedDetails, null, 2));
    console.log(`Refined WikiData details saved to ${osmAndWikiDataDetailsPath}`);
};

const getDescriptionOfDetails = (wikiItem: any, osmItem: any): string => {
    const wikiDescription = wikiItem.descriptions?.de?.value || wikiItem.descriptions?.en?.value || "";
    const osmDescription = osmItem.tags.description || osmItem.tags['description'] || "";
    return osmDescription.length > wikiDescription.length ? osmDescription : wikiDescription || "No description available";
};

const getNameOfDetails = (wikiItem: any, osmItem: any): string => {
    const wikiName = wikiItem.labels?.de?.value || wikiItem.labels?.en?.value || "";
    const osmName = osmItem.tags.name || osmItem.tags['name:de'] || osmItem.tags['name:en'] || "";
    return wikiName.length > 0 ? wikiName : osmName;
};

// Hilfsfunktion für Strings/URLs (z.B. P856 Website)
const getClaimString = (wikiItem: any, property: string): string | null => {
    const claim = wikiItem.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
    return typeof claim === 'string' ? claim : null;
};

// Hilfsfunktion für Zeitangaben (z.B. P571 Baujahr) -> Liefert oft "+1659-01-01T00:00:00Z"
const getClaimYear = (wikiItem: any, property: string): string | null => {
    const timeValue = wikiItem.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.time;
    if (timeValue) {
        // Extrahiert das Jahr (z.B. "+1899-00-00..." -> "1899")
        const match = timeValue.match(/\+?(\d{3,4})/);
        return match ? match[1] : null;
    }
    return null;
};

// Hilfsfunktion für Nummern/Höhen (z.B. P2044 Höhe)
const getClaimQuantity = (wikiItem: any, property: string): number | null => {
    const amount = wikiItem.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.amount;
    return amount ? parseFloat(amount) : null;
};

// Hilfsfunktion für Q-IDs (z.B. P31 Instance of)
const getClaimQId = (wikiItem: any, property: string): string | null => {
    return wikiItem.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.id || null;
};

/**
 * 
 * Dieser Schritt holt die Labels für die Q-IDs (z.B. "Instance of" -> "Turm") von Wikidata und die Beschreibungstexte von Wikipedia. Das ist notwendig, um die Daten in der App verständlicher zu machen, da Q-IDs allein nicht aussagekräftig sind.
 * Außerdem werden die Wikipedia-Extracts nur dann übernommen, wenn sie länger als 50 Zeichen sind, um zu vermeiden, dass kurze oder unbrauchbare Beschreibungen die OSM-Beschreibungen überschreiben, die oft schon recht gut sind.
 * (Dieser Schritt ist Optional aber für die Qualität der Seeds sehr empfehlenswert, da er die Daten deutlich anreichertert und lesbarer macht. Ohne diesen Schritt hätten wir nur kryptische Q-IDs und oft sehr kurze oder fehlende Beschreibungen.)
 * 
 * @param batchSize 50: Wikidata erlaubt bis zu 50 IDs pro Anfrage.
 */
// Neuer Schritt: Löst Q-IDs über Wikidata auf und holt echte Beschreibungstexte (Extracts) über Wikipedia API
const enhanceWithWikipediaAndLabels = async (batchSize: number = 50) => {
    if (!await fileExists(osmAndWikiDataDetailsPath)) {
        console.error("Required file not found. Please run the previous steps first.");
        return;
    }

    if (await fileExists(refinedDetailsJsonPath)) {
        console.log("Skipping request, found file.")
        return;
    }


    const data = await fs.readFile(osmAndWikiDataDetailsPath, { encoding: 'utf8' });
    const refinedItems = JSON.parse(data);

    // 1. Alle benötigten Q-IDs sammeln
    const qIdsToResolve = new Set<string>();
    refinedItems.forEach((item: any) => {
        if (item.facts?.instanceOfQId) qIdsToResolve.add(item.facts.instanceOfQId);
        if (item.facts?.heritageStatusQId) qIdsToResolve.add(item.facts.heritageStatusQId);
        if (item.facts?.openingDaysOfWeek) qIdsToResolve.add(item.facts.openingDaysOfWeek);
        if (item.facts?.openingStartTime) qIdsToResolve.add(item.facts.openingStartTime);
        if (item.facts?.openingCloseTime) qIdsToResolve.add(item.facts.openingCloseTime);
    });

    const qIdsArray = Array.from(qIdsToResolve);
    const qIdLabels: Record<string, string> = {};
    console.log(`Resolving ${qIdsArray.length} Q-IDs on Wikidata...`);

    // Q-IDs in Batches bei Wikidata anfragen
    for (let i = 0; i < qIdsArray.length; i += batchSize) {
        const batch = qIdsArray.slice(i, i + batchSize);
        const idsParam = batch.join("|");
        try {
            const res = await fetch(`${wikiDataUrl}?action=wbgetentities&ids=${idsParam}&format=json&props=labels&languages=de`, {
                headers: { "Accept": "application/json", "User-Agent": userAgent }
            });

            if (!res.ok) {
                console.error(`HTTP Error while resolving Q-IDs: ${res.statusText}`);
                continue;
            }

            const json = await res.json();
            if (json.entities) {
                Object.values(json.entities).forEach((entity: any) => {
                    if (entity.labels?.de?.value) {
                        qIdLabels[entity.id] = entity.labels.de.value;
                    }

                });
            }

            // Kleine Pause zwischen den Anfragen, um die Wikidata API nicht zu überlasten
            await sleep(3000);
        } catch (e) {
            console.error("Error resolving Q-IDs", e);
        }
    }

    // 2. Wikipedia-Titel extrahieren
    const wikiTitlesToResolve = new Set<string>();
    refinedItems.forEach((item: any) => {
        if (item.wikipedia) {
            const title = decodeURIComponent(item.wikipedia.split('/').pop() || "");
            if (title) wikiTitlesToResolve.add(title);
        }
    });

    const wikiTitlesArray = Array.from(wikiTitlesToResolve);
    const wikipediaExtracts: Record<string, string> = {};
    console.log(`Fetching ${wikiTitlesArray.length} texts from Wikipedia DE...`);

    // Wikipedia-Texte in Batches bei Wikipedia anfragen
    for (let i = 0; i < wikiTitlesArray.length; i += batchSize) {
        const batch = wikiTitlesArray.slice(i, i + batchSize);
        const titlesParam = batch.join("|");

        let success = false;
        let retries = 5;

        while (!success && retries > 0) {
            try {
                //&exintro=1 um nur die Einleitung zu bekommen, &explaintext=1 um reinen Text statt HTML zu erhalten
                const res = await fetch(`${wikipediaApiUrl}?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(titlesParam)}&format=json`, {
                    headers: { "Accept": "application/json", "User-Agent": userAgent }
                });

                if (res.status === 429) {
                    const retryAfter = res.headers.get("retry-after") || "5";
                    console.warn(`[429 Wikipedia API] Sleeping for ${retryAfter}s...`);
                    await sleep(parseInt(retryAfter, 10) * 1000);
                    retries--;
                    continue;
                }

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const json = await res.json();
                if (json.query?.pages) {
                    Object.values(json.query.pages).forEach((page: any) => {
                        if (page.title && page.extract) {
                            wikipediaExtracts[page.title] = page.extract;
                        }
                    });
                }
                success = true;
            } catch (e) {
                console.error("Error fetching Wikipedia extracts... Retrying in 3s", e);
                await sleep(3000);
                retries--;
            }
        }
    }

    // 3. Gesammelte Daten zurück ins Objekt schreiben
    const enhancedItems = refinedItems.map((item: any) => {
        // Labels setzen
        if (item.facts) {
            if (item.facts.instanceOfQId && qIdLabels[item.facts.instanceOfQId]) {
                item.facts.instanceOfLabel = qIdLabels[item.facts.instanceOfQId];
            }
            if (item.facts.heritageStatusQId && qIdLabels[item.facts.heritageStatusQId]) {
                item.facts.heritageStatusLabel = qIdLabels[item.facts.heritageStatusQId];
            }
            if (item.facts.openingDaysOfWeek && qIdLabels[item.facts.openingDaysOfWeek]) {
                item.facts.openingDaysOfWeekLabel = qIdLabels[item.facts.openingDaysOfWeek];
            }
            if (item.facts.openingStartTime && qIdLabels[item.facts.openingStartTime]) {
                item.facts.openingStartTimeLabel = qIdLabels[item.facts.openingStartTime];
            }
            if (item.facts.openingCloseTime && qIdLabels[item.facts.openingCloseTime]) {
                item.facts.openingCloseTimeLabel = qIdLabels[item.facts.openingCloseTime];
            }
        }

        // Wikipedia Text einfügen, wenn vorhanden (und lang genug)
        if (item.wikipedia) {
            const originalTitle = decodeURIComponent(item.wikipedia.split('/').pop() || "");
            // Wikipedia gibt Spaces statt Underscores zurück
            const lookupTitle = originalTitle.replace(/_/g, ' ');
            const extract = wikipediaExtracts[lookupTitle] || wikipediaExtracts[originalTitle];

            if (extract && extract.length > 50) {
                item.description = extract;
            }
        }
        return item;
    });

    await fs.writeFile(refinedDetailsJsonPath, JSON.stringify(enhancedItems, null, 2));
    console.log(`Enhanced data with Wikipedia texts and Q-ID labels saved to ${refinedDetailsJsonPath}`);
};

/**
 * 
 * Dieser Schritt, holt die echten Bild-URLs von Wikimedia Commons, basierend auf den Dateinamen aus P18. Das ist notwendig, weil die P18-Felder oft nur den Dateinamen enthalten (z.B. "Dom_zu_Koeln.jpg"), aber nicht die direkte URL zum Bild.
 * (Notwendig da Adventures App mindestens ein Bild pro Adventure braucht, und die Wikimedia API oft optimierte Thumbnail-URLs zurückgibt, die direkt eingebunden werden können, ohne dass wir die Bilder selbst hosten müssen.)
 * 
 * @param batchSize 50: Wikimedia erlaubt bis zu 50 Dateien pro Anfrage.
 * @returns Die Daten werden direkt in "data/wikiDataRefinedDetails.json" mit den echten Bild-URLs gespeichert.
 */
const collectImages = async (batchSize: number = 50) => {
    if (!await fileExists(refinedDetailsJsonPath)) {
        console.error("Required file not found. Please run the previous steps first.");
        return;
    }

    if (await fileExists(refinedPicturesJsonPath)) {
        console.log("Skipping image collection, found file.")
        return;
    }

    // Lese die bereinigten Daten ein, denn hier stehen bereits die P18-Dateinamen drin ("pictures")
    const data = await fs.readFile(refinedDetailsJsonPath, { encoding: 'utf8' });
    const refinedItems = JSON.parse(data);

    // Alle einzigartigen Dateinamen (z.B. "Dom_zu_Koeln.jpg") sammeln
    const allFilenames = new Set<string>();
    refinedItems.forEach((item: any) => {
        if (item.pictures && item.pictures.length > 0) {
            item.pictures.forEach((pic: string) => allFilenames.add(`File:${pic}`));
        }
    });

    const filesArray = Array.from(allFilenames);
    console.log(`Found ${filesArray.length} unique images to resolve on Wikimedia Commons.`);

    const imageUrls: Record<string, string> = {};

    // Jetzt fragen wir die Wikimedia Commons API ab (Batches von 50 sind erlaubt!)
    for (let i = 0; i < filesArray.length; i += batchSize) {
        const batch = filesArray.slice(i, i + batchSize);
        const titlesParam = batch.join("|");

        // WICHTIG: iiurlwidth=800 hinzugefügt, um optimierte Thumbnails statt 30MB Bilder zu bekommen!
        const response = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&iiurlwidth=800&titles=${encodeURIComponent(titlesParam)}&format=json`, {
            headers: {
                "Accept": "application/json",
                "User-Agent": userAgent,
            },
        });

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status}`, await response.text());
            return;
        }

        const jsonData = await response.json();

        if (jsonData.query && jsonData.query.pages) {
            for (const pageId in jsonData.query.pages) {
                const page = jsonData.query.pages[pageId];
                if (page.imageinfo && page.imageinfo.length > 0) {
                    const title = page.title.replace(/^File:/, '');
                    // Wir speichern gezielt die thumburl (ca. 800px), als Fallback die normale URL
                    imageUrls[title] = page.imageinfo[0].thumburl || page.imageinfo[0].url;
                }
            }
        }

        //console.log(`Fetched images for batch ${i / batchSize + 1} (${batch.length} items)`);
    }

    // Jetzt mappen wir die fertigen URLs zurück in unsere Items
    const finalAdventures = refinedItems.map((item: any) => {
        return {
            ...item,
            pictures: item.pictures.map((pic: string) => imageUrls[pic]).filter(Boolean)
        };
    }).filter((item: any) => item.pictures.length > 0 && item.pictures.every(isValidImageUrl)); // Optional: Nur Items behalten, die jetzt echte Bilder haben

    console.log(`Resolved image URLs for ${refinedItems.length} items. ${finalAdventures.length} items have valid images and will be kept.`);

    await fs.mkdir("data", { recursive: true });
    // Wir speichern das fertige Ergebnis, das jetzt die echten hochauflösenden URLs enthält
    await fs.writeFile(refinedPicturesJsonPath, JSON.stringify(finalAdventures, null, 2));
    console.log(`Seed data with images saved to ${refinedPicturesJsonPath}`);
};

const isValidImageUrl = (url: string) => {
    return url.startsWith("http") && (url.endsWith(".jpg") || url.endsWith(".jpeg") || url.endsWith(".png") || url.endsWith(".webp") || url.endsWith(".gif") || url.endsWith(".bmp") || url.endsWith(".tiff"));
}

/**
 * Dieser Schritt lädt die Bilder von den Wikimedia URLs herunter und speichert sie lokal im "data/images" Ordner. Das ist notwendig, weil die Adventures App die Bilder direkt von unserem Server laden soll, um Ladezeiten zu optimieren und nicht von externen Quellen abhängig zu sein.
 * (Notwendig da jedes Adventures mindestens ein Bild braucht)
 * 
 */
const downloadImages = async () => {
    if (!await fileExists(refinedPicturesJsonPath)) {
        console.error("Required file not found. Please run the previous steps first.");
        return;
    }

    const data = await fs.readFile(refinedPicturesJsonPath, { encoding: 'utf8' });
    const refinedItems = JSON.parse(data);

    await fs.mkdir(imagesDirectory, { recursive: true }); // Sicherstellen, dass das Verzeichnis existiert

    for (let i = 0; i < refinedItems.length; i++) {
        const element = refinedItems[i];
        const imagesUrls = element.pictures as string[];

        for (const rawImage of imagesUrls) {
            // Bereinige kaputte Wikimedia-URLs (z.B. überflüssige Punkte am Ende des Dateinamens)
            const image = rawImage.replace(/\.+$/, '');

            const splitName = image.split("/");
            const imageName = decodeURIComponent(splitName[splitName.length - 1]);
            // Verhindere ungültige oder zu kurze Dateinamen
            if (!imageName || imageName.length < 3) continue;

            const filePath = `${imagesDirectory}/${imageName}`;

            // Überspringe bereits heruntergeladene Bilder. Das schont die API bei Neustarts!
            if (await fileExists(filePath)) {
                console.log(`Skipping ${imageName} (already downloaded).`);
                continue;
            }

            let retries = 5; // Erhöhe auf 5 Versuche für 429er
            let success = false;

            while (retries > 0 && !success) {
                try {
                    // Fallback: Wenn es gar keine URL ist, direkt abbrechen statt 5x Timeout zu triggern
                    if (!image.startsWith("http")) {
                        console.warn(`Invalid image URL: ${image}. Skipping.`);
                        break;
                    }

                    const imageData = await fetch(image, {
                        headers: {
                            "User-Agent": "AdventuresAppSeed/1.0",
                        }
                    });

                    if (imageData.status === 404) {
                        console.warn(`Image not found (404): ${imageName}. Skipping.`);
                        break; // Gehe zum nächsten Bild, da dieses nicht existiert
                    }

                    // 429 Too Many Requests abfangen
                    if (imageData.status === 429) {
                        // Wikimedia sendet oft einen Retry-After Header (in Sekunden). Falls nicht, nehmen wir 10 Sekunden.
                        const retryAfter = imageData.headers.get("retry-after") || "10";
                        const waitTimeMs = parseInt(retryAfter, 10) * 1000;
                        console.warn(`[429 Rate Limit] Hit limit for ${imageName}. Waiting for ${waitTimeMs / 1000} seconds... (${retries} retries left)`);
                        await new Promise(res => setTimeout(res, waitTimeMs));
                        retries--;
                        continue; // Schleife erneut durchlaufen, nicht abbrechen!
                    }

                    if (!imageData.ok) {
                        console.error(`Failed to download ${imageName}: ${imageData.status}`);
                        break; // Gehe zum nächsten Bild (while-Schleife abbrechen)
                    }

                    // Sicher konvertieren des Streams in einen Node.js Buffer
                    const imageBuffer = Buffer.from(await imageData.arrayBuffer());

                    await fs.writeFile(filePath, imageBuffer);
                    console.log(`Wrote image ${imageName} (${i + 1}/${refinedItems.length}).`);
                    success = true;

                    // Wir erhöhen die Standard-Pause leicht auf 1000ms, um unter dem Radar zu bleiben
                    await new Promise(res => setTimeout(res, 500));
                } catch (error) {
                    console.error(`Network Error while downloading image ${image}! Retrying...`, error);
                    retries--; // Bei echtem Netzwerkfehler 5 Sekunden warten
                }
            }

            console.log(`Finished ${i + 1} of ${refinedItems.length}.`)

            if (!success) {
                console.error(`Gave up downloading ${imageName} after multiple attempts.`);
            }

        }
    }
    console.log("Image downloading finished.");
}

const resizeImage = async (imagePath: string): Promise<File> => {
    const bufferedImage = await loadImage(imagePath);
    const imageType = getContentType(imagePath);
    const maxDimension = 1200;
    let targetWidth = bufferedImage.width;
    let targetHeight = bufferedImage.height;
    if (bufferedImage.width > maxDimension || bufferedImage.height > maxDimension) {
        const aspectRatio = bufferedImage.width / bufferedImage.height;
        if (aspectRatio > 1) {
            targetWidth = maxDimension;
            targetHeight = Math.round(maxDimension / aspectRatio);
        }
        else {
            targetHeight = maxDimension;
            targetWidth = Math.round(maxDimension * aspectRatio);
        }
    }
    const canvas = createCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    if(ctx) {
        ctx.drawImage(bufferedImage, 0, 0, targetWidth, targetHeight);
        return canvas.toBuffer('image/webp', { quality: 0.25 });
    }

    throw new Error(`Could not get canvas context for resizing ${imagePath}`);
}


// Eine kleine Helfer-Funktion für dein Upload-Skript:
function categorizeAdventure(name: string, description: string) {
    const text = (name + " " + description).toLowerCase();

    let category: 'indoor' | 'outdoor' | 'mixed' = 'outdoor'; // Default bei POIs meist Outdoor
    let tags: AdventureTypeKey[] = [];

    // Outdoor & Natur
    if (text.includes("berg") || text.includes("halde") || text.includes("gipfel")) tags.push('hiking', 'nature');
    if (text.includes("see") || text.includes("fluss") || text.includes("mündung")) tags.push('nature', 'swimming');
    if (text.includes("park") || text.includes("wald") || text.includes("flora") || text.includes("fauna")) tags.push('nature', 'cycling');

    // Indoor & Kultur
    if (text.includes("höhle") || text.includes("burg") || text.includes("schloss") || text.includes("dom") || text.includes("kirche")) {
        category = 'mixed';
        tags.push('sightseeing', 'photography', 'day_trip', 'family_friendly');
    }
    if (text.includes("museum") || text.includes("brauerei")) {
        category = 'indoor';
        tags.push('sightseeing', 'day_trip', 'photography');
    }
    if (text.includes("denkmal") || text.includes("zoo") || text.includes("aquarium")) {
        category = 'mixed';
        tags.push('sightseeing', 'family_friendly', 'photography');
    }

    // Wenn nichts passt, Fallback:
    if (tags.length === 0) tags.push('nature', 'day_trip');

    // Mache Tags unique und nimm maximal 3 (oder dein MAX_SELECTORS_SELECTED)
    tags = [...new Set(tags)].sort((a, b) => a.localeCompare(b)).slice(0, 3);

    return { category, tags };
}

function constructOpeningHours(facts: any): OpeningSlots[] {
    const slots: OpeningSlots[] = [];
    //Opening Slots inteface:
    // export interface OpeningSlots {
    //dayOfWeek: number; // 0=Montag, 6=Sonntag
    //from: number; // Minuten seit Mitternacht (0-1439)
    //to: number;   // Minuten seit Mitternacht (0-1439)


    const openingHours = facts.osmOpeningHours || null; // OSM Öffnungszeiten als Fallback
    if (openingHours) {
        //Format: Mo-Fr 10:00-18:00; Sa 10:00-14:00 || May-Oct: Sa,Su 11:00-17:00
        const parts = openingHours.split(";").map((part: string) => part.trim());
        parts.forEach((part: string) => {
            const [daysPart, timePart] = part.split(" ").map((p: string) => p.trim());
            if (!timePart) return;

            const days = parseDays(daysPart);
            const [fromStr, toStr] = timePart.split("-").map((t: string) => t.trim());
            const from = parseTime(fromStr);
            const to = parseTime(toStr);
            if (from !== null && to !== null) {
                days.forEach((day: number) => {
                    slots.push({ dayOfWeek: day, from, to });
                }
                );
            }
        });
    }
    return slots;
}

function parseTime(timeStr: string): number | null {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        return hours * 60 + minutes;
    }
    return null;
}

function parseDays(daysStr: string): number[] {
    const dayMap: Record<string, number> = {
        "mo": 0,
        "di": 1,
        "mi": 2,
        "do": 3,
        "fr": 4,
        "sa": 5,
        "so": 6,
        //Englisch
        "su": 6,
        "tu": 1,
        "we": 2,
        "th": 3,
    };

    const days: number[] = [];
    const parts = daysStr.split(",").map((p: string) => p.trim().toLowerCase());
    parts.forEach((part: string) => {
        if (part.includes("-")) {
            const [start, end] = part.split("-").map((d: string) => d.trim().toLowerCase());
            const startDay = dayMap[start];
            const endDay = dayMap[end];
            if (startDay !== undefined && endDay !== undefined) {
                for (let d = startDay; d !== (endDay + 1) % 7; d = (d + 1) % 7) {
                    days.push(d);
                }
            }
        }
        else {
            const day = dayMap[part];
            if (day !== undefined) {
                days.push(day);
            }
        }
    }
    );
    return days;
}

const uploadToSeedingApi = async () => {
    if (!seedingApiKey) {
        console.warn("Skipping upload step: SEEDING_API_KEY is missing.");
        return;
    }

    const data = await fs.readFile(refinedPicturesJsonPath, { encoding: 'utf8' });
    const refinedItems = JSON.parse(data) as RefinedAdventure[];
    const uploadedWikiIds = new Set<string>();

    let successCount = 0;
    let skipCount = 0;
    let failedCount = 0;

    for (let i = 0; i < refinedItems.length; i++) {
        const item = refinedItems[i];

        if (uploadedWikiIds.has(item.id)) {
            skipCount++;
            continue;
        }

        const imageFiles: File[] = [];
        for (const imageUrl of item.pictures || []) {
            const imageName = getImageFileNameFromUrl(imageUrl);
            const filePath = `${imagesDirectory}/${imageName}`;

            if (!(await fileExists(filePath))) {
                continue;
            }

            imageFiles.push(new File([await resizeImage(filePath)], imageName, { type: 'image/webp' }));

            if (imageFiles.length >= 5) {
                break;
            }
        }

        if (imageFiles.length === 0) {
            console.warn(`Skipping ${item.id}: no local images available.`);
            skipCount++;
            continue;
        }

        const { category, tags } = categorizeAdventure(item.name, item.description);
        const slots = constructOpeningHours(item.facts);

        const formData = new FormData();
        formData.set('title', item.name.slice(0, 100).trim().normalize());
        formData.set('description', item.description.slice(0, 5000));
        formData.set('tags', JSON.stringify(tags));
        formData.set('difficulty', 'easy');
        formData.set('category', category);
        formData.set('location', JSON.stringify({
            type: 'Point',
            displayname: item.name,
            coordinates: [item.location.lat, item.location.lon],
            name: item.name,
        }));
        formData.set('schedule', JSON.stringify({
            type: slots.length === 0 ? 'flexible' : slots.length === 1 ? 'fixed' : 'range',
            estimatedDuration: {
                min: 60,
                max: 180,
            },
            isApproximate: true,
            repeatsAnnually: false,
            slots: slots,
        }));
        formData.set('visibility', 'unlisted');
        formData.set('source', JSON.stringify({
            provider: 'wikipedia',
            wikipediaPageId: item.id,
            externalUrl: item.wikipedia || `https://www.wikidata.org/wiki/${item.id}`,
            attribution: 'CC-BY-SA 3.0, Daten von Wikidata/Wikipedia, Bilder von Wikimedia Commons',
        }));

        for (const imageFile of imageFiles) {
            formData.append('pictures', imageFile);
        }

        let response: Response | null = null;
        let uploadRetries = 3;

        while (uploadRetries > 0 && !response) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 90_000);

                const request = await fetch(seedingEndpoint, {
                    method: 'POST',
                    headers: {
                        'x-api-key': seedingApiKey,
                    },
                    body: formData,
                    signal: controller.signal,
                });

                clearTimeout(timeout);

                if (!request.ok) {
                    const body = await request.text();

                    if ((request.status === 429 || request.status >= 500) && uploadRetries > 1) {
                        uploadRetries--;
                        console.warn(`Upload retry for ${item.id}: ${request.status}. Remaining retries: ${uploadRetries}`);
                        await sleep(2_000);
                        continue;
                    }

                    failedCount++;
                    console.error(`Upload failed for ${item.id}: ${request.status} ${body}`);
                    break;
                }

                response = request;
            } catch (error) {
                uploadRetries--;

                if (uploadRetries <= 0) {
                    failedCount++;
                    console.error(`Upload failed for ${item.id}: network error`, error);
                    break;
                }

                console.warn(`Upload network retry for ${item.id}. Remaining retries: ${uploadRetries}`);
                await sleep(2_000);
            }
        }

        if (!response) {
            continue;
        }

        uploadedWikiIds.add(item.id);
        successCount++;
        console.log(`Uploaded seed ${successCount}: ${item.id} (${i + 1}/${refinedItems.length})`);

        await sleep(250);
    }

    console.log(`Upload finished. Success: ${successCount}, Skipped: ${skipCount}, Failed: ${failedCount}`);
}

const runSeeder = async () => {
    //1: Load OSM data via Overpass API
    await tryWithRetry(loadOverpassData, maxTries, retryDelay);
    //2: Collect Wikidata IDs from OSM data
    await collectWikiDataTags();
    //3: Fetch Wikidata details for all collected IDs
    await lookupWikiDataDetails();
    //4: Combine OSM and Wikidata details, extract relevant info and save to new file
    await combineOsmWithWikiData();
    //5: Enhance data with Wikipedia extracts and resolve Q-ID labels
    await enhanceWithWikipediaAndLabels();
    //6: Collect real image URLs from Wikimedia Commons based on P18 filenames
    await collectImages();
    //7: Download images locally to "data/images" folder
    await downloadImages();
    //8: Upload the final seeds to the Seeding API
    await uploadToSeedingApi();
};

//runSeeder();
const path = "Q:\\DEV\\workspace\\web\\Adventures\\data\\images\\23Haus_Nottbeck_2.JPG";

//resizeImage(path);