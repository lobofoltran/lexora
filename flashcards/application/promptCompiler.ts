import type { ResolvedFlashcardGenerationInput } from "@/flashcards/domain/FlashcardConfig";

import {
  DEFAULT_PROMPT_SECTIONS,
  type PromptSectionBuilder,
} from "./promptSections";

/**
 * Compiles all configured sections into a single deterministic prompt string.
 */
export function compilePrompt(
  input: ResolvedFlashcardGenerationInput,
  sections: PromptSectionBuilder[] = DEFAULT_PROMPT_SECTIONS,
): string {
  return sections
    .map((buildSection) => buildSection(input).trim())
    .filter(Boolean)
    .join("\n\n");
}
