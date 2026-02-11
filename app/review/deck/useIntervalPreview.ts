"use client";

import { useMemo } from "react";

import {
  previewNextInterval as previewNextIntervalDryRun,
  type ReviewGrade,
} from "@/services/review.service";
import { useCardsStore } from "@/stores/useCardsStore";
import type { Card } from "@/types/flashcards";

export function useIntervalPreview(
  card: Card | undefined,
  grade: ReviewGrade,
): Date | null {
  const cards = useCardsStore((state) => state.cards);

  const previewNextInterval = useMemo(() => {
    const cardsById = new Map(cards.map((item) => [item.id, item]));

    return (cardId: string, reviewGrade: ReviewGrade): Date => {
      const target = cardsById.get(cardId);

      if (!target) {
        throw new Error(`Card not found: ${cardId}`);
      }

      return previewNextIntervalDryRun(target, reviewGrade);
    };
  }, [cards]);

  return useMemo(() => {
    if (!card) {
      return null;
    }

    try {
      return previewNextInterval(card.id, grade);
    } catch {
      return null;
    }
  }, [card, grade, previewNextInterval]);
}
