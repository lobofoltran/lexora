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
    "You are generating English flashcards for language learning.",

    "Return only a JSON array. Do not include markdown code fences.",
    "Each item must be an object with exactly two fields: front and back.",
    "Both fields must be English markdown strings.",

    "FRONT RULES:",
    "- Must ALWAYS be a question.",
    "- Must start with 'What is' or 'What are'.",
    "- Format: 'What is <term>?'",
    "- Do not add extra commentary.",
    "- If the term is plural, use 'What are'.",

    "BACK RULES:",
    "- Must contain:",
    "  1) Meaning",
    "  2) Example sentence",
    "- Use bullet points.",
    "- English only.",

    "Style category:",
    style,

    "Words/terms:",
    ...words.map((w, i) => `${i + 1}. ${w}`),

    "Output shape:",
    '[{"front":"What is ...?","back":"- Meaning: ..."}]',
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
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();

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
