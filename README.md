
[![Build and Upload Artifacts](https://github.com/GoldenGamerLP/Adventures/actions/workflows/buildAndDeploy.yml/badge.svg)](https://github.com/GoldenGamerLP/Adventures/actions/workflows/buildAndDeploy.yml)

# Adventures
Adventures is a platform for sharing and discovering outdoor and indoor activities. Users can create and share their own adventures, as well as explore and join adventures created by others. The platform includes features such as user profiles, adventure categories, search and filtering options, and a recommendation system.


## TODO

- Besserer Algorithmus für die Empfehlungen, z.B. basierend auf den Interessen der Nutzer oder der Beliebtheit von Abenteuern und den Interessen von benutzuern
- Attributionen für wikipedia einträge überarbeiten, damit die Quelle klarer ist

- Crop Editor für Bilder
- Kommentare/Bewertungssystem
- Auf Profil Seite die Abenteuer in Kartenansicht anzeigen
- DSGVO konformität prüfen
- Karten anzeige für Abenteuer in der nähe des Benutzers hinzufügen
- Avatar standardisieren, z.B. mit einem generativen Avatar basierend auf dem Benutzernamen oder einer zufälligen Auswahl von vorgefertigten Avataren


## Seeding
- Seeding in combination with Adventures means that there is a process to populate the platform with initial adventures, which can be done manually or automatically. This helps to create a more engaging experience for users when they first visit the platform, as they will have a variety of adventures to explore and join right away.

### Important:
- Seeding is a one-time process, a anti-duplicate mechanism is in place to prevent the same adventures from being seeded multiple times. (You'll get a warning if you try to seed the same adventures again)
- You need to run the pipeline with `npm run seed --SEEDING_API_KEY=your_api_key --SEEDING_ENDPOINT=your_endpoint` to execute the seeding process and populate the platform with initial adventures. (Make sure to replace `your_api_key` and `your_endpoint` with the actual API key and endpoint provided for seeding AND you are using `npm` as your packet manager!)
- The seeding process may take some time to complete, depending on the number of adventures being seeded and the performance of the system. Please be patient while the seeding is in progress. (It takes about 2-3 hours when cold starting with about 300 adventures)

### Seeding Pipeline:
1. Fetching Data: The pipeline starts with overpass-api to fetch location data
2. Collecting Wiki Data Tags: The pipeline collects relevant tags for the adventures from Wikidata, which helps in categorizing and describing the adventures accurately.
3. Fetching Wikipedia Data: The pipeline retrieves detailed information about the adventures from Wikipedia, including descriptions, images, and other relevant data.
4. Combine Data: Collected Data will be combined with osm, wikidata
5. Enhance Data: Collected data will be enhanced by resolved Q-Ids
6. Image Collection: Collecting Images based on wikimedia and P18 Tags.
7. Image Downloading: The pipeline downloads the collected images to be used in the adventures. (Takes the most time, because of API restrictions)
8. Final Upload: The final step is to upload the processed adventures to the platform, making them available for users to explore and join.

### How to run the seeding pipeline:
1. Make sure you have the necessary environment variables set up, including the `SEEDING_API_KEY` for authentication.
2. Run the seeding pipeline using the command: `npm run seed --SEEDING_API_KEY=your_api_key --SEEDING_ENDPOINT=your_endpoint` (Replace `your_api_key` and `your_endpoint` with the actual API key and endpoint provided for seeding)
3. Monitor the progress of the seeding process, which may take several hours to complete. (Make sure your system remains active and connected to the internet during this time)
4. Go to `/seeding` to see adventures and approve/reject them. By apporving them with the `SEEDDING_API_KEY`, they will be added to the main adventure collection and become visible to all users on the platform. (Make sure to use the same `SEEDING_API_KEY` that you used to run the seeding pipeline for approving adventures)

## How to contribute

Always use 
```bash
bunx --bun eslint --fix
```
before commiting to ensure code quality and consistency.

## Env Datei
```json
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=adventures
//Für Produktion
TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
```

## Example docker compose file

You need to login to `ghcr.io` to pull the image.

1. Create a [personal access token](https://github.com/settings/tokens/new?scopes=write:packages)
2. Use the token to login to `ghcr.io` with your GitHub username.

You can do this with the following command:

```bash
docker login ghcr.io -u USERNAME -p TOKEN
```

```yaml
services:
    app:
        image:  ghcr.io/goldengamerlp/adventures:latest
        ports:
        - "3000:3000"
        environment:
        - MONGODB_URI=mongodb+srv://...
        - MONGODB_DATABASE=adventures
        - IPINFO_TOKEN=...
        - NUXT_PUBLIC_TURNSTILE_SITE_KEY=...
        - NUXT_TURNSTILE_SECRET_KEY=...
```



## Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Adventure Source Migration

Falls Alt-Daten noch `source.type` oder `authorId` enthalten, kann die Source-Struktur mit folgendem Skript normalisiert werden:

```bash
npm run migrate:adventure-source
```

Das Skript:
- migriert `source.type` zu `source.provider`
- entfernt veraltetes `authorId` aus `adventures`, `seeding_adventures` und `seeding_approvals`
- ergänzt bei alten User-Adventures `source.userId` aus `authorId`
- entfernt ungültige `source.review`-Felder bei `provider: user`

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
