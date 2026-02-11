import localforage from "localforage";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

export const STORE_KEYS = {
  decks: "lexora-decks-store",
  cards: "lexora-cards-store",
} as const;

const memoryStorage = new Map<string, string>();

const fallbackStorage: StateStorage = {
  getItem: (key) => memoryStorage.get(key) ?? null,
  setItem: (key, value) => {
    memoryStorage.set(key, value);
  },
  removeItem: (key) => {
    memoryStorage.delete(key);
  },
};

export const lexoraForage = localforage.createInstance({
  name: "lexora",
  storeName: "flashcards",
  driver: localforage.INDEXEDDB,
});

const indexedDbStorage: StateStorage = {
  getItem: async (key) => {
    const value = await lexoraForage.getItem<string>(key);
    return value ?? null;
  },
  setItem: async (key, value) => {
    await lexoraForage.setItem(key, value);
  },
  removeItem: async (key) => {
    await lexoraForage.removeItem(key);
  },
};

export const zustandStorage = createJSONStorage(() =>
  typeof window === "undefined" ? fallbackStorage : indexedDbStorage,
);

export async function clearLexoraStorage(): Promise<void> {
  await Promise.all([
    lexoraForage.removeItem(STORE_KEYS.decks),
    lexoraForage.removeItem(STORE_KEYS.cards),
  ]);
}
