import { useSyncStore } from "@/stores/syncStore";
import type { AutoSyncTrigger } from "@/types/google-drive-sync";

const MUTATION_DEBOUNCE_MS = 5_000;

let mutationTimer: number | null = null;
let isSyncInFlight = false;

async function runAutoSync(trigger: AutoSyncTrigger): Promise<void> {
  if (isSyncInFlight) {
    return;
  }

  isSyncInFlight = true;

  try {
    const { autoSync } = await import("@/lib/googleDriveSync");
    await autoSync(trigger);
  } finally {
    isSyncInFlight = false;
  }
}

export function scheduleMutationAutoSync(): void {
  useSyncStore.getState().setPendingChanges(true);

  if (typeof window === "undefined") {
    return;
  }

  if (mutationTimer) {
    window.clearTimeout(mutationTimer);
  }

  mutationTimer = window.setTimeout(() => {
    mutationTimer = null;
    void runAutoSync("mutation");
  }, MUTATION_DEBOUNCE_MS);
}

export function triggerReviewAutoSync(): void {
  useSyncStore.getState().setPendingChanges(true);
  void runAutoSync("review");
}

export function retryPendingAutoSyncOnReconnect(): void {
  if (!useSyncStore.getState().pendingChanges) {
    return;
  }

  void runAutoSync("mutation");
}
