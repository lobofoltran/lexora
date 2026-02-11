/**
 * Stylistic voice used to render generated flashcards.
 */
export type FlashcardStyle =
  | "academic"
  | "technical"
  | "casual"
  | "executive"
  | "interview_preparation"
  | "documentation";

/**
 * Controls conceptual complexity and vocabulary sophistication.
 */
export type DifficultyLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

/**
 * Domain lens used to bias definitions and examples.
 */
export type KnowledgeDomain =
  | "general"
  | "software_engineering"
  | "devops"
  | "cloud"
  | "data_science"
  | "finance"
  | "business"
  | "ai_ml"
  | "cybersecurity";

/**
 * Controls the amount of information required on the back side.
 */
export type OutputDepth =
  | "compact"
  | "standard"
  | "robust"
  | "encyclopedic";

/**
 * Context used to anchor generated examples.
 */
export type ExampleContext =
  | "daily_life"
  | "workplace"
  | "software_projects"
  | "startups"
  | "enterprise"
  | "academic"
  | "interview";

/**
 * Controls how many synonym/related terms are expected when that section is present.
 */
export type SynonymDensity = "low" | "medium" | "high";

/**
 * Audience tuning for explanation framing.
 */
export type TargetAudience =
  | "language_learners"
  | "developers"
  | "engineers"
  | "executives"
  | "students";

/**
 * Configurable input used to generate flashcard prompts.
 */
export type FlashcardGenerationInput = {
  words: string[];
  style: FlashcardStyle;

  difficulty?: DifficultyLevel;
  domain?: KnowledgeDomain;
  targetAudience?: TargetAudience;
  outputDepth?: OutputDepth;
  exampleContext?: ExampleContext;

  synonymDensity?: SynonymDensity;

  includeEtymology?: boolean;
  includeCodeExamples?: boolean;
  includeCollocations?: boolean;
  includeCommonMistakes?: boolean;
};
