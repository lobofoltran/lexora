"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { DataDropdown } from "@/components/data/DataDropdown";
import { SyncDropdown } from "@/components/sync/SyncDropdown";
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
import { ThemeToggle } from "./theme-toggle";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
        <div className="min-w-0 flex-1 md:w-40 md:flex-none">
          <Link href="/review" className="text-lg font-semibold tracking-tight">
            Anki
          </Link>
        </div>

        <NavigationMenu viewport={false} className="hidden flex-1 justify-center md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild active={isActive(pathname, "/review")}>
                <Link
                  href="/review"
                  className="mr-2 rounded-md px-4 py-2 data-[active]:bg-primary data-[active]:font-semibold data-[active]:text-primary-foreground"
                >
                  Review
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

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
                  className="rounded-md px-4 py-2 data-[active]:bg-primary data-[active]:font-semibold data-[active]:text-primary-foreground"
                >
                  Decks
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="md:hidden"
                aria-label="Menu"
              >
                <Menu />
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 md:hidden">
              <DropdownMenuItem asChild>
                <Link href="/review">Review</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/management">Decks</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
          <DataDropdown />
          <SyncDropdown />
        </div>
      </div>
    </header>
  );
}
