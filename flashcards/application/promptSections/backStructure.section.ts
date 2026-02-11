import type { ResolvedFlashcardGenerationInput } from "@/flashcards/domain/FlashcardConfig";

const DEPTH_BASE_SECTIONS: Record<
  ResolvedFlashcardGenerationInput["outputDepth"],
  string[]
> = {
  compact: ["Meaning", "Example"],
  standard: ["Meaning", "Detailed Explanation", "Example"],
  robust: [
    "Meaning",
    "Detailed Explanation",
    "Example",
    "Synonyms or Related Terms",
    "Contrast / Common Confusion",
    "Technical / Real-World Usage",
    "Memory Tip",
  ],
  encyclopedic: [
    "Meaning",
    "Detailed Explanation",
    "Example",
    "Synonyms or Related Terms",
    "Contrast / Common Confusion",
    "Technical / Real-World Usage",
    "Memory Tip",
    "Etymology",
    "Collocations",
    "Common Mistakes",
  ],
};

const SYNONYM_DENSITY: Record<ResolvedFlashcardGenerationInput["synonymDensity"], string> = {
  low: "1-2 related terms.",
  medium: "2-4 related terms.",
  high: "4-6 related terms with concise distinctions.",
};

function computeSections(input: ResolvedFlashcardGenerationInput): string[] {
  const sections = [...DEPTH_BASE_SECTIONS[input.outputDepth]];

  if (input.includeEtymology) {
    sections.push("Etymology");
  }

  if (input.includeCollocations) {
    sections.push("Collocations");
  }

  if (input.includeCommonMistakes) {
    sections.push("Common Mistakes");
  }

  if (input.includeCodeExamples) {
    sections.push("Code Example");
  }

  return Array.from(new Set(sections));
}

function sectionInstruction(
  section: string,
  input: ResolvedFlashcardGenerationInput,
): string {
  switch (section) {
    case "Meaning":
      return "Clear definition in up to 2 sentences.";
    case "Detailed Explanation":
      return "Explain how and why the concept is used in practice.";
    case "Example":
      return "One realistic sentence and highlight the term in **bold**.";
    case "Synonyms or Related Terms":
      return `Provide ${SYNONYM_DENSITY[input.synonymDensity]}`;
    case "Contrast / Common Confusion":
      return "Differentiate from similar concepts and clarify what it is not.";
    case "Technical / Real-World Usage":
      return "Show practical usage in credible real-world environments.";
    case "Memory Tip":
      return "Provide a mnemonic or mental model for retention.";
    case "Etymology":
      return "Briefly explain origin or word formation when known.";
    case "Collocations":
      return "List natural collocations and phrase usage.";
    case "Common Mistakes":
      return "Add a section explaining common learner mistakes.";
    case "Code Example":
      return "Include a short code snippet demonstrating usage.";
    default:
      return "Provide concise, accurate markdown bullet content.";
  }
}

/**
 * Builds back-side structure instructions based on depth and enrichment toggles.
 */
export function buildBackStructureSection(
  input: ResolvedFlashcardGenerationInput,
): string {
  const sections = computeSections(input);

  return [
    "BACK STRUCTURE (MANDATORY):",
    `- Output depth: ${input.outputDepth}`,
    "- Use markdown bullets and include the following sections in order:",
    ...sections.map(
      (section, index) =>
        `${index + 1}) ${section}: ${sectionInstruction(section, input)}`,
    ),
  ].join("\n");
}
