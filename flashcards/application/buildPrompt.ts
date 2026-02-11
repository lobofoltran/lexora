import {
  resolveFlashcardGenerationInput,
  type ResolvedFlashcardGenerationInput,
} from "@/flashcards/domain/FlashcardConfig";
import type { FlashcardGenerationInput } from "@/flashcards/domain/FlashcardGenerationInput";

import { compilePrompt } from "./promptCompiler";

/**
 * Public prompt builder for flashcard generation.
 *
 * @example
 * buildPrompt({
 *   words: ["Kubernetes", "CI/CD"],
 *   style: "technical",
 *   difficulty: "advanced",
 *   domain: "devops",
 *   outputDepth: "robust",
 *   includeCodeExamples: true,
 *   includeCommonMistakes: true,
 * });
 */
export function buildPrompt(input: FlashcardGenerationInput): string {
  const resolvedInput = resolveFlashcardGenerationInput(input);
  return compilePrompt(resolvedInput);
}

/**
 * Exposed for tests and advanced callers that want direct access to normalized config.
 */
export function normalizePromptInput(
  input: FlashcardGenerationInput,
): ResolvedFlashcardGenerationInput {
  return resolveFlashcardGenerationInput(input);
}
