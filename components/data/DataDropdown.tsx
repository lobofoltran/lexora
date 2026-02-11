"use client";

import { type ChangeEvent, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  buildExportPayload,
  downloadJson,
  mergeFlashcardData,
  parseImportJson,
} from "@/lib/export-import";
import { clearAnkiStorage } from "@/lib/storage";
import { useCardsStore } from "@/stores/useCardsStore";
import { useDecksStore } from "@/stores/useDecksStore";
import { useSyncStore } from "@/stores/syncStore";

export function DataDropdown() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const decks = useDecksStore((state) => state.decks);
  const cards = useCardsStore((state) => state.cards);
  const decksHydrated = useDecksStore((state) => state.hasHydrated);
  const cardsHydrated = useCardsStore((state) => state.hasHydrated);
  const replaceDecks = useDecksStore((state) => state.replaceDecks);
  const resetDecks = useDecksStore((state) => state.resetDecks);
  const replaceCards = useCardsStore((state) => state.replaceCards);
  const resetCards = useCardsStore((state) => state.resetCards);
  const setPendingChanges = useSyncStore((state) => state.setPendingChanges);
  const resetSyncState = useSyncStore((state) => state.resetSyncState);

  const hydrated = decksHydrated && cardsHydrated;

  const handleExport = () => {
    if (!hydrated) {
      return;
    }

    const payload = buildExportPayload(decks, cards);
    const stamp = format(new Date(), "yyyy-MM-dd-HH-mm");
    downloadJson(payload, `anki-backup-${stamp}.json`);
    toast.success("Backup JSON exported.");
  };

  const handleOpenImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const imported = parseImportJson(raw);
      const merged = mergeFlashcardData(buildExportPayload(decks, cards), imported);
      replaceDecks(merged.decks);
      replaceCards(merged.cards);
      setPendingChanges(true);
      toast.success("Backup JSON imported and merged.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Import failed. Please check your JSON file.";
      toast.error(message);
    } finally {
      event.target.value = "";
    }
  };

  const handleResetAll = async () => {
    resetDecks();
    resetCards();
    resetSyncState();
    await clearAnkiStorage();
    setResetOpen(false);
    toast.success("All local data has been reset.");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={!hydrated}>
            Data
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              handleExport();
            }}
          >
            Export backup JSON
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              handleOpenImport();
            }}
          >
            Import backup JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault();
              setResetOpen(true);
            }}
          >
            Reset all data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => {
          void handleImportChange(event);
        }}
      />

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all local data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all decks, cards, sync state, and review progress from
              this browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleResetAll}>
              Reset all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
