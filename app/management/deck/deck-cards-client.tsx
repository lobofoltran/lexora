"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AIServiceError,
  aiFlashcardsSchema,
  generateFlashcards,
} from "@/services/ai.service";
import { useCardsStore } from "@/stores/useCardsStore";
import { useDecksStore } from "@/stores/useDecksStore";

import { DraftTable } from "./_components/draft-table";
import { DraftToolbar } from "./_components/draft-toolbar";
import { EditorModal } from "./_components/editor-modal";
import type { AIDraftCard, AIDraftStyle, DensityMode } from "./_components/draft-types";

interface DeckCardsClientProps {
  deckId: string;
}

interface BulkCardInput {
  front: string;
  back: string;
}

function previewMarkdown(content: string): string {
  const compact = content.replace(/\s+/g, " ").trim();

  if (!compact) {
    return "-";
  }

  if (compact.length <= 70) {
    return compact;
  }

  return `${compact.slice(0, 70)}...`;
}

function parseBulkCards(raw: string): BulkCardInput[] {
  const cards = raw
    .split("\n\n---\n\n")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const parsed: BulkCardInput[] = [];

  for (const entry of cards) {
    const [front, back] = entry.split("\n\n===\n\n");

    if (!front || !back) {
      continue;
    }

    const trimmedFront = front.trim();
    const trimmedBack = back.trim();

    if (!trimmedFront || !trimmedBack) {
      continue;
    }

    parsed.push({ front: trimmedFront, back: trimmedBack });
  }

  return parsed;
}

function parseWordsByLine(raw: string): string[] {
  return raw
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function downloadJson(payload: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function toFileSafeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function DeckCardsClient({ deckId }: DeckCardsClientProps) {
  const decks = useDecksStore((state) => state.decks);
  const decksHydrated = useDecksStore((state) => state.hasHydrated);

  const cards = useCardsStore((state) => state.cards);
  const cardsHydrated = useCardsStore((state) => state.hasHydrated);
  const createCard = useCardsStore((state) => state.createCard);
  const updateCard = useCardsStore((state) => state.updateCard);
  const deleteCard = useCardsStore((state) => state.deleteCard);

  const [bulkRaw, setBulkRaw] = useState("");
  const [bulkResult, setBulkResult] = useState("");

  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiWordsRaw, setAiWordsRaw] = useState("");
  const [aiStyle, setAiStyle] = useState<AIDraftStyle>("Vocabulary");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<AIDraftCard[]>([]);

  const [draftDensity, setDraftDensity] = useState<DensityMode>("comfortable");
  const [approveAllOpen, setApproveAllOpen] = useState(false);

  const [cardEditorOpen, setCardEditorOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardFrontValue, setCardFrontValue] = useState("");
  const [cardBackValue, setCardBackValue] = useState("");
  const [cardBaselineFront, setCardBaselineFront] = useState("");
  const [cardBaselineBack, setCardBaselineBack] = useState("");

  const [draftEditorOpen, setDraftEditorOpen] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [draftFrontValue, setDraftFrontValue] = useState("");
  const [draftBackValue, setDraftBackValue] = useState("");
  const [draftBaselineFront, setDraftBaselineFront] = useState("");
  const [draftBaselineBack, setDraftBaselineBack] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const hydrated = decksHydrated && cardsHydrated;
  const deck = decks.find((entry) => entry.id === deckId);

  const deckCards = useMemo(
    () =>
      cards
        .filter((card) => card.deckId === deckId)
        .sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate)),
    [cards, deckId],
  );

  const orderedDrafts = useMemo(
    () =>
      [...aiDrafts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [aiDrafts],
  );

  const cardDirty =
    cardFrontValue !== cardBaselineFront || cardBackValue !== cardBaselineBack;
  const draftDirty =
    draftFrontValue !== draftBaselineFront || draftBackValue !== draftBaselineBack;

  const closeCardEditor = () => {
    setCardEditorOpen(false);
  };

  const openCreateEditor = () => {
    setEditingCardId(null);
    setCardFrontValue("");
    setCardBackValue("");
    setCardBaselineFront("");
    setCardBaselineBack("");
    setCardEditorOpen(true);
  };

  const openEditEditor = (cardId: string) => {
    const card = deckCards.find((entry) => entry.id === cardId);

    if (!card) {
      return;
    }

    setEditingCardId(card.id);
    setCardFrontValue(card.front);
    setCardBackValue(card.back);
    setCardBaselineFront(card.front);
    setCardBaselineBack(card.back);
    setCardEditorOpen(true);
  };

  const handleSaveCard = () => {
    const front = cardFrontValue.trim();
    const back = cardBackValue.trim();

    if (!front || !back) {
      toast.warning("Card front and back are required.");
      return;
    }

    if (editingCardId) {
      updateCard({ id: editingCardId, front, back });
      toast.success("Card updated.");
    } else {
      createCard({ deckId, front, back });
      toast.success("Card created.");
    }

    closeCardEditor();
  };

  const openDeleteDialog = (cardId: string) => {
    setDeleteTargetId(cardId);
    setDeleteOpen(true);
  };

  const handleDeleteCard = () => {
    if (!deleteTargetId) {
      return;
    }

    deleteCard(deleteTargetId);
    setDeleteTargetId(null);
    setDeleteOpen(false);
  };

  const handleBulkCreate = () => {
    const entries = parseBulkCards(bulkRaw);

    if (entries.length === 0) {
      setBulkResult("No valid cards found. Use the documented separators.");
      return;
    }

    for (const entry of entries) {
      createCard({
        deckId,
        front: entry.front,
        back: entry.back,
      });
    }

    setBulkRaw("");
    setBulkResult(`Created ${entries.length} cards.`);
  };

  const handleGenerateWithAI = async () => {
    const words = parseWordsByLine(aiWordsRaw);

    if (words.length === 0) {
      toast.warning("Please add at least one word (one per line).");
      return;
    }

    setAiLoading(true);

    try {
      const generated = await generateFlashcards(words, aiStyle);

      if (generated.length === 0) {
        toast.error("Gemini returned an empty response.");
        return;
      }

      const validation = aiFlashcardsSchema.safeParse(generated);

      if (!validation.success) {
        toast.error("Invalid AI response schema. Drafts were not saved.");
        return;
      }

      const now = new Date().toISOString();
      const nextDrafts: AIDraftCard[] = validation.data.map((card) => ({
        id: crypto.randomUUID(),
        front: card.front.trim(),
        back: card.back.trim(),
        createdAt: now,
        style: aiStyle,
      }));

      setAiDrafts((current) => [...nextDrafts, ...current]);
      setAiDialogOpen(false);
      setAiWordsRaw("");
      toast.success(`Generated ${nextDrafts.length} draft cards.`);
    } catch (error) {
      if (error instanceof AIServiceError) {
        if (error.code === "missing_api_key") {
          toast.error("Missing NEXT_PUBLIC_GEMINI_API_KEY in .env.local.");
          return;
        }

        if (error.code === "empty_response") {
          toast.error("Gemini returned an empty response.");
          return;
        }

        if (error.code === "invalid_json") {
          toast.error("Gemini returned invalid JSON.");
          return;
        }

        if (error.code === "quota_exceeded") {
          toast.error("Gemini quota exceeded. Try again later.");
          return;
        }

        if (error.code === "invalid_output") {
          toast.error("Gemini output is invalid. Drafts were not saved.");
          return;
        }

        toast.error(error.message);
        return;
      }

      toast.error("AI generation failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const closeDraftEditor = () => {
    setDraftEditorOpen(false);
    setEditingDraftId(null);
  };

  const openDraftEditor = (draftId: string) => {
    const draft = aiDrafts.find((entry) => entry.id === draftId);

    if (!draft) {
      return;
    }

    setEditingDraftId(draft.id);
    setDraftFrontValue(draft.front);
    setDraftBackValue(draft.back);
    setDraftBaselineFront(draft.front);
    setDraftBaselineBack(draft.back);
    setDraftEditorOpen(true);
  };

  const handleDraftFrontChange = (value: string) => {
    setDraftFrontValue(value);

    if (!editingDraftId) {
      return;
    }

    setAiDrafts((current) =>
      current.map((draft) =>
        draft.id === editingDraftId ? { ...draft, front: value } : draft,
      ),
    );
  };

  const handleDraftBackChange = (value: string) => {
    setDraftBackValue(value);

    if (!editingDraftId) {
      return;
    }

    setAiDrafts((current) =>
      current.map((draft) =>
        draft.id === editingDraftId ? { ...draft, back: value } : draft,
      ),
    );
  };

  const saveDraftEditor = () => {
    if (!editingDraftId) {
      return;
    }

    const front = draftFrontValue.trim();
    const back = draftBackValue.trim();

    if (!front || !back) {
      toast.warning("Draft front and back cannot be empty.");
      return;
    }

    setAiDrafts((current) =>
      current.map((draft) =>
        draft.id === editingDraftId ? { ...draft, front, back } : draft,
      ),
    );
    setDraftFrontValue(front);
    setDraftBackValue(back);
    setDraftBaselineFront(front);
    setDraftBaselineBack(back);
    toast("Draft saved.");
  };

  const discardDraft = (draftId: string) => {
    setAiDrafts((current) => current.filter((draft) => draft.id !== draftId));

    if (editingDraftId === draftId) {
      closeDraftEditor();
    }
  };

  const approveDraft = (draftId: string) => {
    const draft = aiDrafts.find((entry) => entry.id === draftId);

    if (!draft) {
      return;
    }

    createCard({
      deckId,
      front: draft.front.trim(),
      back: draft.back.trim(),
    });
    discardDraft(draftId);
    toast.success("Draft approved and card created.");
  };

  const approveDraftFromEditor = () => {
    if (!editingDraftId) {
      return;
    }

    const front = draftFrontValue.trim();
    const back = draftBackValue.trim();

    if (!front || !back) {
      toast.warning("Draft front and back cannot be empty.");
      return;
    }

    createCard({ deckId, front, back });
    setAiDrafts((current) => current.filter((draft) => draft.id !== editingDraftId));
    closeDraftEditor();
    toast.success("Draft approved and card created.");
  };

  const openApproveAllDialog = () => {
    if (aiDrafts.length === 0) {
      return;
    }

    setApproveAllOpen(true);
  };

  const confirmApproveAll = () => {
    if (aiDrafts.length === 0) {
      setApproveAllOpen(false);
      return;
    }

    for (const draft of aiDrafts) {
      createCard({
        deckId,
        front: draft.front.trim(),
        back: draft.back.trim(),
      });
    }

    const count = aiDrafts.length;
    setAiDrafts([]);
    setApproveAllOpen(false);
    closeDraftEditor();
    toast.success(`Approved ${count} drafts.`);
  };

  const discardAllDrafts = () => {
    if (aiDrafts.length === 0) {
      return;
    }

    setAiDrafts([]);
    closeDraftEditor();
    toast("Discarded all drafts.");
  };

  const exportDrafts = () => {
    if (!deck || aiDrafts.length === 0) {
      return;
    }

    const payload = aiDrafts.map((draft) => ({
      front: draft.front,
      back: draft.back,
      style: draft.style,
      status: "Draft",
      createdAt: draft.createdAt,
    }));

    const stamp = format(new Date(), "yyyy-MM-dd-HH-mm");
    const safeDeckName = toFileSafeName(deck.name) || "deck";
    downloadJson(payload, `lexora-ai-drafts-${safeDeckName}-${stamp}.json`);
    toast.success("Drafts exported as JSON.");
  };

  if (!hydrated) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading deck...</CardTitle>
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
              The requested deck does not exist in local storage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/management">Back to management</Link>
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
          <CardTitle className="flex flex-wrap items-center justify-between gap-2">
            <span>{deck.name}</span>
            <Button size="sm" variant="outline" onClick={() => setAiDialogOpen(true)}>
              Generate with AI
            </Button>
          </CardTitle>
          <CardDescription>
            Manage cards, generate AI drafts, and bulk-create manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cards">
            <TabsList>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="bulk">Bulk manual create</TabsTrigger>
            </TabsList>

            <TabsContent value="cards" className="space-y-3">
              {orderedDrafts.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Draft Queue</CardTitle>
                    <CardDescription>
                      Edit, batch approve, or discard drafts before card creation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <DraftToolbar
                      count={orderedDrafts.length}
                      density={draftDensity}
                      onDensityChange={setDraftDensity}
                      onApproveAll={openApproveAllDialog}
                      onDiscardAll={discardAllDrafts}
                      onExportJson={exportDrafts}
                    />

                    <DraftTable
                      drafts={orderedDrafts}
                      density={draftDensity}
                      onEditDraft={openDraftEditor}
                      onApproveDraft={approveDraft}
                      onDiscardDraft={discardDraft}
                    />
                  </CardContent>
                </Card>
              ) : null}

              <div className="flex justify-end">
                <Button size="sm" onClick={openCreateEditor}>
                  New card
                </Button>
              </div>

              {deckCards.length === 0 ? (
                <p className="text-muted-foreground">No cards in this deck yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Front preview</TableHead>
                      <TableHead>Back preview</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead>Edit</TableHead>
                      <TableHead>Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deckCards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell>{previewMarkdown(card.front)}</TableCell>
                        <TableCell>{previewMarkdown(card.back)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Approved</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(card.dueDate), "PPP 'at' HH:mm")}</TableCell>
                        <TableCell>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => openEditEditor(card.id)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => openDeleteDialog(card.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="bulk" className="space-y-3">
              <div className="space-y-1">
                <Label>Bulk format</Label>
                <p className="text-muted-foreground text-xs">
                  Each card: front, then separator <code>===</code>, then back.
                  Separate cards with <code>---</code> on its own block.
                </p>
              </div>
              <Textarea
                value={bulkRaw}
                onChange={(event) => setBulkRaw(event.target.value)}
                rows={16}
                placeholder={[
                  "Front markdown for card 1",
                  "",
                  "===",
                  "",
                  "Back markdown for card 1",
                  "",
                  "---",
                  "",
                  "Front markdown for card 2",
                  "",
                  "===",
                  "",
                  "Back markdown for card 2",
                ].join("\n")}
              />
              <div className="flex items-center gap-3">
                <Button onClick={handleBulkCreate}>Create cards</Button>
                {bulkResult ? (
                  <span className="text-muted-foreground text-xs">{bulkResult}</span>
                ) : null}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate with AI</DialogTitle>
            <DialogDescription>
              Paste one word/term per line and choose a style.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="ai-words">Words (one per line)</Label>
              <Textarea
                id="ai-words"
                rows={10}
                value={aiWordsRaw}
                onChange={(event) => setAiWordsRaw(event.target.value)}
                placeholder={["abandon", "carry on", "garbage collector"].join("\n")}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ai-style">Style</Label>
              <Select
                value={aiStyle}
                onValueChange={(value) => setAiStyle(value as AIDraftStyle)}
              >
                <SelectTrigger id="ai-style" className="w-full">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vocabulary">Vocabulary</SelectItem>
                  <SelectItem value="Phrasal verbs">Phrasal verbs</SelectItem>
                  <SelectItem value="Tech terms">Tech terms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateWithAI} disabled={aiLoading}>
              {aiLoading ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditorModal
        open={cardEditorOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCardEditor();
          }
        }}
        title={editingCardId ? "Edit card" : "New card"}
        status="Editing"
        front={cardFrontValue}
        back={cardBackValue}
        dirty={cardDirty}
        saveLabel="Save card"
        onFrontChange={setCardFrontValue}
        onBackChange={setCardBackValue}
        onSave={handleSaveCard}
        onCancel={closeCardEditor}
      />

      <EditorModal
        open={draftEditorOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDraftEditor();
          }
        }}
        title="Edit draft"
        status="Draft"
        front={draftFrontValue}
        back={draftBackValue}
        dirty={draftDirty}
        saveLabel="Save draft"
        approveLabel="Approve & create card"
        onFrontChange={handleDraftFrontChange}
        onBackChange={handleDraftBackChange}
        onSave={saveDraftEditor}
        onApprove={approveDraftFromEditor}
        onCancel={closeDraftEditor}
      />

      <AlertDialog open={approveAllOpen} onOpenChange={setApproveAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve all drafts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create {aiDrafts.length} cards in this deck.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApproveAll}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete card?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected card.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteCard}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
