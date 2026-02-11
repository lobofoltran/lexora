"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ReviewGrade } from "@/services/review.service";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { useCardsStore } from "@/stores/useCardsStore";
import { useDecksStore } from "@/stores/useDecksStore";
import { IntervalPreviewButton } from "./IntervalPreviewButton";
import { useIntervalPreview } from "./useIntervalPreview";

interface DeckReviewClientProps {
  deckId: string;
}

export function DeckReviewClient({ deckId }: DeckReviewClientProps) {
  const decks = useDecksStore((state) => state.decks);
  const decksHydrated = useDecksStore((state) => state.hasHydrated);

  const cards = useCardsStore((state) => state.cards);
  const cardsHydrated = useCardsStore((state) => state.hasHydrated);
  const reviewCard = useCardsStore((state) => state.reviewCard);

  const currentTime = useMemo(() => Date.parse(new Date().toISOString()), []);
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);

  const hydrated = decksHydrated && cardsHydrated;
  const deck = decks.find((item) => item.id === deckId);

  const dueCards = useMemo(() => {
    return cards
      .filter(
        (card) => card.deckId === deckId && Date.parse(card.dueDate) <= currentTime,
      )
      .sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate));
  }, [cards, currentTime, deckId]);

  const current = dueCards[0];
  const hardPreviewDate = useIntervalPreview(current, "hard");
  const normalPreviewDate = useIntervalPreview(current, "normal");
  const easyPreviewDate = useIntervalPreview(current, "easy");
  const totalInSession = reviewedCount + dueCards.length;
  const progressPercent =
    totalInSession === 0 ? 100 : Math.round((reviewedCount / totalInSession) * 100);
  const revealed = !!current && revealedCardId === current.id;

  const handleGrade = (grade: ReviewGrade) => {
    if (!current) {
      return;
    }

    const updated = reviewCard(current.id, grade);

    if (!updated) {
      return;
    }

    setReviewedCount((value) => value + 1);
    setRevealedCardId(null);
    toast.success(
      `Saved as ${grade}. Next due ${format(new Date(updated.dueDate), "PPP 'at' HH:mm")}.`,
    );
  };

  if (!hydrated) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading review session...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Deck not found</CardTitle>
            <CardDescription>
              The selected deck does not exist in local storage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/review">Back to Review</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>{deck.name}</CardTitle>
            <CardDescription>All due cards are completed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">No cards are due right now.</p>
            <Button asChild>
              <Link href="/review">Return to decks</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{deck.name}</span>
            <Badge variant="outline">
              {reviewedCount}/{totalInSession} reviewed
            </Badge>
          </CardTitle>
          <CardDescription>Review only due cards for this deck.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="h-2 w-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs">Progress: {progressPercent}%</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Front</h3>
            <div className="border p-3">
              <MarkdownViewer content={current.front} />
            </div>
          </div>

          {!revealed ? (
            <Button onClick={() => setRevealedCardId(current.id)}>Show answer</Button>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Back</h3>
                <div className="border p-3">
                  <MarkdownViewer content={current.back} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <IntervalPreviewButton
                  grade="hard"
                  previewDate={hardPreviewDate}
                  onClick={() => handleGrade("hard")}
                />
                <IntervalPreviewButton
                  grade="normal"
                  previewDate={normalPreviewDate}
                  onClick={() => handleGrade("normal")}
                />
                <IntervalPreviewButton
                  grade="easy"
                  previewDate={easyPreviewDate}
                  onClick={() => handleGrade("easy")}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
