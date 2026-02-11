"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDriveSync } from "@/hooks/useDriveSync";
import type { DriveSyncError } from "@/types/google-drive-sync";

type SyncBadgeStatus = "idle" | "syncing" | "success" | "error" | "pending";

function getSyncErrorMessage(error: DriveSyncError): string {
  switch (error.code) {
    case "AUTH_CONFIG_MISSING":
      return "Google client ID is missing. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID.";
    case "MISSING_FILE":
      return "Drive sync file not found.";
    case "CORRUPTED_JSON":
      return "Drive sync file contains invalid JSON.";
    case "STORE_NOT_READY":
      return "Local data is still loading.";
    case "OFFLINE":
      return "You are offline. Sync queued for reconnect.";
    default:
      return error.message;
  }
}

function resolveSyncBadgeStatus(
  status: "idle" | "syncing" | "success" | "error",
  pendingChanges: boolean,
): SyncBadgeStatus {
  if (status === "syncing") {
    return "syncing";
  }

  if (pendingChanges) {
    return "pending";
  }

  return status;
}

function getSyncBadgeStyle(status: SyncBadgeStatus): { label: string; className: string } {
  switch (status) {
    case "idle":
      return {
        label: "Idle",
        className: "bg-muted text-muted-foreground border-transparent",
      };
    case "syncing":
      return {
        label: "Syncing",
        className: "bg-blue-100 text-blue-700 border-transparent dark:bg-blue-900/30 dark:text-blue-300",
      };
    case "success":
      return {
        label: "Success",
        className: "bg-green-100 text-green-700 border-transparent dark:bg-green-900/30 dark:text-green-300",
      };
    case "error":
      return {
        label: "Error",
        className: "bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-300",
      };
    case "pending":
      return {
        label: "Pending",
        className: "bg-amber-100 text-amber-700 border-transparent dark:bg-amber-900/30 dark:text-amber-300",
      };
  }
}

export function SyncDropdown() {
  const {
    isReady,
    isAuthenticated,
    status,
    pendingChanges,
    lastSyncAt,
    isBusy,
    signIn,
    signOut,
    syncNow,
    forceDownloadFromDrive,
    forceUploadToDrive,
  } = useDriveSync();

  const badge = useMemo(() => {
    const visualStatus = resolveSyncBadgeStatus(status, pendingChanges);
    return getSyncBadgeStyle(visualStatus);
  }, [pendingChanges, status]);

  const handleSignInOut = async () => {
    const result = isAuthenticated ? await signOut() : await signIn();

    if (result.ok) {
      toast.success(isAuthenticated ? "Google account disconnected." : "Google account connected.");
      return;
    }

    toast.error(getSyncErrorMessage(result.error));
  };

  const handleSyncNow = async () => {
    const result = await syncNow();

    if (result.ok) {
      toast.success("Drive sync completed.");
      return;
    }

    toast.error(getSyncErrorMessage(result.error));
  };

  const handleForceDownload = async () => {
    const result = await forceDownloadFromDrive();

    if (result.ok) {
      toast.success("Drive data downloaded and merged.");
      return;
    }

    toast.error(getSyncErrorMessage(result.error));
  };

  const handleForceUpload = async () => {
    const result = await forceUploadToDrive();

    if (result.ok) {
      toast.success("Local data uploaded to Drive.");
      return;
    }

    toast.error(getSyncErrorMessage(result.error));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={!isReady || isBusy}>
          <RefreshCw className={isBusy ? "animate-spin" : ""} />
          Sync
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleSignInOut();
          }}
          disabled={!isReady || isBusy}
        >
          {isAuthenticated ? "Sign out" : "Sign in with Google"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleSyncNow();
          }}
          disabled={!isReady || isBusy}
        >
          Sync now
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleForceDownload();
          }}
          disabled={!isReady || isBusy}
        >
          Force download from Drive
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleForceUpload();
          }}
          disabled={!isReady || isBusy}
        >
          Force upload to Drive
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="space-y-2 px-2 py-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs">Last sync</span>
            <span className="text-xs">
              {lastSyncAt ? format(new Date(lastSyncAt), "PPp") : "Never"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs">Status</span>
            <Badge variant="outline" className={badge.className}>
              {badge.label}
            </Badge>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
