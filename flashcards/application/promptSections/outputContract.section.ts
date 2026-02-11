import type { ResolvedFlashcardGenerationInput } from "@/flashcards/domain/FlashcardConfig";

/**
 * Defines strict response format constraints.
 */
export function buildOutputContractSection(
  input: ResolvedFlashcardGenerationInput,
): string {
  void input;

  return [
    "OUTPUT CONTRACT (STRICT):",
    "- Return ONLY a valid JSON array.",
    "- Do not use markdown code fences.",
    "- Do not include commentary outside JSON.",
    "- No trailing commas.",
    "- Each array item must contain EXACTLY two fields:",
    '  - "front"',
    '  - "back"',
    "- Both fields must be markdown strings.",
  ].join("\n");
}
