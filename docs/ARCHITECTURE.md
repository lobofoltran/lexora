# Architecture

## Offline-First

Lexora is a client-only application:

- No API routes
- No route handlers
- No server actions
- No backend services

The app is exported statically (`output: "export"`) and runs entirely in the browser.

## Storage Model

State is split into two persisted Zustand stores:

- `useDecksStore`
- `useCardsStore`

Persistence details:

- Zustand `persist` middleware
- Custom storage adapter backed by `localForage`
- `localForage` uses IndexedDB

Data shape:

- `Deck`: id, name, createdAt
- `Card`: front/back markdown, scheduling metadata, due date timestamps

Import/export path:

- Export current store state to JSON
- Import validates JSON with Zod
- Merge strategy deduplicates by ID
- Card conflicts resolved by newest `updatedAt`

## Review Engine

The review engine is implemented in `src/services/review.service.ts` as SM2-lite.

Grades:

- `hard`
- `normal`
- `easy`

Scheduling behavior:

- `hard`: reset repetition, set interval to 1 day, reduce ease factor (min 1.3)
- `normal`: increment repetition, interval is 1 day on first success, otherwise doubles
- `easy`: increment repetition, interval is 2 days on first success, otherwise `round(interval * easeFactor)`, and increases ease factor

On review, the card gets:

- updated due date (`now + intervalDays`)
- `lastReviewedAt`
- `updatedAt`

## UI Structure

Primary routes:

- `/review`: deck-level due overview
- `/review/deck?deckId=...`: due queue and grading flow
- `/management`: deck CRUD
- `/management/deck?id=...`: per-deck card management and bulk creation

Shared layout includes a navigation header with:

- Review link
- Card Management link
- Data actions: export/import/reset
