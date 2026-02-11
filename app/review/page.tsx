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
import { useTopicsStore } from "@/stores/useTopicsStore";

export default function ReviewTopicsPage() {
  const topics = useTopicsStore((state) => state.topics);
  const topicsHydrated = useTopicsStore((state) => state.hasHydrated);

  const cards = useCardsStore((state) => state.cards);
  const cardsHydrated = useCardsStore((state) => state.hasHydrated);

  const currentTime = useMemo(() => Date.parse(new Date().toISOString()), []);

  const hydrated = topicsHydrated && cardsHydrated;

  const { cardsByTopic, dueByTopic } = useMemo(() => {
    const totals = new Map<string, number>();
    const due = new Map<string, number>();

    for (const card of cards) {
      totals.set(card.topicId, (totals.get(card.topicId) ?? 0) + 1);

      if (Date.parse(card.dueDate) <= currentTime) {
        due.set(card.topicId, (due.get(card.topicId) ?? 0) + 1);
      }
    }

    return { cardsByTopic: totals, dueByTopic: due };
  }, [cards, currentTime]);

  if (!hydrated) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading review topics...</CardTitle>
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
            Choose a topic and start today&apos;s due cards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topics.length === 0 ? (
            <div className="space-y-3">
              <p className="text-muted-foreground">
                No topics yet. Create your first topic in management.
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
                {topics.map((topic) => {
                  const totalCards = cardsByTopic.get(topic.id) ?? 0;
                  const dueNow = dueByTopic.get(topic.id) ?? 0;

                  return (
                    <TableRow key={topic.id}>
                      <TableCell>{topic.name}</TableCell>
                      <TableCell>{totalCards}</TableCell>
                      <TableCell>
                        <Badge variant={dueNow > 0 ? "default" : "outline"}>
                          {dueNow}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" disabled={dueNow === 0}>
                          <Link href={`/review/topic?topicId=${encodeURIComponent(topic.id)}`}>
                            Start Review
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/topic?id=${encodeURIComponent(topic.id)}`}>Open</Link>
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
