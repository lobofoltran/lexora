# Anki

Anki is an offline-first flashcard platform (Anki-style core) built with Next.js App Router and static export.

## Features

- Deck CRUD
- Markdown flashcards (front/back)
- SM2-lite review scheduling (`hard`, `normal`, `easy`)
- Due-card review queue by deck
- Local persistence with Zustand + localForage (IndexedDB)
- JSON export/import merge
- PWA install support (manifest + service worker + offline fallback)
- No backend, no API routes, no server actions

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind + shadcn/ui components
- Zustand (`persist` middleware)
- localForage (IndexedDB)
- react-markdown + remark-gfm

## Install

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

AI generation runs client-side for this MVP, so the Gemini key is exposed in the browser.

## Build (Static Export)

```bash
pnpm build
```

This generates a static export in `out/`.

## Static Deploy

Deploy the contents of `out/` to any static hosting provider.

Examples:

- Netlify: publish directory `out`
- Vercel static hosting: serve `out`
- Nginx: serve `out` as site root

## PWA

Anki includes:

- `public/manifest.webmanifest`
- `public/sw.js` (runtime + app-shell caching)
- `public/offline.html` fallback
- App icons under `public/icons/`

For installation and service worker support in production, serve the app over HTTPS (or `localhost` in development).

## Data Model

Export/import file shape:

```json
{
  "decks": [],
  "cards": []
}
```

All data is stored locally in the browser via IndexedDB.

## Auto Sync Behavior

Google Drive sync uses a single file (`anki-sync.json`) with scope `https://www.googleapis.com/auth/drive.file`.

- Tokens are held in memory only (never persisted).
- Sync state metadata is persisted in localStorage (`lastSyncAt`, `lastSyncStatus`, `remoteFileId`, `pendingChanges`).
- Card mutations (create, edit, delete, batch/AI-created cards) mark pending changes and debounce auto-sync by 5 seconds.
- Review completion triggers immediate sync.
- On app startup, if a remote file is known and silent auth is available, Anki downloads and merges remote data.
- If offline, sync is blocked, pending changes remain queued, and retry runs automatically when the browser goes online.
- Conflict resolution always compares `updatedAt` and keeps the newest card version.
