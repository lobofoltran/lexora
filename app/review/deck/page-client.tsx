"use client";

import { useSearchParams } from "next/navigation";
import { DeckReviewClient } from "./deck-review-client";

export function ReviewDeckPageClient() {
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId") ?? "";

  return <DeckReviewClient deckId={deckId} />;
}
