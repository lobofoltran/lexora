import type {
  DifficultyLevel,
  ExampleContext,
  FlashcardGenerationInput,
  KnowledgeDomain,
  OutputDepth,
  SynonymDensity,
  TargetAudience,
} from "./FlashcardGenerationInput";

/**
 * Default values used to preserve backward compatibility when optional fields are omitted.
 */
export const DEFAULT_FLASHCARD_CONFIG = {
  difficulty: "intermediate",
  domain: "general",
  targetAudience: "language_learners",
  outputDepth: "standard",
  exampleContext: "workplace",
  synonymDensity: "medium",
  includeEtymology: false,
  includeCodeExamples: false,
  includeCollocations: false,
  includeCommonMistakes: false,
} as const satisfies {
  difficulty: DifficultyLevel;
  domain: KnowledgeDomain;
  targetAudience: TargetAudience;
  outputDepth: OutputDepth;
  exampleContext: ExampleContext;
  synonymDensity: SynonymDensity;
  includeEtymology: boolean;
  includeCodeExamples: boolean;
  includeCollocations: boolean;
  includeCommonMistakes: boolean;
};

/**
 * Normalized, fully-resolved prompt input.
 */
export type ResolvedFlashcardGenerationInput = {
  words: string[];
  style: FlashcardGenerationInput["style"];
  difficulty: DifficultyLevel;
  domain: KnowledgeDomain;
  targetAudience: TargetAudience;
  outputDepth: OutputDepth;
  exampleContext: ExampleContext;
  synonymDensity: SynonymDensity;
  includeEtymology: boolean;
  includeCodeExamples: boolean;
  includeCollocations: boolean;
  includeCommonMistakes: boolean;
};

/**
 * Applies defaults and sanitation so prompt generation is deterministic.
 */
export function resolveFlashcardGenerationInput(
  input: FlashcardGenerationInput,
): ResolvedFlashcardGenerationInput {
  return {
    words: input.words.map((word) => word.trim()).filter(Boolean),
    style: input.style,
    difficulty: input.difficulty ?? DEFAULT_FLASHCARD_CONFIG.difficulty,
    domain: input.domain ?? DEFAULT_FLASHCARD_CONFIG.domain,
    targetAudience: input.targetAudience ?? DEFAULT_FLASHCARD_CONFIG.targetAudience,
    outputDepth: input.outputDepth ?? DEFAULT_FLASHCARD_CONFIG.outputDepth,
    exampleContext: input.exampleContext ?? DEFAULT_FLASHCARD_CONFIG.exampleContext,
    synonymDensity: input.synonymDensity ?? DEFAULT_FLASHCARD_CONFIG.synonymDensity,
    includeEtymology:
      input.includeEtymology ?? DEFAULT_FLASHCARD_CONFIG.includeEtymology,
    includeCodeExamples:
      input.includeCodeExamples ?? DEFAULT_FLASHCARD_CONFIG.includeCodeExamples,
    includeCollocations:
      input.includeCollocations ?? DEFAULT_FLASHCARD_CONFIG.includeCollocations,
    includeCommonMistakes:
      input.includeCommonMistakes ??
      DEFAULT_FLASHCARD_CONFIG.includeCommonMistakes,
  };
}
