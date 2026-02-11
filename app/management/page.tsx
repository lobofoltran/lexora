"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAiDraftSessionsStore } from "@/stores/useAiDraftSessionsStore";
import { useCardsStore } from "@/stores/useCardsStore";
import { useDecksStore } from "@/stores/useDecksStore";

export default function DeckPage() {
  const decks = useDecksStore((state) => state.decks);
  const decksHydrated = useDecksStore((state) => state.hasHydrated);
  const createDeck = useDecksStore((state) => state.createDeck);
  const renameDeck = useDecksStore((state) => state.renameDeck);
  const deleteDeck = useDecksStore((state) => state.deleteDeck);

  const cards = useCardsStore((state) => state.cards);
  const cardsHydrated = useCardsStore((state) => state.hasHydrated);
  const deleteCardsByDeck = useCardsStore((state) => state.deleteCardsByDeck);
  const clearDeckSession = useAiDraftSessionsStore((state) => state.clearDeckSession);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const hydrated = decksHydrated && cardsHydrated;

  const cardCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const card of cards) {
      counts.set(card.deckId, (counts.get(card.deckId) ?? 0) + 1);
    }

    return counts;
  }, [cards]);

  const handleCreateDeck = () => {
    const name = createName.trim();

    if (!name) {
      return;
    }

    createDeck(name);
    setCreateName("");
    setCreateOpen(false);
  };

  const openRenameDialog = (deckId: string, deckName: string) => {
    setRenameTargetId(deckId);
    setRenameValue(deckName);
    setRenameOpen(true);
  };

  const handleRenameDeck = () => {
    if (!renameTargetId) {
      return;
    }

    renameDeck(renameTargetId, renameValue);
    setRenameOpen(false);
    setRenameTargetId(null);
    setRenameValue("");
  };

  const openDeleteDialog = (deckId: string) => {
    setDeleteTargetId(deckId);
    setDeleteOpen(true);
  };

  const handleDeleteDeck = () => {
    if (!deleteTargetId) {
      return;
    }

    deleteDeck(deleteTargetId);
    deleteCardsByDeck(deleteTargetId);
    clearDeckSession(deleteTargetId);
    setDeleteOpen(false);
    setDeleteTargetId(null);
  };

  if (!hydrated) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading decks...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Decks</span>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Create deck</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New deck</DialogTitle>
                  <DialogDescription>
                    Create a deck to organize flashcards.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  placeholder="Deck name"
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDeck}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>Create, rename, and delete decks.</CardDescription>
        </CardHeader>
        <CardContent>
          {decks.length === 0 ? (
            <p className="text-muted-foreground">No decks available.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Cards</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decks.map((deck) => (
                  <TableRow key={deck.id}>
                    <TableCell>{deck.name}</TableCell>
                    <TableCell>{cardCounts.get(deck.id) ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="xs" variant="outline">
                          <Link href={`/management/deck?id=${encodeURIComponent(deck.id)}`}>Open</Link>
                        </Button>
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => openRenameDialog(deck.id, deck.name)}
                        >
                          Rename
                        </Button>
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => openDeleteDialog(deck.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename deck</DialogTitle>
            <DialogDescription>Update the deck name.</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder="Deck name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameDeck}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deck?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the deck and all cards inside it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteDeck}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
