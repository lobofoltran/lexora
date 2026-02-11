import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

export const aiFlashcardSchema = z.object({
  front: z.string().trim().min(1),
  back: z.string().trim().min(1),
});

export const aiFlashcardsSchema = z.array(aiFlashcardSchema);

export type AIGeneratedFlashcard = z.infer<typeof aiFlashcardSchema>;

type AIServiceErrorCode =
  | "missing_api_key"
  | "empty_response"
  | "invalid_json"
  | "invalid_output"
  | "quota_exceeded"
  | "api_error";

export class AIServiceError extends Error {
  code: AIServiceErrorCode;

  constructor(code: AIServiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function buildPrompt(words: string[], style: string): string {
  return [
    "SYSTEM ROLE:",
    "You are an expert English teacher, linguist, and technical educator.",
    "You generate advanced flashcards optimized for deep learning and spaced repetition systems.",

    "OBJECTIVE:",
    "Create rich, information-dense flashcards that teach meaning, usage, context, and nuance — not just definitions.",

    "OUTPUT CONTRACT (STRICT):",
    "- Return ONLY a valid JSON array.",
    "- No markdown code fences.",
    "- No commentary outside JSON.",
    "- No trailing commas.",
    "- Each item must contain EXACTLY two fields:",
    '  • \"front\"',
    '  • \"back\"',

    "FIELD FORMAT:",
    "- Both fields must be Markdown strings.",
    "- Preserve JSON validity.",

    "FRONT RULES (STRICT):",
    "- Must ALWAYS be a question.",
    "- Must start with:",
    "    • 'What is' (singular)",
    "    • 'What are' (plural)",
    "- Format strictly:",
    "    'What is <term>?'",
    "- No hints, translations, or phonetics.",

    "PLURALIZATION:",
    "- Use 'What are' for plural or plural-uncountable concepts.",
    "- Example: 'What are microservices?'",

    "BACK RULES — ROBUST STRUCTURE (MANDATORY):",
    "The back MUST contain ALL sections below, using bullet points.",

    "",
    "1) Meaning",
    "   - Clear definition.",
    "   - Up to 2 sentences.",
    "   - No circular explanations.",
    "",
    "2) Detailed Explanation",
    "   - Expand the concept.",
    "   - How / why it is used.",
    "   - Practical interpretation.",
    "",
    "3) Example",
    "   - One realistic sentence.",
    "   - Professional or daily context.",
    "   - Highlight the term in **bold**.",
    "",
    "4) Synonyms or Related Terms",
    "   - 2–4 items.",
    "   - Only if applicable.",
    "",
    "5) Contrast / Common Confusion",
    "   - Explain what it is NOT.",
    "   - Differentiate from similar terms.",
    "",
    "6) Technical / Real-World Usage",
    "   - Prefer workplace, software, or academic scenarios.",
    "   - Especially for IT/business terms.",
    "",
    "7) Memory Tip",
    "   - Mnemonic, association, or mental model.",
    "   - Help retention.",

    "",
    "MARKDOWN FORMAT TEMPLATE:",
    "- Meaning: ...",
    "- Detailed Explanation: ...",
    "- Example: ...",
    "- Synonyms or Related Terms: ...",
    "- Contrast / Common Confusion: ...",
    "- Technical / Real-World Usage: ...",
    "- Memory Tip: ...",

    "",
    "STYLE GUIDELINES:",
    "- Educational and precise.",
    "- Concise but information-rich.",
    "- Avoid slang unless style requires.",
    "- Maintain technical accuracy.",

    "STYLE CATEGORY:",
    style,

    "TERM HANDLING RULES:",
    "- Preserve original casing.",
    "- Do not translate.",
    "- Expand acronyms.",
    "- Respect domain context.",

    "WORDS / TERMS INPUT:",
    ...words.map((w, i) => `${i + 1}. ${w}`),

    "",
    "OUTPUT SHAPE EXAMPLE (REFERENCE ONLY):",
    `[{
  "front": "What is Docker?",
  "back": "- Meaning: A containerization platform that packages applications and dependencies together.\\n- Detailed Explanation: Docker allows software to run consistently across environments by isolating it in containers.\\n- Example: We deployed the API using **Docker** to ensure environment consistency.\\n- Synonyms or Related Terms: Containers, Kubernetes, Virtualization.\\n- Contrast / Common Confusion: Unlike virtual machines, Docker containers share the host OS kernel.\\n- Technical / Real-World Usage: Widely used in CI/CD pipelines and microservices deployment.\\n- Memory Tip: Think of Docker as a \"shipping container\" for software."
}]`,

    "",
    "FINAL VALIDATION CHECKLIST:",
    "- Valid JSON array?",
    "- Two fields only?",
    "- Front is a question?",
    "- All back sections present?",
    "- Markdown bullets used?",
    "- English only?",

    "If any rule fails, regenerate before answering."
  ].join("\n");
}

function extractJsonArray(raw: string): string {
  const direct = raw.trim();

  if (direct.startsWith("[") && direct.endsWith("]")) {
    return direct;
  }

  const blockMatch = direct.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (blockMatch && blockMatch[1]) {
    const block = blockMatch[1].trim();

    if (block.startsWith("[") && block.endsWith("]")) {
      return block;
    }
  }

  const firstBracket = direct.indexOf("[");
  const lastBracket = direct.lastIndexOf("]");

  if (firstBracket === -1 || lastBracket === -1 || firstBracket >= lastBracket) {
    throw new AIServiceError(
      "invalid_json",
      "Gemini response is not a valid JSON array.",
    );
  }

  return direct.slice(firstBracket, lastBracket + 1).trim();
}

function normalizeServiceError(error: unknown): AIServiceError {
  if (error instanceof AIServiceError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "Unknown Gemini error.";
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("quota") ||
    lowerMessage.includes("429") ||
    lowerMessage.includes("resource_exhausted")
  ) {
    return new AIServiceError("quota_exceeded", "Gemini API quota exceeded.");
  }

  return new AIServiceError("api_error", message);
}

export async function generateFlashcards(
  words: string[],
  style: string,
): Promise<AIGeneratedFlashcard[]> {
  const apiKey = "AIzaSyDi6-UDVjGjGePxwdvNSHfhsnbW_HyjkkA";

  if (!apiKey) {
    throw new AIServiceError(
      "missing_api_key",
      "Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable.",
    );
  }

  const cleanWords = words.map((word) => word.trim()).filter(Boolean);

  if (cleanWords.length === 0) {
    return [];
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: "gemini-3-flash-preview" });
  const prompt = buildPrompt(cleanWords, style);

  try {
    const response = await model.generateContent(prompt);
    const text = response.response.text()?.trim() ?? "";

    if (!text) {
      throw new AIServiceError("empty_response", "Gemini returned an empty response.");
    }

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(extractJsonArray(text));
    } catch {
      throw new AIServiceError("invalid_json", "Gemini returned invalid JSON.");
    }

    const parsed = aiFlashcardsSchema.safeParse(parsedJson);

    if (!parsed.success) {
      throw new AIServiceError(
        "invalid_output",
        "Gemini output does not match the required card schema.",
      );
    }

    return parsed.data;
  } catch (error) {
    throw normalizeServiceError(error);
  }
}
