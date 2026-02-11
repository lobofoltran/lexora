import { z } from "zod";

import { cardSchema, deckSchema, type Card, type Deck } from "@/types/flashcards";

export const flashcardDataSchema = z.object({
  decks: z.array(deckSchema),
  cards: z.array(cardSchema),
});

export type FlashcardData = z.infer<typeof flashcardDataSchema>;

export function buildExportPayload(decks: Deck[], cards: Card[]): FlashcardData {
  return flashcardDataSchema.parse({ decks, cards });
}

export function exportDataAsJson(data: FlashcardData): string {
  return JSON.stringify(flashcardDataSchema.parse(data), null, 2);
}

export function downloadJson(data: FlashcardData, fileName = "lexora-export.json"): void {
  const json = exportDataAsJson(data);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function parseImportJson(raw: string): FlashcardData {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  return flashcardDataSchema.parse(parsed);
}

function resolveNewestCard(current: Card, candidate: Card): Card {
  const currentUpdated = Date.parse(current.updatedAt);
  const candidateUpdated = Date.parse(candidate.updatedAt);

  if (Number.isNaN(currentUpdated) || Number.isNaN(candidateUpdated)) {
    return candidate;
  }

  return candidateUpdated >= currentUpdated ? candidate : current;
}

export function mergeFlashcardData(
  current: FlashcardData,
  incoming: FlashcardData,
): FlashcardData {
  const decksMap = new Map<string, Deck>();

  for (const deck of current.decks) {
    decksMap.set(deck.id, deck);
  }

  for (const deck of incoming.decks) {
    decksMap.set(deck.id, deck);
  }

  const mergedDecks = Array.from(decksMap.values());
  const validDeckIds = new Set(mergedDecks.map((deck) => deck.id));

  const cardsMap = new Map<string, Card>();

  for (const card of current.cards) {
    if (validDeckIds.has(card.deckId)) {
      cardsMap.set(card.id, card);
    }
  }

  for (const card of incoming.cards) {
    if (!validDeckIds.has(card.deckId)) {
      continue;
    }

    const existing = cardsMap.get(card.id);

    if (!existing) {
      cardsMap.set(card.id, card);
      continue;
    }

    cardsMap.set(card.id, resolveNewestCard(existing, card));
  }

  return flashcardDataSchema.parse({
    decks: mergedDecks,
    cards: Array.from(cardsMap.values()),
  });
}
