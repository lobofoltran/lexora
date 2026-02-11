import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { STORE_KEYS, zustandStorage } from "@/lib/storage";
import { deckSchema, type Deck } from "@/types/flashcards";

const decksArraySchema = deckSchema.array();

interface DecksStore {
  decks: Deck[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  createDeck: (name: string) => Deck;
  renameDeck: (id: string, name: string) => void;
  deleteDeck: (id: string) => void;
  mergeDecks: (decks: Deck[]) => void;
  replaceDecks: (decks: Deck[]) => void;
  resetDecks: () => void;
}

export const useDecksStore = create<DecksStore>()(
  persist(
    (set, get) => ({
      decks: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      createDeck: (name) => {
        const now = new Date().toISOString();
        const deck = deckSchema.parse({
          id: nanoid(),
          name: name.trim(),
          createdAt: now,
        });

        set({ decks: [...get().decks, deck] });
        return deck;
      },
      renameDeck: (id, name) => {
        const trimmedName = name.trim();

        if (!trimmedName) {
          return;
        }

        set({
          decks: get().decks.map((deck) =>
            deck.id === id
              ? deckSchema.parse({
                  ...deck,
                  name: trimmedName,
                })
              : deck,
          ),
        });
      },
      deleteDeck: (id) => {
        set({ decks: get().decks.filter((deck) => deck.id !== id) });
      },
      mergeDecks: (incoming) => {
        const merged = new Map<string, Deck>();

        for (const deck of get().decks) {
          merged.set(deck.id, deck);
        }

        for (const deck of decksArraySchema.parse(incoming)) {
          merged.set(deck.id, deck);
        }

        set({ decks: Array.from(merged.values()) });
      },
      replaceDecks: (decks) => {
        set({ decks: decksArraySchema.parse(decks) });
      },
      resetDecks: () => {
        set({ decks: [] });
      },
    }),
    {
      name: STORE_KEYS.decks,
      storage: zustandStorage,
      partialize: (state) => ({ decks: state.decks }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
