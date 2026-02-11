"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  buildExportPayload,
  downloadJson,
  mergeFlashcardData,
  parseImportJson,
} from "@/lib/export-import";
import { clearLexoraStorage } from "@/lib/storage";
import { useCardsStore } from "@/stores/useCardsStore";
import { useDecksStore } from "@/stores/useDecksStore";
import { ThemeToggle } from "./theme-toggle";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const decks = useDecksStore((state) => state.decks);
  const decksHydrated = useDecksStore((state) => state.hasHydrated);
  const replaceDecks = useDecksStore((state) => state.replaceDecks);
  const resetDecks = useDecksStore((state) => state.resetDecks);

  const cards = useCardsStore((state) => state.cards);
  const cardsHydrated = useCardsStore((state) => state.hasHydrated);
  const replaceCards = useCardsStore((state) => state.replaceCards);
  const resetCards = useCardsStore((state) => state.resetCards);

  const [resetOpen, setResetOpen] = useState(false);

  const hydrated = decksHydrated && cardsHydrated;

  const handleExport = () => {
    if (!hydrated) {
      return;
    }

    const payload = buildExportPayload(decks, cards);
    const stamp = format(new Date(), "yyyy-MM-dd-HH-mm");
    downloadJson(payload, `lexora-export-${stamp}.json`);
    toast.success("Export file downloaded.");
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
      const merged = mergeFlashcardData(
        buildExportPayload(decks, cards),
        imported,
      );

      replaceDecks(merged.decks);
      replaceCards(merged.cards);
      toast.success("Import completed and merged successfully.");
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

  const handleReset = async () => {
    resetDecks();
    resetCards();
    await clearLexoraStorage();
    setResetOpen(false);
    toast.success("All local data has been reset.");
  };

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <div className="w-40">
          <Link href="/review" className="text-lg font-semibold tracking-tight">
            Lexora
          </Link>
        </div>

        <NavigationMenu viewport={false} className="flex-1 justify-center">
          <NavigationMenuList>

            {/* REVIEW */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild active={isActive(pathname, "/review")}>
                <Link
                  href="/review"
                  className="px-4 py-2 rounded-md data-[active]:bg-primary data-[active]:text-primary-foreground mr-2 data-[active]:font-semibold"
                >
                  Review
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* MANAGEMENT */}
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                active={
                  isActive(pathname, "/management") ||
                  isActive(pathname, "/management/deck")
                }
              >
                <Link
                  href="/management"
                  className="px-4 py-2 rounded-md data-[active]:bg-primary data-[active]:text-primary-foreground data-[active]:font-semibold"
                >
                  Decks
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex w-40 justify-end gap-2">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!hydrated}>
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  handleExport();
                }}
              >
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  handleOpenImport();
                }}
              >
                Import JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  setResetOpen(true);
                }}
              >
                Reset data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportChange}
          />
        </div>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all local data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all decks, cards, and review progress from this
              browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleReset}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
