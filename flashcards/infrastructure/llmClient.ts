import { buildPrompt } from "@/flashcards/application/buildPrompt";
import type { FlashcardGenerationInput } from "@/flashcards/domain/FlashcardGenerationInput";

/**
 * Infrastructure contract for any LLM provider.
 * This layer intentionally defines interfaces only; it does not perform API calls.
 */
export interface LLMClient {
  generate(input: { prompt: string }): Promise<string>;
}

/**
 * Provider-agnostic prompt payload ready to be sent to an LLM client.
 */
export type FlashcardPromptRequest = {
  prompt: string;
};

/**
 * Builds a provider-agnostic request payload from generation input.
 */
export function toFlashcardPromptRequest(
  input: FlashcardGenerationInput,
): FlashcardPromptRequest {
  return {
    prompt: buildPrompt(input),
  };
}
