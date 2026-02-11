import { z } from "zod";

export const aiDraftStyleSchema = z.enum([
  "Vocabulary",
  "Phrasal verbs",
  "Tech terms",
]);

export type AIDraftStyle = z.infer<typeof aiDraftStyleSchema>;

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
  drafts: aiDraftCardSchema.array(),
  updatedAt: z.string().datetime(),
});

export type AIDeckDraftSession = z.infer<typeof aiDeckDraftSessionSchema>;
