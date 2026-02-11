import type { ResolvedFlashcardGenerationInput } from "@/flashcards/domain/FlashcardConfig";

import { buildBackStructureSection } from "./promptSections/backStructure.section";
import { buildDomainRulesSection } from "./promptSections/domainRules.section";
import { buildEnrichmentRulesSection } from "./promptSections/enrichmentRules.section";
import { buildFrontRulesSection } from "./promptSections/frontRules.section";
import { buildOutputContractSection } from "./promptSections/outputContract.section";
import { buildRoleSection } from "./promptSections/role.section";
import { buildValidationChecklistSection } from "./promptSections/validationChecklist.section";

export type PromptSectionBuilder = (
  input: ResolvedFlashcardGenerationInput,
) => string;

/**
 * Builds the words payload section in deterministic order.
 */
export function buildWordsSection(input: ResolvedFlashcardGenerationInput): string {
  return [
    "WORDS / TERMS INPUT:",
    ...input.words.map((word, index) => `${index + 1}. ${word}`),
  ].join("\n");
}

/**
 * Default section order used by the prompt compiler.
 */
export const DEFAULT_PROMPT_SECTIONS: PromptSectionBuilder[] = [
  buildRoleSection,
  buildOutputContractSection,
  buildFrontRulesSection,
  buildBackStructureSection,
  buildDomainRulesSection,
  buildEnrichmentRulesSection,
  buildWordsSection,
  buildValidationChecklistSection,
];

export {
  buildBackStructureSection,
  buildDomainRulesSection,
  buildEnrichmentRulesSection,
  buildFrontRulesSection,
  buildOutputContractSection,
  buildRoleSection,
  buildValidationChecklistSection,
};
