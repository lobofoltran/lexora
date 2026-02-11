import { create } from "zustand";
import { persist } from "zustand/middleware";

import { STORE_KEYS, zustandStorage } from "@/lib/storage";
import {
  aiDeckDraftSessionSchema,
  aiDraftCardSchema,
  aiDraftStyleSchema,
  type AIDeckDraftSession,
  type AIDraftCard,
  type AIDraftStyle,
} from "@/types/ai-drafts";

const DEFAULT_AI_STYLE: AIDraftStyle = "Vocabulary";

interface UpdateDraftPatch {
  front?: string;
  back?: string;
}

interface AIDraftSessionsStore {
  sessions: Record<string, AIDeckDraftSession>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  sanitizeSessions: () => void;
  setDeckWordsRaw: (deckId: string, wordsRaw: string) => void;
  setDeckStyle: (deckId: string, style: AIDraftStyle) => void;
  appendDeckDrafts: (deckId: string, drafts: AIDraftCard[]) => void;
  updateDeckDraft: (deckId: string, draftId: string, patch: UpdateDraftPatch) => void;
  removeDeckDraft: (deckId: string, draftId: string) => void;
  clearDeckDrafts: (deckId: string) => void;
  clearDeckSession: (deckId: string) => void;
}

function toIsoNow(): string {
  return new Date().toISOString();
}

function createEmptyDeckSession(deckId: string): AIDeckDraftSession {
  const now = toIsoNow();

  return {
    deckId,
    wordsRaw: "",
    style: DEFAULT_AI_STYLE,
    drafts: [],
    updatedAt: now,
  };
}

function getSession(
  sessions: Record<string, AIDeckDraftSession>,
  deckId: string,
): AIDeckDraftSession {
  return sessions[deckId] ?? createEmptyDeckSession(deckId);
}

function sanitizeDrafts(raw: unknown): AIDraftCard[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const drafts: AIDraftCard[] = [];

  for (const entry of raw) {
    const parsed = aiDraftCardSchema.safeParse(entry);

    if (!parsed.success) {
      continue;
    }

    drafts.push(parsed.data);
  }

  return drafts;
}

function sanitizeDeckSession(deckId: string, raw: unknown): AIDeckDraftSession {
  const source = typeof raw === "object" && raw !== null ? raw : {};
  const record = source as Record<string, unknown>;

  const wordsRaw = typeof record.wordsRaw === "string" ? record.wordsRaw : "";
  const styleCandidate = aiDraftStyleSchema.safeParse(record.style);
  const style = styleCandidate.success ? styleCandidate.data : DEFAULT_AI_STYLE;
  const drafts = sanitizeDrafts(record.drafts);
  const updatedAtCandidate =
    typeof record.updatedAt === "string" &&
    !Number.isNaN(Date.parse(record.updatedAt))
      ? record.updatedAt
      : toIsoNow();

  return aiDeckDraftSessionSchema.parse({
    deckId,
    wordsRaw,
    style,
    drafts,
    updatedAt: updatedAtCandidate,
  });
}

function sanitizeSessionsCollection(raw: unknown): Record<string, AIDeckDraftSession> {
  if (typeof raw !== "object" || raw === null) {
    return {};
  }

  const source = raw as Record<string, unknown>;
  const sessions: Record<string, AIDeckDraftSession> = {};

  for (const [deckId, entry] of Object.entries(source)) {
    if (!deckId) {
      continue;
    }

    sessions[deckId] = sanitizeDeckSession(deckId, entry);
  }

  return sessions;
}

export const useAiDraftSessionsStore = create<AIDraftSessionsStore>()(
  persist(
    (set) => ({
      sessions: {},
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      sanitizeSessions: () =>
        set((state) => ({
          sessions: sanitizeSessionsCollection(state.sessions),
        })),
      setDeckWordsRaw: (deckId, wordsRaw) => {
        if (!deckId) {
          return;
        }

        set((state) => {
          const session = getSession(state.sessions, deckId);

          return {
            sessions: {
              ...state.sessions,
              [deckId]: {
                ...session,
                wordsRaw,
                updatedAt: toIsoNow(),
              },
            },
          };
        });
      },
      setDeckStyle: (deckId, style) => {
        if (!deckId) {
          return;
        }

        set((state) => {
          const session = getSession(state.sessions, deckId);

          return {
            sessions: {
              ...state.sessions,
              [deckId]: {
                ...session,
                style,
                updatedAt: toIsoNow(),
              },
            },
          };
        });
      },
      appendDeckDrafts: (deckId, drafts) => {
        if (!deckId || drafts.length === 0) {
          return;
        }

        const parsedDrafts = drafts
          .map((draft) => aiDraftCardSchema.safeParse(draft))
          .filter((result) => result.success)
          .map((result) => result.data);

        if (parsedDrafts.length === 0) {
          return;
        }

        set((state) => {
          const session = getSession(state.sessions, deckId);

          return {
            sessions: {
              ...state.sessions,
              [deckId]: {
                ...session,
                drafts: [...parsedDrafts, ...session.drafts],
                updatedAt: toIsoNow(),
              },
            },
          };
        });
      },
      updateDeckDraft: (deckId, draftId, patch) => {
        if (!deckId || !draftId) {
          return;
        }

        set((state) => {
          const session = getSession(state.sessions, deckId);
          let changed = false;
          const drafts = session.drafts.map((draft) => {
            if (draft.id !== draftId) {
              return draft;
            }

            changed = true;
            return {
              ...draft,
              ...patch,
            };
          });

          if (!changed) {
            return state;
          }

          return {
            sessions: {
              ...state.sessions,
              [deckId]: {
                ...session,
                drafts,
                updatedAt: toIsoNow(),
              },
            },
          };
        });
      },
      removeDeckDraft: (deckId, draftId) => {
        if (!deckId || !draftId) {
          return;
        }

        set((state) => {
          const session = getSession(state.sessions, deckId);
          const drafts = session.drafts.filter((draft) => draft.id !== draftId);

          if (drafts.length === session.drafts.length) {
            return state;
          }

          return {
            sessions: {
              ...state.sessions,
              [deckId]: {
                ...session,
                drafts,
                updatedAt: toIsoNow(),
              },
            },
          };
        });
      },
      clearDeckDrafts: (deckId) => {
        if (!deckId) {
          return;
        }

        set((state) => {
          const session = getSession(state.sessions, deckId);

          return {
            sessions: {
              ...state.sessions,
              [deckId]: {
                ...session,
                drafts: [],
                updatedAt: toIsoNow(),
              },
            },
          };
        });
      },
      clearDeckSession: (deckId) => {
        if (!deckId) {
          return;
        }

        set((state) => {
          if (!state.sessions[deckId]) {
            return state;
          }

          const sessions = { ...state.sessions };
          delete sessions[deckId];

          return { sessions };
        });
      },
    }),
    {
      name: STORE_KEYS.aiDraftSessions,
      storage: zustandStorage,
      partialize: (state) => ({ sessions: state.sessions }),
      onRehydrateStorage: () => (state) => {
        state?.sanitizeSessions();
        state?.setHasHydrated(true);
      },
    },
  ),
);
