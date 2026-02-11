import { z } from "zod";

export const aiDraftStyleSchema = z.enum([
  "academic",
  "technical",
  "casual",
  "executive",
  "interview_preparation",
  "documentation",
]);

export type AIDraftStyle = z.infer<typeof aiDraftStyleSchema>;

export const aiDifficultyLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

export type AIDifficultyLevel = z.infer<typeof aiDifficultyLevelSchema>;

export const aiKnowledgeDomainSchema = z.enum([
  "general",
  "software_engineering",
  "devops",
  "cloud",
  "data_science",
  "finance",
  "business",
  "ai_ml",
  "cybersecurity",
]);

export type AIKnowledgeDomain = z.infer<typeof aiKnowledgeDomainSchema>;

export const aiOutputDepthSchema = z.enum([
  "compact",
  "standard",
  "robust",
  "encyclopedic",
]);

export type AIOutputDepth = z.infer<typeof aiOutputDepthSchema>;

export const aiExampleContextSchema = z.enum([
  "daily_life",
  "workplace",
  "software_projects",
  "startups",
  "enterprise",
  "academic",
  "interview",
]);

export type AIExampleContext = z.infer<typeof aiExampleContextSchema>;

export const aiSynonymDensitySchema = z.enum(["low", "medium", "high"]);

export type AISynonymDensity = z.infer<typeof aiSynonymDensitySchema>;

export const aiTargetAudienceSchema = z.enum([
  "language_learners",
  "developers",
  "engineers",
  "executives",
  "students",
]);

export type AITargetAudience = z.infer<typeof aiTargetAudienceSchema>;

export const aiDraftCardSchema = z.object({
  id: z.string().min(1),
  front: z.string(),
  back: z.string(),
  createdAt: z.string().datetime(),
  style: aiDraftStyleSchema,
});

export type AIDraftCard = z.infer<typeof aiDraftCardSchema>;

export const aiDeckDraftSessionSchema = z.object({
  deckId: z.string().min(1),
  wordsRaw: z.string(),
  style: aiDraftStyleSchema,
  difficulty: aiDifficultyLevelSchema,
  domain: aiKnowledgeDomainSchema,
  targetAudience: aiTargetAudienceSchema,
  outputDepth: aiOutputDepthSchema,
  exampleContext: aiExampleContextSchema,
  synonymDensity: aiSynonymDensitySchema,
  includeEtymology: z.boolean(),
  includeCodeExamples: z.boolean(),
  includeCollocations: z.boolean(),
  includeCommonMistakes: z.boolean(),
  drafts: aiDraftCardSchema.array(),
  updatedAt: z.string().datetime(),
});

export type AIDeckDraftSession = z.infer<typeof aiDeckDraftSessionSchema>;
