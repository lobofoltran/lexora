"use client";

import { useCallback, useMemo, useState } from "react";

import type { FlashcardData } from "@/lib/export-import";
import {
  autoSync as driveAutoSync,
  forceDownloadFromDrive as driveForceDownloadFromDrive,
  forceUploadToDrive as driveForceUploadToDrive,
  hasActiveGoogleSession,
  onReviewFinished as driveOnReviewFinished,
  signIn as driveSignIn,
  signOut as driveSignOut,
  syncNow as driveSyncNow,
} from "@/lib/googleDriveSync";
import { useCardsStore } from "@/stores/useCardsStore";
import { useDecksStore } from "@/stores/useDecksStore";
import { useSyncStore } from "@/stores/syncStore";
import type {
  AutoSyncResult,
  DriveSyncError,
  DriveSyncResult,
  DriveUploadResult,
  SyncNowResult,
} from "@/types/google-drive-sync";

interface UseDriveSyncValue {
  isReady: boolean;
  isAuthenticated: boolean;
  status: "idle" | "syncing" | "success" | "error";
  pendingChanges: boolean;
  remoteFileId?: string;
  lastSyncAt?: string;
  isBusy: boolean;
  lastError: DriveSyncError | null;
  signIn: () => Promise<DriveSyncResult<void>>;
  signOut: () => Promise<DriveSyncResult<void>>;
  syncNow: () => Promise<DriveSyncResult<SyncNowResult>>;
  forceDownloadFromDrive: () => Promise<DriveSyncResult<FlashcardData>>;
  forceUploadToDrive: () => Promise<DriveSyncResult<DriveUploadResult>>;
  autoSync: (trigger: "mutation" | "review" | "startup") => Promise<DriveSyncResult<AutoSyncResult>>;
  onReviewFinished: () => Promise<DriveSyncResult<AutoSyncResult>>;
}

export function useDriveSync(): UseDriveSyncValue {
  const decksHydrated = useDecksStore((state) => state.hasHydrated);
  const cardsHydrated = useCardsStore((state) => state.hasHydrated);
  const syncHydrated = useSyncStore((state) => state.hasHydrated);
  const isAuthenticated = useSyncStore((state) => state.isAuthenticated);
  const status = useSyncStore((state) => state.lastSyncStatus);
  const pendingChanges = useSyncStore((state) => state.pendingChanges);
  const remoteFileId = useSyncStore((state) => state.remoteFileId);
  const lastSyncAt = useSyncStore((state) => state.lastSyncAt);

  const [lastError, setLastError] = useState<DriveSyncError | null>(null);

  const isReady = decksHydrated && cardsHydrated && syncHydrated;
  const isBusy = status === "syncing";

  const wrap = useCallback(
    async <T,>(run: () => Promise<DriveSyncResult<T>>): Promise<DriveSyncResult<T>> => {
      const result = await run();

      if (result.ok) {
        setLastError(null);
      } else {
        setLastError(result.error);
      }

      return result;
    },
    [],
  );

  const signIn = useCallback(() => wrap(driveSignIn), [wrap]);
  const signOut = useCallback(() => wrap(driveSignOut), [wrap]);
  const syncNow = useCallback(() => wrap(driveSyncNow), [wrap]);
  const forceDownloadFromDrive = useCallback(
    () => wrap(driveForceDownloadFromDrive),
    [wrap],
  );
  const forceUploadToDrive = useCallback(
    () => wrap(driveForceUploadToDrive),
    [wrap],
  );
  const autoSync = useCallback(
    (trigger: "mutation" | "review" | "startup") =>
      wrap(() => driveAutoSync(trigger)),
    [wrap],
  );
  const onReviewFinished = useCallback(
    () => wrap(driveOnReviewFinished),
    [wrap],
  );

  return useMemo(
    () => ({
      isReady,
      isAuthenticated: isAuthenticated || hasActiveGoogleSession(),
      status,
      pendingChanges,
      remoteFileId,
      lastSyncAt,
      isBusy,
      lastError,
      signIn,
      signOut,
      syncNow,
      forceDownloadFromDrive,
      forceUploadToDrive,
      autoSync,
      onReviewFinished,
    }),
    [
      isReady,
      isAuthenticated,
      status,
      pendingChanges,
      remoteFileId,
      lastSyncAt,
      isBusy,
      lastError,
      signIn,
      signOut,
      syncNow,
      forceDownloadFromDrive,
      forceUploadToDrive,
      autoSync,
      onReviewFinished,
    ],
  );
}
