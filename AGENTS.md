# Lexora Agent Rules

## Product Constraints

- Static export only (`next.config.ts` uses `output: "export"`)
- No backend
- No API routes
- No route handlers
- No server actions
- All persistence must be local

## Storage Requirements

- Use Zustand stores for app state
- Use `persist` middleware
- Use `localForage` (IndexedDB) as storage backend

## UI Requirements

- Use shadcn/ui components
- Keep App Router routes under `/app`
- Support markdown card content rendering

## Import/Export Rules

- JSON format must remain:

```json
{
  "decks": [],
  "cards": []
}
```

- Import must validate data with Zod before merge
- Export must include all local decks and cards

## Review Engine Requirements

- Keep SM2-lite logic in `src/services/review.service.ts`
- Supported grades: `hard`, `normal`, `easy`
- Review updates must set interval, repetitions, ease factor, due date, and timestamps
