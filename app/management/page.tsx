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
import { useCardsStore } from "@/stores/useCardsStore";
import { useTopicsStore } from "@/stores/useTopicsStore";

export default function ManagementPage() {
  const topics = useTopicsStore((state) => state.topics);
  const topicsHydrated = useTopicsStore((state) => state.hasHydrated);
  const createTopic = useTopicsStore((state) => state.createTopic);
  const renameTopic = useTopicsStore((state) => state.renameTopic);
  const deleteTopic = useTopicsStore((state) => state.deleteTopic);

  const cards = useCardsStore((state) => state.cards);
  const cardsHydrated = useCardsStore((state) => state.hasHydrated);
  const deleteCardsByTopic = useCardsStore((state) => state.deleteCardsByTopic);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const hydrated = topicsHydrated && cardsHydrated;

  const cardCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const card of cards) {
      counts.set(card.topicId, (counts.get(card.topicId) ?? 0) + 1);
    }

    return counts;
  }, [cards]);

  const handleCreateTopic = () => {
    const name = createName.trim();

    if (!name) {
      return;
    }

    createTopic(name);
    setCreateName("");
    setCreateOpen(false);
  };

  const openRenameDialog = (topicId: string, topicName: string) => {
    setRenameTargetId(topicId);
    setRenameValue(topicName);
    setRenameOpen(true);
  };

  const handleRenameTopic = () => {
    if (!renameTargetId) {
      return;
    }

    renameTopic(renameTargetId, renameValue);
    setRenameOpen(false);
    setRenameTargetId(null);
    setRenameValue("");
  };

  const openDeleteDialog = (topicId: string) => {
    setDeleteTargetId(topicId);
    setDeleteOpen(true);
  };

  const handleDeleteTopic = () => {
    if (!deleteTargetId) {
      return;
    }

    deleteTopic(deleteTargetId);
    deleteCardsByTopic(deleteTargetId);
    setDeleteOpen(false);
    setDeleteTargetId(null);
  };

  if (!hydrated) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading topics...</CardTitle>
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
            <span>Topic Management</span>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Create topic</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New topic</DialogTitle>
                  <DialogDescription>
                    Create a topic to organize flashcards.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  placeholder="Topic name"
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTopic}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>Create, rename, and delete topics.</CardDescription>
        </CardHeader>
        <CardContent>
          {topics.length === 0 ? (
            <p className="text-muted-foreground">No topics available.</p>
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
                {topics.map((topic) => (
                  <TableRow key={topic.id}>
                    <TableCell>{topic.name}</TableCell>
                    <TableCell>{cardCounts.get(topic.id) ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="xs" variant="outline">
                          <Link href={`/topic?id=${encodeURIComponent(topic.id)}`}>Open</Link>
                        </Button>
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => openRenameDialog(topic.id, topic.name)}
                        >
                          Rename
                        </Button>
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => openDeleteDialog(topic.id)}
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
            <DialogTitle>Rename topic</DialogTitle>
            <DialogDescription>Update the topic name.</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder="Topic name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameTopic}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete topic?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the topic and all cards inside it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteTopic}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
