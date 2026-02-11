import type { ResolvedFlashcardGenerationInput } from "@/flashcards/domain/FlashcardConfig";

/**
 * Builds mandatory rules for the front card side.
 */
export function buildFrontRulesSection(
  input: ResolvedFlashcardGenerationInput,
): string {
  void input;

  return [
    "FRONT RULES:",
    "- The front must ALWAYS be a question.",
    "- Start with 'What is' for singular terms.",
    "- Start with 'What are' for plural terms.",
    "- Format: 'What is <term>?' or 'What are <term>?'.",
    "- Preserve original term casing from input words.",
    "- Do not add hints, translations, or phonetics on the front.",
  ].join("\n");
}
