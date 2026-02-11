import { z } from "zod";

import { cardSchema, topicSchema, type Card, type Topic } from "@/types/flashcards";

export const flashcardDataSchema = z.object({
  topics: z.array(topicSchema),
  cards: z.array(cardSchema),
});

export type FlashcardData = z.infer<typeof flashcardDataSchema>;

export function buildExportPayload(topics: Topic[], cards: Card[]): FlashcardData {
  return flashcardDataSchema.parse({ topics, cards });
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
  const topicsMap = new Map<string, Topic>();

  for (const topic of current.topics) {
    topicsMap.set(topic.id, topic);
  }

  for (const topic of incoming.topics) {
    topicsMap.set(topic.id, topic);
  }

  const mergedTopics = Array.from(topicsMap.values());
  const validTopicIds = new Set(mergedTopics.map((topic) => topic.id));

  const cardsMap = new Map<string, Card>();

  for (const card of current.cards) {
    if (validTopicIds.has(card.topicId)) {
      cardsMap.set(card.id, card);
    }
  }

  for (const card of incoming.cards) {
    if (!validTopicIds.has(card.topicId)) {
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
    topics: mergedTopics,
    cards: Array.from(cardsMap.values()),
  });
}
