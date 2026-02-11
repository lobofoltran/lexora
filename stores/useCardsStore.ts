import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { STORE_KEYS, zustandStorage } from "@/lib/storage";
import { scheduleMutationAutoSync } from "@/lib/sync/auto-sync";
import {
  applyReviewGrade,
  type ReviewGrade,
} from "@/services/review.service";
import { cardSchema, type Card } from "@/types/flashcards";

const cardsArraySchema = cardSchema.array();

interface CreateCardInput {
  deckId: string;
  front: string;
  back: string;
}

interface UpdateCardInput {
  id: string;
  front: string;
  back: string;
}

interface CardsStore {
  cards: Card[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  createCard: (input: CreateCardInput) => Card;
  updateCard: (input: UpdateCardInput) => void;
  deleteCard: (id: string) => void;
  deleteCardsByDeck: (deckId: string) => void;
  reviewCard: (id: string, grade: ReviewGrade) => Card | undefined;
  mergeCards: (cards: Card[]) => void;
  replaceCards: (cards: Card[]) => void;
  resetCards: () => void;
}

function resolveNewestCard(current: Card, candidate: Card): Card {
  const currentUpdated = Date.parse(current.updatedAt);
  const candidateUpdated = Date.parse(candidate.updatedAt);

  if (Number.isNaN(currentUpdated) || Number.isNaN(candidateUpdated)) {
    return candidate;
  }

  return candidateUpdated >= currentUpdated ? candidate : current;
}

export const useCardsStore = create<CardsStore>()(
  persist(
    (set, get) => ({
      cards: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      createCard: ({ deckId, front, back }) => {
        const now = new Date().toISOString();
        const card = cardSchema.parse({
          id: nanoid(),
          deckId,
          front,
          back,
          easeFactor: 2.5,
          intervalDays: 0,
          repetitions: 0,
          dueDate: now,
          createdAt: now,
          updatedAt: now,
        });

        set({ cards: [...get().cards, card] });
        scheduleMutationAutoSync();
        return card;
      },
      updateCard: ({ id, front, back }) => {
        const now = new Date().toISOString();

        set({
          cards: get().cards.map((card) => {
            if (card.id !== id) {
              return card;
            }

            return cardSchema.parse({
              ...card,
              front,
              back,
              updatedAt: now,
            });
          }),
        });
        scheduleMutationAutoSync();
      },
      deleteCard: (id) => {
        set({ cards: get().cards.filter((card) => card.id !== id) });
        scheduleMutationAutoSync();
      },
      deleteCardsByDeck: (deckId) => {
        set({ cards: get().cards.filter((card) => card.deckId !== deckId) });
        scheduleMutationAutoSync();
      },
      reviewCard: (id, grade) => {
        const target = get().cards.find((card) => card.id === id);

        if (!target) {
          return undefined;
        }

        const updated = cardSchema.parse(applyReviewGrade(target, grade));

        set({
          cards: get().cards.map((card) => (card.id === id ? updated : card)),
        });

        return updated;
      },
      mergeCards: (incoming) => {
        const merged = new Map<string, Card>();

        for (const card of get().cards) {
          merged.set(card.id, card);
        }

        for (const card of cardsArraySchema.parse(incoming)) {
          const existing = merged.get(card.id);

          if (!existing) {
            merged.set(card.id, card);
            continue;
          }

          merged.set(card.id, resolveNewestCard(existing, card));
        }

        set({ cards: Array.from(merged.values()) });
      },
      replaceCards: (cards) => {
        set({ cards: cardsArraySchema.parse(cards) });
      },
      resetCards: () => {
        set({ cards: [] });
      },
    }),
    {
      name: STORE_KEYS.cards,
      storage: zustandStorage,
      partialize: (state) => ({ cards: state.cards }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
