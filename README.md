
[![Build and Upload Artifacts](https://github.com/GoldenGamerLP/Adventures/actions/workflows/buildAndDeploy.yml/badge.svg)](https://github.com/GoldenGamerLP/Adventures/actions/workflows/buildAndDeploy.yml)

# Adventures
Adventures is a platform for sharing and discovering outdoor and indoor activities. Users can create and share their own adventures, as well as explore and join adventures created by others. The platform includes features such as user profiles, adventure categories, search and filtering options, and a recommendation system.


## TODO

- Crop Editor für Bilder
- Kommentare/Bewertungssystem
- Auf Profil Seite die Abenteuer in Kartenansicht anzeigen

- Markdown in der Beschreibung erlauben

- Playlists
- Erstellen
- Quick add
- Löschen
- Bearbeiten


- Wöchentliche Öffnungszeiten auf mobile ansicht besser anzeigen

- DSGVO konformität prüfen


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
