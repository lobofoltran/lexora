"use client";

import { useSearchParams } from "next/navigation";

import { DeckCardsClient } from "./deck-cards-client";

export function DeckPageClient() {
  const searchParams = useSearchParams();
  const deckId = searchParams.get("id") ?? "";

  return <DeckCardsClient deckId={deckId} />;
}
