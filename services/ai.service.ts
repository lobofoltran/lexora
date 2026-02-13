import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

import { buildPrompt } from "@/flashcards/application/buildPrompt";
import type {
  FlashcardGenerationInput,
  FlashcardStyle,
} from "@/flashcards/domain/FlashcardGenerationInput";

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

const FLASHCARD_STYLES: ReadonlySet<FlashcardStyle> = new Set([
  "academic",
  "technical",
  "casual",
  "executive",
  "interview_preparation",
  "documentation",
]);

function mapLegacyStyle(style: string): FlashcardStyle {
  const normalized = style.trim().toLowerCase();

  if (FLASHCARD_STYLES.has(normalized as FlashcardStyle)) {
    return normalized as FlashcardStyle;
  }

  if (normalized.includes("tech")) {
    return "technical";
  }

  if (normalized.includes("phrasal") || normalized.includes("casual")) {
    return "casual";
  }

  if (normalized.includes("interview")) {
    return "interview_preparation";
  }

  if (normalized.includes("doc")) {
    return "documentation";
  }

  if (normalized.includes("exec")) {
    return "executive";
  }

  return "academic";
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
  options?: Omit<FlashcardGenerationInput, "words" | "style">,
): Promise<AIGeneratedFlashcard[]> {

  const cleanWords = words.map((word) => word.trim()).filter(Boolean);

  if (cleanWords.length === 0) {
    return [];
  }

  const prompt = buildPrompt({
    words: cleanWords,
    style: mapLegacyStyle(style),
    ...options,
  });

  try {
    const response = await fetch(
      "https://gemini-worker.lobofoltran.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new AIServiceError(
        "api_error",
        `Worker request failed: ${response.status}`,
      );
    }

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    if (!text) {
      throw new AIServiceError(
        "empty_response",
        "Gemini returned an empty response.",
      );
    }

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(extractJsonArray(text));
    } catch {
      throw new AIServiceError(
        "invalid_json",
        "Gemini returned invalid JSON.",
      );
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
