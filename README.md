# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.


## TODO

- For-You page adventures anzeigen an mobiles design anpassen
- Die Geolocation abfrage nicht direkt abfragen
- Doppelklick auf in Navbar Entdecken Link soll die Einträge refreshen - Fertig
- Bei Adventure Eintrag die nav leiste oben verbessern - Fertig
- mehr Informationen zu den Einträgen anzeigen (z.B. Entfernung, Dauer, etc.)
- Bei Standort aktualisierung direkt Seite refreshen
- WEbsite Icon zu Adventure Icon ändern
- WEbsite Meta daten anpassen
- Fixen:  ERROR  [unhandledRejection] E11000 duplicate key error collection: adventures.adventure_view_records index: adventureId_1_userId_1 dup key: { adventureId: "699b21cfd379072b89cdd3d7", userId: null }                                                                                                                                                                                 - Bewertungssystem mit sternen/kommentare
- Crop Editor für Bilder
- Mehr farbe/primäre Farbe anpassen
- Kommentare/Bewertungssystem
- Auf Profil verlauf schöneres layout von informationen
- Auf Profil Seite die Abenteuer in Kartenansicht anzeigen

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
IPINFO_TOKEN=...
TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
```

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
