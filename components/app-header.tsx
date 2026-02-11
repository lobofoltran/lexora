"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { format } from "date-fns";

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
import { FlashToast } from "@/components/ui/flash-toast";
import { clearLexoraStorage } from "@/lib/storage";
import { useCardsStore } from "@/stores/useCardsStore";
import { useTopicsStore } from "@/stores/useTopicsStore";
import { ThemeToggle } from "./theme-toggle";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const topics = useTopicsStore((state) => state.topics);
  const topicsHydrated = useTopicsStore((state) => state.hasHydrated);
  const replaceTopics = useTopicsStore((state) => state.replaceTopics);
  const resetTopics = useTopicsStore((state) => state.resetTopics);

  const cards = useCardsStore((state) => state.cards);
  const cardsHydrated = useCardsStore((state) => state.hasHydrated);
  const replaceCards = useCardsStore((state) => state.replaceCards);
  const resetCards = useCardsStore((state) => state.resetCards);

  const [resetOpen, setResetOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const hydrated = topicsHydrated && cardsHydrated;

  useEffect(() => {
    if (!toastOpen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToastOpen(false);
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const handleExport = () => {
    if (!hydrated) {
      return;
    }

    const payload = buildExportPayload(topics, cards);
    const stamp = format(new Date(), "yyyy-MM-dd-HH-mm");
    downloadJson(payload, `lexora-export-${stamp}.json`);
    setToastMessage("Export file downloaded.");
    setToastOpen(true);
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
        buildExportPayload(topics, cards),
        imported,
      );

      replaceTopics(merged.topics);
      replaceCards(merged.cards);
      setToastMessage("Import completed and merged successfully.");
      setToastOpen(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Import failed. Please check your JSON file.";
      setToastMessage(message);
      setToastOpen(true);
    } finally {
      event.target.value = "";
    }
  };

  const handleReset = async () => {
    resetTopics();
    resetCards();
    await clearLexoraStorage();
    setResetOpen(false);
    setToastMessage("All local data has been reset.");
    setToastOpen(true);
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
                  isActive(pathname, "/topic")
                }
              >
                <Link
                  href="/management"
                  className="px-4 py-2 rounded-md data-[active]:bg-primary data-[active]:text-primary-foreground data-[active]:font-semibold"
                >
                  Card Management
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
              This will remove all topics, cards, and review progress from this
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

      <FlashToast
        open={toastOpen}
        message={toastMessage}
        onClose={() => setToastOpen(false)}
      />
    </header>
  );
}
