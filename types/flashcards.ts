import { z } from "zod";

export const deckSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
});

export type Deck = z.infer<typeof deckSchema>;

export const cardSchema = z.object({
  id: z.string().min(1),
  deckId: z.string().min(1),
  front: z.string(),
  back: z.string(),
  easeFactor: z.number().min(1.3),
  intervalDays: z.number().int().min(0),
  repetitions: z.number().int().min(0),
  dueDate: z.string().datetime(),
  lastReviewedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Card = z.infer<typeof cardSchema>;
