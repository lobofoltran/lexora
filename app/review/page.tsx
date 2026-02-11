"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCardsStore } from "@/stores/useCardsStore";
import { useDecksStore } from "@/stores/useDecksStore";

export default function ReviewDecksPage() {
  const decks = useDecksStore((state) => state.decks);
  const decksHydrated = useDecksStore((state) => state.hasHydrated);

  const cards = useCardsStore((state) => state.cards);
  const cardsHydrated = useCardsStore((state) => state.hasHydrated);

  const currentTime = useMemo(() => Date.parse(new Date().toISOString()), []);

  const hydrated = decksHydrated && cardsHydrated;

  const { cardsByDeck, dueByDeck } = useMemo(() => {
    const totals = new Map<string, number>();
    const due = new Map<string, number>();

    for (const card of cards) {
      totals.set(card.deckId, (totals.get(card.deckId) ?? 0) + 1);

      if (Date.parse(card.dueDate) <= currentTime) {
        due.set(card.deckId, (due.get(card.deckId) ?? 0) + 1);
      }
    }

    return { cardsByDeck: totals, dueByDeck: due };
  }, [cards, currentTime]);

  if (!hydrated) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading review decks...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Review</CardTitle>
          <CardDescription>
            Choose a deck and start today&apos;s due cards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {decks.length === 0 ? (
            <div className="space-y-3">
              <p className="text-muted-foreground">
                No decks yet. Create your first deck in management.
              </p>
              <Button asChild>
                <Link href="/management">Open Management</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Total cards</TableHead>
                  <TableHead>Due now</TableHead>
                  <TableHead>Start Review</TableHead>
                  <TableHead>Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decks.map((deck) => {
                  const totalCards = cardsByDeck.get(deck.id) ?? 0;
                  const dueNow = dueByDeck.get(deck.id) ?? 0;

                  return (
                    <TableRow key={deck.id}>
                      <TableCell>{deck.name}</TableCell>
                      <TableCell>{totalCards}</TableCell>
                      <TableCell>
                        <Badge variant={dueNow > 0 ? "default" : "outline"}>
                          {dueNow}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" disabled={dueNow === 0}>
                          <Link href={`/review/deck?deckId=${encodeURIComponent(deck.id)}`}>
                            Start Review
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/management/deck?id=${encodeURIComponent(deck.id)}`}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
