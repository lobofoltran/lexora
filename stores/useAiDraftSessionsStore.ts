import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_FLASHCARD_CONFIG } from "@/flashcards/domain/FlashcardConfig";
import { STORE_KEYS, zustandStorage } from "@/lib/storage";
import {
  aiDeckDraftSessionSchema,
  aiDraftCardSchema,
  aiDraftStyleSchema,
  aiDifficultyLevelSchema,
  aiExampleContextSchema,
  aiKnowledgeDomainSchema,
  aiOutputDepthSchema,
  aiSynonymDensitySchema,
  aiTargetAudienceSchema,
  type AIDeckDraftSession,
  type AIDraftCard,
  type AIDraftStyle,
} from "@/types/ai-drafts";

const DEFAULT_AI_STYLE: AIDraftStyle = "academic";

const LEGACY_STYLE_MAP: Record<string, AIDraftStyle> = {
  vocabulary: "academic",
  "phrasal verbs": "casual",
  "tech terms": "technical",
};

interface UpdateDraftPatch {
  front?: string;
  back?: string;
}

interface UpdateGenerationOptionsPatch {
  difficulty?: AIDeckDraftSession["difficulty"];
  domain?: AIDeckDraftSession["domain"];
  targetAudience?: AIDeckDraftSession["targetAudience"];
  outputDepth?: AIDeckDraftSession["outputDepth"];
  exampleContext?: AIDeckDraftSession["exampleContext"];
  synonymDensity?: AIDeckDraftSession["synonymDensity"];
  includeEtymology?: boolean;
  includeCodeExamples?: boolean;
  includeCollocations?: boolean;
  includeCommonMistakes?: boolean;
}

interface AIDraftSessionsStore {
  sessions: Record<string, AIDeckDraftSession>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  sanitizeSessions: () => void;
  setDeckWordsRaw: (deckId: string, wordsRaw: string) => void;
  setDeckStyle: (deckId: string, style: AIDraftStyle) => void;
  setDeckGenerationOptions: (
    deckId: string,
    patch: UpdateGenerationOptionsPatch,
  ) => void;
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
    difficulty: DEFAULT_FLASHCARD_CONFIG.difficulty,
    domain: DEFAULT_FLASHCARD_CONFIG.domain,
    targetAudience: DEFAULT_FLASHCARD_CONFIG.targetAudience,
    outputDepth: DEFAULT_FLASHCARD_CONFIG.outputDepth,
    exampleContext: DEFAULT_FLASHCARD_CONFIG.exampleContext,
    synonymDensity: DEFAULT_FLASHCARD_CONFIG.synonymDensity,
    includeEtymology: DEFAULT_FLASHCARD_CONFIG.includeEtymology,
    includeCodeExamples: DEFAULT_FLASHCARD_CONFIG.includeCodeExamples,
    includeCollocations: DEFAULT_FLASHCARD_CONFIG.includeCollocations,
    includeCommonMistakes: DEFAULT_FLASHCARD_CONFIG.includeCommonMistakes,
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
  const fallback = createEmptyDeckSession(deckId);

  const wordsRaw = typeof record.wordsRaw === "string" ? record.wordsRaw : "";
  const styleRaw = typeof record.style === "string" ? record.style : "";
  const styleCandidate = aiDraftStyleSchema.safeParse(styleRaw);
  const legacyStyle = LEGACY_STYLE_MAP[styleRaw.trim().toLowerCase()];
  const style = styleCandidate.success
    ? styleCandidate.data
    : legacyStyle ?? DEFAULT_AI_STYLE;
  const difficultyCandidate = aiDifficultyLevelSchema.safeParse(record.difficulty);
  const difficulty = difficultyCandidate.success
    ? difficultyCandidate.data
    : fallback.difficulty;
  const domainCandidate = aiKnowledgeDomainSchema.safeParse(record.domain);
  const domain = domainCandidate.success ? domainCandidate.data : fallback.domain;
  const targetAudienceCandidate = aiTargetAudienceSchema.safeParse(
    record.targetAudience,
  );
  const targetAudience = targetAudienceCandidate.success
    ? targetAudienceCandidate.data
    : fallback.targetAudience;
  const outputDepthCandidate = aiOutputDepthSchema.safeParse(record.outputDepth);
  const outputDepth = outputDepthCandidate.success
    ? outputDepthCandidate.data
    : fallback.outputDepth;
  const exampleContextCandidate = aiExampleContextSchema.safeParse(
    record.exampleContext,
  );
  const exampleContext = exampleContextCandidate.success
    ? exampleContextCandidate.data
    : fallback.exampleContext;
  const synonymDensityCandidate = aiSynonymDensitySchema.safeParse(
    record.synonymDensity,
  );
  const synonymDensity = synonymDensityCandidate.success
    ? synonymDensityCandidate.data
    : fallback.synonymDensity;
  const includeEtymology =
    typeof record.includeEtymology === "boolean"
      ? record.includeEtymology
      : fallback.includeEtymology;
  const includeCodeExamples =
    typeof record.includeCodeExamples === "boolean"
      ? record.includeCodeExamples
      : fallback.includeCodeExamples;
  const includeCollocations =
    typeof record.includeCollocations === "boolean"
      ? record.includeCollocations
      : fallback.includeCollocations;
  const includeCommonMistakes =
    typeof record.includeCommonMistakes === "boolean"
      ? record.includeCommonMistakes
      : fallback.includeCommonMistakes;
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
    difficulty,
    domain,
    targetAudience,
    outputDepth,
    exampleContext,
    synonymDensity,
    includeEtymology,
    includeCodeExamples,
    includeCollocations,
    includeCommonMistakes,
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
      setDeckGenerationOptions: (deckId, patch) => {
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
                ...patch,
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
