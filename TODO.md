1. Seeding-V1 (4-6 Wochen): Vorschläge + Dubletten + moderiertes Publish.
2. GPX-V1 (4-8 Wochen): Import, Anzeige, Filter, Metadaten.
3. Danach verbinden: GPX-basierte Adventures priorisieren und als “verified route” kennzeichnen.

overpass-turbo: https://overpass-turbo.eu/s/2oep
anfrage: https://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%5Btimeout%3A85%5D%3B%0Aarea%28id%3A3600062761%29-%3E.nrw%3B%0A%0A%28%0A%20%20%2F%2Fnode%28area.nrw%29%5B%22tourism%22%3D%22museum%22%5D%5B%22wikidata%22~%22%5EQ%5B0-9%5D%2B%24%22%5D%5B%22name%22~%22.%2B%22%5D%3B%0A%20%20node%28area.nrw%29%5B%22tourism%22%3D%22attraction%22%5D%5B%22wikidata%22~%22%5EQ%5B0-9%5D%2B%24%22%5D%5B%22name%22~%22.%2B%22%5D%3B%0A%20%20node%28area.nrw%29%5B%22tourism%22%3D%22viewpoint%22%5D%5B%22wikidata%22~%22%5EQ%5B0-9%5D%2B%24%22%5D%5B%22name%22~%22.%2B%22%5D%3B%0A%20%20%2F%2Fnode%28area.nrw%29%5B%22natural%22%3D%22peak%22%5D%5B%22wikidata%22~%22%5EQ%5B0-9%5D%2B%24%22%5D%5B%22name%22~%22.%2B%22%5D%3B%0A%20%20%2F%2Fnode%28area.nrw%29%5B%22historic%22%3D%22monument%22%5D%5B%22wikidata%22~%22%5EQ%5B0-9%5D%2B%24%22%5D%5B%22name%22~%22.%2B%22%5D%3B%0A%20%20%2F%2Fnode%28area.nrw%29%5B%22leisure%22%3D%22park%22%5D%5B%22wikidata%22~%22%5EQ%5B0-9%5D%2B%24%22%5D%5B%22name%22~%22.%2B%22%5D%3B%0A%29%3B%0A%0Aout%20tags%3B


export interface Adventure {
    _id: string;
    title: string;
    description: string;
    location?: GeoLocation;
    /** Event-Zeitplanung mit flexibler Dauer */
    schedule: EventSchedule;
    difficulty: 'easy' | 'medium' | 'hard';
    category: AdventureCategory;
    createdAt: Date;
    updatedAt: Date;
    pictureIds: string[];
    tags: AdventureTypeKey[];
    authorId: string;
    draftId: string;
    visibility: 'public' | 'private' | 'unlisted';
}

Backend Api:

Mit FormData:

title: string, description: string,
location: { displayname: string, name: string, coordinates [number, number] },
schedule: { type: {single, range, flexible}, startDate: string, endDate: string, estimatedDuration: {min: number, max: number}, repeatsAnnually: boolean, slots: { dayOfWeek: number, from: number, to:number}[] },
difficulty: {easy, medium, hard},
pictures: Files[], tags: AdventureTypeKey[], authorId,
visibillity: { public, private, unlisted }

Plan:
1. POIs aus OSM (tourism=attraction, leisure=park, natural=peak, etc.) extrahieren und als Vorschläge für Abenteuer verwenden.
2. 