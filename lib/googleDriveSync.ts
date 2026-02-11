import { ZodError } from "zod";

import {
  buildExportPayload,
  flashcardDataSchema,
  type FlashcardData,
} from "@/lib/export-import";
import {
  downloadSyncFilePayload,
  uploadSyncFileJson,
} from "@/lib/google-drive/drive-api.service";
import {
  getGoogleAccessToken,
  hasInMemoryAccessToken,
  signInWithGoogle,
  signOutFromGoogle,
} from "@/lib/google-drive/oauth.service";
import { useCardsStore } from "@/stores/useCardsStore";
import { useDecksStore } from "@/stores/useDecksStore";
import { useSyncStore } from "@/stores/syncStore";
import {
  createDriveSyncError,
  isDriveSyncError,
  type AutoSyncResult,
  type AutoSyncTrigger,
  type DriveSyncError,
  type DriveSyncResult,
  type DriveUploadResult,
  type SyncNowResult,
} from "@/types/google-drive-sync";
import type { Card, Deck } from "@/types/flashcards";

interface AccessTokenOptions {
  forceRefresh?: boolean;
  interactive?: boolean;
}

function ok<T>(data: T): DriveSyncResult<T> {
  return { ok: true, data };
}

function err<T>(error: DriveSyncError): DriveSyncResult<T> {
  return { ok: false, error };
}

function toDriveSyncError(error: unknown, fallback: string): DriveSyncError {
  if (isDriveSyncError(error)) {
    return error;
  }

  if (error instanceof ZodError) {
    return createDriveSyncError({
      code: "VALIDATION_FAILED",
      message: error.issues.map((issue) => issue.message).join("; "),
      cause: error,
    });
  }

  if (error instanceof Error) {
    return createDriveSyncError({
      code: "UNKNOWN_ERROR",
      message: error.message || fallback,
      cause: error,
    });
  }

  return createDriveSyncError({
    code: "UNKNOWN_ERROR",
    message: fallback,
    cause: error,
  });
}

function toOfflineError(): DriveSyncError {
  return createDriveSyncError({
    code: "OFFLINE",
    message: "You are offline. Sync will retry when connection is restored.",
    retryable: true,
  });
}

function setSyncStatus(status: "idle" | "syncing" | "success" | "error"): void {
  useSyncStore.getState().setLastSyncStatus(status);
}

function markPendingChanges(): void {
  useSyncStore.getState().setPendingChanges(true);
}

function clearPendingChanges(): void {
  useSyncStore.getState().setPendingChanges(false);
}

function updateAuthState(token: string): void {
  const sync = useSyncStore.getState();
  sync.setAuthenticated(true);
  sync.setAccessToken(token);
}

function clearAuthState(): void {
  const sync = useSyncStore.getState();
  sync.setAuthenticated(false);
  sync.setAccessToken(undefined);
}

function parseTimestamp(value: string): number | null {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

function assertStoreReady(): DriveSyncError | null {
  const decksHydrated = useDecksStore.getState().hasHydrated;
  const cardsHydrated = useCardsStore.getState().hasHydrated;

  if (decksHydrated && cardsHydrated) {
    return null;
  }

  return createDriveSyncError({
    code: "STORE_NOT_READY",
    message: "Local flashcards are still loading.",
    retryable: true,
  });
}

function mergeDecksForSync(localDecks: Deck[], remoteDecks: Deck[]): Deck[] {
  const merged = new Map<string, Deck>();

  for (const deck of localDecks) {
    merged.set(deck.id, deck);
  }

  for (const deck of remoteDecks) {
    if (!merged.has(deck.id)) {
      merged.set(deck.id, deck);
    }
  }

  return Array.from(merged.values());
}

function mergeCardsForSync(localCards: Card[], remoteCards: Card[]): Card[] {
  const merged = new Map<string, Card>();

  for (const local of localCards) {
    merged.set(local.id, local);
  }

  for (const remote of remoteCards) {
    const local = merged.get(remote.id);

    if (!local) {
      merged.set(remote.id, remote);
      continue;
    }

    const localUpdatedAt = parseTimestamp(local.updatedAt);
    const remoteUpdatedAt = parseTimestamp(remote.updatedAt);

    if (remoteUpdatedAt !== null && localUpdatedAt !== null) {
      if (remoteUpdatedAt > localUpdatedAt) {
        merged.set(remote.id, remote);
      }
      continue;
    }

    if (remoteUpdatedAt !== null && localUpdatedAt === null) {
      merged.set(remote.id, remote);
    }
  }

  return Array.from(merged.values());
}

function mergeSyncData(local: FlashcardData, remote: FlashcardData): FlashcardData {
  const mergedDecks = mergeDecksForSync(local.decks, remote.decks);
  const validDeckIds = new Set(mergedDecks.map((deck) => deck.id));
  const mergedCards = mergeCardsForSync(local.cards, remote.cards).filter((card) =>
    validDeckIds.has(card.deckId),
  );

  return flashcardDataSchema.parse({
    decks: mergedDecks,
    cards: mergedCards,
  });
}

function getCurrentLocalData(): FlashcardData {
  const decks = useDecksStore.getState().decks;
  const cards = useCardsStore.getState().cards;
  return buildExportPayload(decks, cards);
}

function replaceLocalData(data: FlashcardData): void {
  useDecksStore.getState().replaceDecks(data.decks);
  useCardsStore.getState().replaceCards(data.cards);
}

function setSyncMetadata(input: {
  fileId?: string;
  modifiedTime?: string;
  status: "success" | "error" | "idle";
  clearPending?: boolean;
}): void {
  const sync = useSyncStore.getState();

  if (input.fileId) {
    sync.setRemoteFileId(input.fileId);
  }

  if (input.modifiedTime) {
    sync.setLastSyncAt(input.modifiedTime);
  } else if (input.status === "success") {
    sync.setLastSyncAt(new Date().toISOString());
  }

  sync.setLastSyncStatus(input.status);

  if (input.clearPending) {
    sync.setPendingChanges(false);
  }
}

function shouldSkipStartupMerge(lastSyncAt?: string, remoteModifiedTime?: string): boolean {
  if (!lastSyncAt || !remoteModifiedTime) {
    return false;
  }

  const lastLocalSync = parseTimestamp(lastSyncAt);
  const remoteUpdated = parseTimestamp(remoteModifiedTime);

  if (lastLocalSync === null || remoteUpdated === null) {
    return false;
  }

  return remoteUpdated <= lastLocalSync;
}

async function requestAccessToken(
  options: AccessTokenOptions = {},
): Promise<DriveSyncResult<string>> {
  const sync = useSyncStore.getState();
  const persistedToken = sync.accessToken;

  if (!options.forceRefresh && persistedToken) {
    sync.setAuthenticated(true);
    return ok(persistedToken);
  }

  try {
    const token = await getGoogleAccessToken({
      forceRefresh: options.forceRefresh,
      interactive: options.interactive ?? true,
    });
    updateAuthState(token);
    return ok(token);
  } catch (error) {
    const driveError = toDriveSyncError(
      error,
      "Unable to obtain Google access token.",
    );

    if (options.interactive ?? true) {
      clearAuthState();
    } else if (sync.accessToken) {
      sync.setAuthenticated(true);
    }

    return err(driveError);
  }
}

async function withTokenRetry<T>(
  operation: (accessToken: string) => Promise<T>,
  options?: AccessTokenOptions,
): Promise<DriveSyncResult<T>> {
  const initialToken = await requestAccessToken(options);

  if (!initialToken.ok) {
    return initialToken;
  }

  try {
    return ok(await operation(initialToken.data));
  } catch (error) {
    if (!isDriveSyncError(error) || error.code !== "TOKEN_EXPIRED") {
      return err(toDriveSyncError(error, "Google Drive request failed."));
    }
  }

  const refreshedToken = await requestAccessToken({
    ...options,
    forceRefresh: true,
  });

  if (!refreshedToken.ok) {
    return refreshedToken;
  }

  try {
    return ok(await operation(refreshedToken.data));
  } catch (error) {
    return err(toDriveSyncError(error, "Google Drive request failed."));
  }
}

async function uploadLocalSnapshot(
  accessToken: string,
  data: FlashcardData,
): Promise<DriveSyncResult<DriveUploadResult>> {
  try {
    const payload = JSON.stringify(flashcardDataSchema.parse(data));
    const uploaded = await uploadSyncFileJson(accessToken, payload);
    return ok(uploaded);
  } catch (error) {
    return err(toDriveSyncError(error, "Failed to upload sync file."));
  }
}

async function runBidirectionalSync(options?: {
  interactive?: boolean;
}): Promise<DriveSyncResult<SyncNowResult>> {
  const storeError = assertStoreReady();

  if (storeError) {
    return err(storeError);
  }

  if (isOffline()) {
    markPendingChanges();
    return err(toOfflineError());
  }

  setSyncStatus("syncing");
  const preferredFileId = useSyncStore.getState().remoteFileId;
  const localData = getCurrentLocalData();

  const remotePayload = await withTokenRetry(
    (accessToken) => downloadSyncFilePayload(accessToken, preferredFileId),
    { interactive: options?.interactive ?? true },
  );

  if (!remotePayload.ok) {
    if (remotePayload.error.code !== "MISSING_FILE") {
      setSyncStatus("error");
      markPendingChanges();
      return err(remotePayload.error);
    }

    const uploadResult = await withTokenRetry(
      (accessToken) => uploadLocalSnapshot(accessToken, localData).then((result) => {
        if (!result.ok) {
          throw result.error;
        }
        return result.data;
      }),
      { interactive: options?.interactive ?? true },
    );

    if (!uploadResult.ok) {
      setSyncStatus("error");
      markPendingChanges();
      return err(uploadResult.error);
    }

    setSyncMetadata({
      fileId: uploadResult.data.file.id,
      modifiedTime: uploadResult.data.file.modifiedTime,
      status: "success",
      clearPending: true,
    });

    return ok({
      mergedData: localData,
      uploadedFileId: uploadResult.data.file.id,
      created: uploadResult.data.created,
    });
  }

  let remoteData: FlashcardData;

  try {
    remoteData = flashcardDataSchema.parse(JSON.parse(remotePayload.data.json));
  } catch (error) {
    const invalidDataError = toDriveSyncError(
      error,
      "Failed to parse downloaded sync file.",
    );
    setSyncStatus("error");
    markPendingChanges();
    return err(invalidDataError);
  }

  const merged = mergeSyncData(localData, remoteData);
  replaceLocalData(merged);

  const uploadResult = await withTokenRetry(
    (accessToken) => uploadLocalSnapshot(accessToken, merged).then((result) => {
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    }),
    { interactive: options?.interactive ?? true },
  );

  if (!uploadResult.ok) {
    setSyncStatus("error");
    markPendingChanges();
    return err(uploadResult.error);
  }

  setSyncMetadata({
    fileId: uploadResult.data.file.id,
    modifiedTime: uploadResult.data.file.modifiedTime ?? remotePayload.data.file.modifiedTime,
    status: "success",
    clearPending: true,
  });

  return ok({
    mergedData: merged,
    uploadedFileId: uploadResult.data.file.id,
    created: uploadResult.data.created,
  });
}

export async function signIn(): Promise<DriveSyncResult<void>> {
  try {
    const token = await signInWithGoogle();
    updateAuthState(token);
    return ok(undefined);
  } catch (error) {
    clearAuthState();
    return err(toDriveSyncError(error, "Google sign-in failed."));
  }
}

export async function signOut(): Promise<DriveSyncResult<void>> {
  try {
    await signOutFromGoogle(useSyncStore.getState().accessToken);
    useSyncStore.getState().clearSession();
    return ok(undefined);
  } catch (error) {
    return err(toDriveSyncError(error, "Google sign-out failed."));
  }
}

export async function getAccessToken(
  options?: AccessTokenOptions,
): Promise<DriveSyncResult<string>> {
  return requestAccessToken(options);
}

export async function uploadSyncFile(
  data: FlashcardData,
): Promise<DriveSyncResult<DriveUploadResult>> {
  if (isOffline()) {
    markPendingChanges();
    return err(toOfflineError());
  }

  const result = await withTokenRetry((accessToken) =>
    uploadLocalSnapshot(accessToken, data).then((uploadResult) => {
      if (!uploadResult.ok) {
        throw uploadResult.error;
      }
      return uploadResult.data;
    }),
  );

  if (!result.ok) {
    setSyncStatus("error");
    markPendingChanges();
    return err(result.error);
  }

  setSyncMetadata({
    fileId: result.data.file.id,
    modifiedTime: result.data.file.modifiedTime,
    status: "success",
    clearPending: true,
  });

  return ok(result.data);
}

export async function downloadSyncFile(): Promise<DriveSyncResult<FlashcardData>> {
  if (isOffline()) {
    markPendingChanges();
    return err(toOfflineError());
  }

  const preferredFileId = useSyncStore.getState().remoteFileId;
  const remotePayload = await withTokenRetry((accessToken) =>
    downloadSyncFilePayload(accessToken, preferredFileId),
  );

  if (!remotePayload.ok) {
    setSyncStatus("error");
    return err(remotePayload.error);
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(remotePayload.data.json);
  } catch (error) {
    return err(
      createDriveSyncError({
        code: "CORRUPTED_JSON",
        message: "Sync file contains invalid JSON.",
        cause: error,
      }),
    );
  }

  try {
    const data = flashcardDataSchema.parse(parsed);
    setSyncMetadata({
      fileId: remotePayload.data.file.id,
      modifiedTime: remotePayload.data.file.modifiedTime,
      status: "success",
    });
    return ok(data);
  } catch (error) {
    return err(toDriveSyncError(error, "Sync file validation failed."));
  }
}

export async function forceUploadToDrive(): Promise<DriveSyncResult<DriveUploadResult>> {
  const storeError = assertStoreReady();

  if (storeError) {
    return err(storeError);
  }

  return uploadSyncFile(getCurrentLocalData());
}

export async function forceDownloadFromDrive(): Promise<DriveSyncResult<FlashcardData>> {
  const storeError = assertStoreReady();

  if (storeError) {
    return err(storeError);
  }

  if (isOffline()) {
    markPendingChanges();
    return err(toOfflineError());
  }

  setSyncStatus("syncing");
  const localData = getCurrentLocalData();
  const remote = await downloadSyncFile();

  if (!remote.ok) {
    setSyncStatus("error");
    return err(remote.error);
  }

  const merged = mergeSyncData(localData, remote.data);
  replaceLocalData(merged);
  setSyncMetadata({ status: "success" });
  return ok(merged);
}

export async function syncNow(): Promise<DriveSyncResult<SyncNowResult>> {
  useSyncStore.getState().setPendingChanges(true);
  return runBidirectionalSync({ interactive: true });
}

export async function autoSync(
  trigger: AutoSyncTrigger,
): Promise<DriveSyncResult<AutoSyncResult>> {
  const storeError = assertStoreReady();

  if (storeError) {
    return err(storeError);
  }

  if (trigger === "mutation") {
    markPendingChanges();
  }

  if (isOffline()) {
    markPendingChanges();
    setSyncStatus("idle");
    return err(toOfflineError());
  }

  if (trigger === "startup") {
    const remoteFileId = useSyncStore.getState().remoteFileId;

    if (!remoteFileId) {
      return ok({
        trigger,
        didSync: false,
        reason: "remote-file-id-missing",
      });
    }

    const tokenResult = await getAccessToken({ interactive: false });

    if (!tokenResult.ok) {
      return ok({
        trigger,
        didSync: false,
        reason: "not-authenticated",
      });
    }

    setSyncStatus("syncing");
    const remotePayload = await withTokenRetry(
      (accessToken) => downloadSyncFilePayload(accessToken, remoteFileId),
      { interactive: false },
    );

    if (!remotePayload.ok) {
      setSyncStatus("error");
      return err(remotePayload.error);
    }

    if (
      shouldSkipStartupMerge(
        useSyncStore.getState().lastSyncAt,
        remotePayload.data.file.modifiedTime,
      )
    ) {
      setSyncMetadata({
        fileId: remotePayload.data.file.id,
        modifiedTime: remotePayload.data.file.modifiedTime,
        status: "success",
      });
      return ok({
        trigger,
        didSync: false,
        reason: "already-up-to-date",
        remoteFileId: remotePayload.data.file.id,
      });
    }

    let remoteData: FlashcardData;

    try {
      remoteData = flashcardDataSchema.parse(JSON.parse(remotePayload.data.json));
    } catch (error) {
      setSyncStatus("error");
      return err(toDriveSyncError(error, "Failed to parse startup sync file."));
    }

    const localData = getCurrentLocalData();
    const merged = mergeSyncData(localData, remoteData);
    replaceLocalData(merged);

    setSyncMetadata({
      fileId: remotePayload.data.file.id,
      modifiedTime: remotePayload.data.file.modifiedTime,
      status: "success",
      clearPending: false,
    });

    return ok({
      trigger,
      didSync: true,
      mergedData: merged,
      remoteFileId: remotePayload.data.file.id,
    });
  }

  const pendingChanges = useSyncStore.getState().pendingChanges;

  if (!pendingChanges) {
    return ok({
      trigger,
      didSync: false,
      reason: "no-pending-changes",
    });
  }

  const tokenResult = await getAccessToken({ interactive: false });

  if (!tokenResult.ok) {
    setSyncStatus("error");
    return err(tokenResult.error);
  }

  const syncResult = await runBidirectionalSync({ interactive: false });

  if (!syncResult.ok) {
    return err(syncResult.error);
  }

  return ok({
    trigger,
    didSync: true,
    mergedData: syncResult.data.mergedData,
    remoteFileId: syncResult.data.uploadedFileId,
  });
}

export function onReviewFinished(): Promise<DriveSyncResult<AutoSyncResult>> {
  useSyncStore.getState().setPendingChanges(true);
  return autoSync("review");
}

export function hasActiveGoogleSession(): boolean {
  return hasInMemoryAccessToken() || useSyncStore.getState().isAuthenticated;
}

export function clearPendingSyncFlag(): void {
  clearPendingChanges();
}
