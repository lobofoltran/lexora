import type { ResolvedFlashcardGenerationInput } from "@/flashcards/domain/FlashcardConfig";

/**
 * Builds optional enrichment instructions controlled by boolean toggles.
 */
export function buildEnrichmentRulesSection(
  input: ResolvedFlashcardGenerationInput,
): string {
  const rules: string[] = [
    "ENRICHMENT RULES:",
    `- includeEtymology: ${input.includeEtymology}`,
    `- includeCodeExamples: ${input.includeCodeExamples}`,
    `- includeCollocations: ${input.includeCollocations}`,
    `- includeCommonMistakes: ${input.includeCommonMistakes}`,
  ];

  if (input.includeCodeExamples) {
    rules.push("- Include a short code snippet demonstrating usage.");
  }

  if (input.includeCommonMistakes) {
    rules.push("- Add a section explaining common learner mistakes.");
  }

  if (input.includeCollocations) {
    rules.push("- List natural collocations and phrase usage.");
  }

  if (input.includeEtymology) {
    rules.push("- Add a concise etymology note when reliable.");
  }

  if (
    !input.includeCodeExamples &&
    !input.includeCommonMistakes &&
    !input.includeCollocations &&
    !input.includeEtymology
  ) {
    rules.push("- No optional enrichment toggles are enabled.");
  }

  return rules.join("\n");
}
