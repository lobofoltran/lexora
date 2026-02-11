import type { ResolvedFlashcardGenerationInput } from "@/flashcards/domain/FlashcardConfig";

const DOMAIN_RULES: Record<ResolvedFlashcardGenerationInput["domain"], string> = {
  general: "Use broadly understandable context with high clarity.",
  software_engineering:
    "Prioritize system design, APIs, microservices, and production environments.",
  devops: "Focus on CI/CD, infrastructure, automation, observability.",
  cloud:
    "Prioritize cloud architecture, managed services, reliability, and scalability.",
  data_science:
    "Prioritize statistics, modeling, data pipelines, and experiment interpretation.",
  finance:
    "Prioritize risk, valuation, financial metrics, and market behavior.",
  business:
    "Prioritize strategy, operations, metrics, communication, and decision-making.",
  ai_ml:
    "Prioritize model lifecycle, evaluation, deployment constraints, and tradeoffs.",
  cybersecurity:
    "Prioritize threat models, controls, incident response, and defense-in-depth.",
};

const EXAMPLE_CONTEXT_RULES: Record<
  ResolvedFlashcardGenerationInput["exampleContext"],
  string
> = {
  daily_life: "Examples should use everyday situations and natural language.",
  workplace: "Examples should reflect realistic workplace communication and tasks.",
  software_projects: "Examples should reflect software delivery and engineering collaboration.",
  startups: "Examples should reflect ambiguity, rapid iteration, and small teams.",
  enterprise: "Examples must reflect large-scale production systems.",
  academic: "Examples should resemble lectures, research, and academic writing.",
  interview: "Examples should resemble technical interview explanations.",
};

/**
 * Builds domain and context conditioning rules.
 */
export function buildDomainRulesSection(
  input: ResolvedFlashcardGenerationInput,
): string {
  return [
    "DOMAIN + CONTEXT CONDITIONING:",
    `- Knowledge domain: ${input.domain}`,
    `- Example context: ${input.exampleContext}`,
    `- Difficulty: ${input.difficulty}`,
    DOMAIN_RULES[input.domain],
    EXAMPLE_CONTEXT_RULES[input.exampleContext],
  ].join("\n");
}
