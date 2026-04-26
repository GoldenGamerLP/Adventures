import fs from "fs/promises";

const wikiDataUrl = "https://www.wikidata.org/w/api.php";
const turboPassUrl = "https://overpass-api.de/api/interpreter";
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
);
out body geom;
`;
const maxTries = 3;
const retryDelay = 5000; // 5 seconds

const overpassDataFilePath = "data/overpassData.json";
const wikiDataIdsFilePath = "data/wikiIds.json";
const wikiDataDetailsFilePath = "data/wikiDataDetails.json";
const wikiDataRefinedDetailsFilePath = "data/wikiDataRefinedDetails.json";
const imagesDirectory = "data/images";
const seedingEndpoint = process.env.SEEDING_ENDPOINT || "http://localhost:3000/api/v1/seeding/adventures";
const seedingApiKey = process.env.SEEDING_API_KEY || "";

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
                "User-Agent": "AdventuresAppSeed/1.0",
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


        const response = await fetch(`${wikiDataUrl}?action=wbgetentities&ids=${idsParam}&format=json&props=labels|descriptions|claims|siteclaims&languages=de`, {
            headers: {
                "Accept": "application/json",
                "User-Agent": "AdventuresAppSeed/1.0",
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

//Combine osm data with wikidata details, remove unnecessary fields and save to new file
//Use OSMName, wiki description, wiki claims for location, and wiki sitelinks for wikipedia links, collect pictures from claims if available
const refineWikiDataDetails = async () => {
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

        const wikiDescription = wikiItem.descriptions?.de?.value || wikiItem.descriptions?.en?.value || "";
        const osmDescription = osmItem.tags.description || osmItem.tags['description'] || "";

        const wikiName = wikiItem.labels?.de?.value || wikiItem.labels?.en?.value || "";
        const osmName = osmItem.tags.name || osmItem.tags['name:de'] || osmItem.tags['name:en'] || "";

        const refinedItem = {
            id: wikiItem.id,
            name: wikiName.length > 0 ? wikiName : osmName,
            description: osmDescription.length > wikiDescription.length ? osmDescription : wikiDescription || "No description available",
            location: {
                lat: osmItem.lat,
                lon: osmItem.lon,
            },
            wikipedia: wikiItem.sitelinks?.dewiki?.title ? `https://de.wikipedia.org/wiki/${wikiItem.sitelinks.dewiki.title}` : null,
            pictures: wikiItem.claims?.P18 ? wikiItem.claims.P18.map((claim: any) => claim.mainsnak.datavalue.value) : [],
        };
        refinedDetails.push(refinedItem);
    }

    await fs.mkdir("data", { recursive: true });
    await fs.writeFile(wikiDataRefinedDetailsFilePath, JSON.stringify(refinedDetails, null, 2));
    console.log(`Refined WikiData details saved to ${wikiDataRefinedDetailsFilePath}`);
};

const collectImages = async (batchSize: number = 50) => {
    // Lese die bereinigten Daten ein, denn hier stehen bereits die P18-Dateinamen drin ("pictures")
    const data = await fs.readFile(wikiDataRefinedDetailsFilePath, { encoding: 'utf8' });
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
                "User-Agent": "AdventuresAppSeed/1.0",
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

        console.log(`Fetched images for batch ${i / batchSize + 1} (${batch.length} items)`);
    }

    // Jetzt mappen wir die fertigen URLs zurück in unsere Items
    const finalAdventures = refinedItems.map((item: any) => {
        return {
            ...item,
            pictures: item.pictures.map((pic: string) => imageUrls[pic]).filter(Boolean)
        };
    });

    await fs.mkdir("data", { recursive: true });
    // Wir speichern das fertige Ergebnis, das jetzt die echten hochauflösenden URLs enthält
    await fs.writeFile(wikiDataRefinedDetailsFilePath, JSON.stringify(finalAdventures, null, 2));
    console.log(`Seed data with images saved to ${wikiDataRefinedDetailsFilePath}`);
};

const downloadImages = async () => {
    const data = await fs.readFile(wikiDataRefinedDetailsFilePath, { encoding: 'utf8' });
    const refinedItems = JSON.parse(data);

    await fs.mkdir(imagesDirectory, { recursive: true }); // Sicherstellen, dass das Verzeichnis existiert

    for (let i = 0; i < refinedItems.length; i++) {
        const element = refinedItems[i];
        const imagesUrls = element.pictures as string[];

        for (const image of imagesUrls) {
            const splitName = image.split("/");
            const imageName = decodeURIComponent(splitName[splitName.length - 1]);
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
                    const imageData = await fetch(image, {
                        headers: {
                            "User-Agent": "AdventuresAppSeed/1.0",
                        }
                    });

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
                    await new Promise(res => setTimeout(res, 1000));
                } catch (error) {
                    console.error(`Network Error while downloading image ${image}! Retrying...`, error);
                    retries--;
                    await new Promise(res => setTimeout(res, 5000)); // Bei echtem Netzwerkfehler 5 Sekunden warten
                }
            }

            if (!success) {
                console.error(`Gave up downloading ${imageName} after multiple attempts.`);
            }
        }
    }
    console.log("Image downloading finished.");
}

// Eine kleine Helfer-Funktion für dein Upload-Skript:
function categorizeAdventure(name: string, description: string) {
    const text = (name + " " + description).toLowerCase();

    let category: 'indoor' | 'outdoor' | 'mixed' = 'outdoor'; // Default bei POIs meist Outdoor
    let tags: string[] = [];

    // Outdoor & Natur
    if (text.includes("berg") || text.includes("halde") || text.includes("gipfel")) tags.push('hiking', 'nature');
    if (text.includes("see") || text.includes("fluss") || text.includes("mündung")) tags.push('nature', 'swimming');
    if (text.includes("park") || text.includes("wald")) tags.push('nature', 'cycling');

    // Indoor & Kultur
    if (text.includes("höhle") || text.includes("burg") || text.includes("schloss")) {
        category = 'mixed';
        tags.push('sightseeing', 'photography');
    }
    if (text.includes("museum") || text.includes("brauerei")) {
        category = 'indoor';
        tags.push('sightseeing', 'culinary');
    }

    // Wenn nichts passt, Fallback:
    if (tags.length === 0) tags.push('nature', 'day_trip');

    // Mache Tags unique und nimm maximal 3 (oder dein MAX_SELECTORS_SELECTED)
    tags = [...new Set(tags)].slice(0, 2);

    return { category, tags };
}

const uploadToSeedingApi = async () => {
    if (!seedingApiKey) {
        console.warn("Skipping upload step: SEEDING_API_KEY is missing.");
        return;
    }

    const data = await fs.readFile(wikiDataRefinedDetailsFilePath, { encoding: 'utf8' });
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

            const imageBuffer = await fs.readFile(filePath);
            imageFiles.push(new File([imageBuffer], imageName, {
                type: getContentType(imageName),
                lastModified: Date.now(),
            }));

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

        const formData = new FormData();
        formData.set('title', item.name.slice(0, 100));
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
            type: 'flexible',
            estimatedDuration: {
                min: 60,
                max: 180,
            },
            isApproximate: true,
            repeatsAnnually: false,
            slots: [],
        }));
        formData.set('visibility', 'unlisted');
        formData.set('source', JSON.stringify({
            provider: 'wikipedia',
            wikipediaPageId: item.id,
            externalUrl: item.wikipedia || `https://www.wikidata.org/wiki/${item.id}`,
            attribution: 'Wikidata / Wikimedia Commons',
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
    await tryWithRetry(loadOverpassData, maxTries, retryDelay);
    await collectWikiDataTags();
    await lookupWikiDataDetails();
    await refineWikiDataDetails();
    await collectImages();
    await downloadImages();
    await uploadToSeedingApi();
};

runSeeder();