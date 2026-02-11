"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

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
import { FlashToast } from "@/components/ui/flash-toast";
import { useCardsStore } from "@/stores/useCardsStore";
import { useTopicsStore } from "@/stores/useTopicsStore";
import { IntervalPreviewButton } from "./IntervalPreviewButton";
import { useIntervalPreview } from "./useIntervalPreview";

interface TopicReviewClientProps {
  topicId: string;
}

export function TopicReviewClient({ topicId }: TopicReviewClientProps) {
  const topics = useTopicsStore((state) => state.topics);
  const topicsHydrated = useTopicsStore((state) => state.hasHydrated);

  const cards = useCardsStore((state) => state.cards);
  const cardsHydrated = useCardsStore((state) => state.hasHydrated);
  const reviewCard = useCardsStore((state) => state.reviewCard);

  const currentTime = useMemo(() => Date.parse(new Date().toISOString()), []);
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const hydrated = topicsHydrated && cardsHydrated;
  const topic = topics.find((item) => item.id === topicId);

  const dueCards = useMemo(() => {
    return cards
      .filter(
        (card) => card.topicId === topicId && Date.parse(card.dueDate) <= currentTime,
      )
      .sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate));
  }, [cards, currentTime, topicId]);

  const current = dueCards[0];
  const hardPreviewDate = useIntervalPreview(current, "hard");
  const normalPreviewDate = useIntervalPreview(current, "normal");
  const easyPreviewDate = useIntervalPreview(current, "easy");
  const totalInSession = reviewedCount + dueCards.length;
  const progressPercent =
    totalInSession === 0 ? 100 : Math.round((reviewedCount / totalInSession) * 100);
  const revealed = !!current && revealedCardId === current.id;

  useEffect(() => {
    if (!toastOpen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToastOpen(false);
    }, 5_000);

    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

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
    setToastMessage(
      `Saved as ${grade}. Next due ${format(new Date(updated.dueDate), "PPP 'at' HH:mm")}.`,
    );
    setToastOpen(true);
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

  if (!topic) {
    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Topic not found</CardTitle>
            <CardDescription>
              The selected topic does not exist in local storage.
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
            <CardTitle>{topic.name}</CardTitle>
            <CardDescription>All due cards are completed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">No cards are due right now.</p>
            <Button asChild>
              <Link href="/review">Return to topics</Link>
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
            <span>{topic.name}</span>
            <Badge variant="outline">
              {reviewedCount}/{totalInSession} reviewed
            </Badge>
          </CardTitle>
          <CardDescription>Review only due cards for this topic.</CardDescription>
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

      <FlashToast
        open={toastOpen}
        message={toastMessage}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
