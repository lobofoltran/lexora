import localforage from "localforage";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

export const STORE_KEYS = {
  decks: "anki-decks-store",
  cards: "anki-cards-store",
  aiDraftSessions: "anki-ai-draft-sessions-store",
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

export const ankiForage = localforage.createInstance({
  name: "anki",
  storeName: "flashcards",
  driver: localforage.INDEXEDDB,
});

const indexedDbStorage: StateStorage = {
  getItem: async (key) => {
    const value = await ankiForage.getItem<string>(key);
    return value ?? null;
  },
  setItem: async (key, value) => {
    await ankiForage.setItem(key, value);
  },
  removeItem: async (key) => {
    await ankiForage.removeItem(key);
  },
};

export const zustandStorage = createJSONStorage(() =>
  typeof window === "undefined" ? fallbackStorage : indexedDbStorage,
);

export async function clearAnkiStorage(): Promise<void> {
  await Promise.all([
    ankiForage.removeItem(STORE_KEYS.decks),
    ankiForage.removeItem(STORE_KEYS.cards),
    ankiForage.removeItem(STORE_KEYS.aiDraftSessions),
  ]);
}
