import type { ResolvedFlashcardGenerationInput } from "@/flashcards/domain/FlashcardConfig";

const STYLE_GUIDANCE: Record<ResolvedFlashcardGenerationInput["style"], string> = {
  academic: "Use a formal educational tone with precise terminology.",
  technical: "Favor technical precision, implementation detail, and production relevance.",
  casual: "Use approachable language while preserving correctness.",
  executive: "Prioritize strategic clarity, business impact, and concise communication.",
  interview_preparation:
    "Emphasize interview-ready explanations, tradeoffs, and crisp examples.",
  documentation: "Write in a documentation style: explicit, structured, and unambiguous.",
};

const AUDIENCE_GUIDANCE: Record<ResolvedFlashcardGenerationInput["targetAudience"], string> = {
  language_learners: "Assume readers are improving English comprehension and retention.",
  developers: "Assume readers are software developers using terms in codebases.",
  engineers: "Assume readers are engineers who need system-level understanding.",
  executives: "Assume readers are leaders optimizing communication and decisions.",
  students: "Assume readers are students preparing for structured learning and exams.",
};

/**
 * Builds the role and pedagogical framing section.
 */
export function buildRoleSection(input: ResolvedFlashcardGenerationInput): string {
  return [
    "SYSTEM ROLE:",
    "You are an expert English teacher and domain-aware educator.",
    "Generate information-rich flashcards optimized for spaced repetition.",
    `Style: ${input.style}`,
    `Difficulty: ${input.difficulty}`,
    `Target audience: ${input.targetAudience}`,
    STYLE_GUIDANCE[input.style],
    AUDIENCE_GUIDANCE[input.targetAudience],
  ].join("\n");
}
