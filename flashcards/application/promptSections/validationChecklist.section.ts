import type { ResolvedFlashcardGenerationInput } from "@/flashcards/domain/FlashcardConfig";

/**
 * Builds final deterministic validation checklist appended to the prompt.
 */
export function buildValidationChecklistSection(
  input: ResolvedFlashcardGenerationInput,
): string {
  void input;

  return [
    "VALIDATION CHECKLIST:",
    "- Valid JSON?",
    "- Two fields only?",
    "- Front is a question?",
    "- All required sections present?",
    "- Markdown bullets used?",
    "If any check fails, regenerate and return only corrected JSON.",
  ].join("\n");
}
