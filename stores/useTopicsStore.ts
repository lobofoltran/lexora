import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { STORE_KEYS, zustandStorage } from "@/lib/storage";
import { topicSchema, type Topic } from "@/types/flashcards";

const topicsArraySchema = topicSchema.array();

interface TopicsStore {
  topics: Topic[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  createTopic: (name: string) => Topic;
  renameTopic: (id: string, name: string) => void;
  deleteTopic: (id: string) => void;
  mergeTopics: (topics: Topic[]) => void;
  replaceTopics: (topics: Topic[]) => void;
  resetTopics: () => void;
}

export const useTopicsStore = create<TopicsStore>()(
  persist(
    (set, get) => ({
      topics: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      createTopic: (name) => {
        const now = new Date().toISOString();
        const topic = topicSchema.parse({
          id: nanoid(),
          name: name.trim(),
          createdAt: now,
        });

        set({ topics: [...get().topics, topic] });
        return topic;
      },
      renameTopic: (id, name) => {
        const trimmedName = name.trim();

        if (!trimmedName) {
          return;
        }

        set({
          topics: get().topics.map((topic) =>
            topic.id === id
              ? topicSchema.parse({
                  ...topic,
                  name: trimmedName,
                })
              : topic,
          ),
        });
      },
      deleteTopic: (id) => {
        set({ topics: get().topics.filter((topic) => topic.id !== id) });
      },
      mergeTopics: (incoming) => {
        const merged = new Map<string, Topic>();

        for (const topic of get().topics) {
          merged.set(topic.id, topic);
        }

        for (const topic of topicsArraySchema.parse(incoming)) {
          merged.set(topic.id, topic);
        }

        set({ topics: Array.from(merged.values()) });
      },
      replaceTopics: (topics) => {
        set({ topics: topicsArraySchema.parse(topics) });
      },
      resetTopics: () => {
        set({ topics: [] });
      },
    }),
    {
      name: STORE_KEYS.topics,
      storage: zustandStorage,
      partialize: (state) => ({ topics: state.topics }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
