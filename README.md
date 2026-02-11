# Lexora

Lexora is an offline-first flashcard platform (Anki-style core) built with Next.js App Router and static export.

## Features

- Deck CRUD
- Markdown flashcards (front/back)
- SM2-lite review scheduling (`hard`, `normal`, `easy`)
- Due-card review queue by deck
- Local persistence with Zustand + localForage (IndexedDB)
- JSON export/import merge
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

## Data Model

Export/import file shape:

```json
{
  "decks": [],
  "cards": []
}
```

All data is stored locally in the browser via IndexedDB.
