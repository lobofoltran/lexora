import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

export type LastSyncStatus = "idle" | "syncing" | "success" | "error";

interface SyncStore {
  isAuthenticated: boolean;
  accessToken?: string;
  lastSyncAt?: string;
  lastSyncStatus: LastSyncStatus;
  remoteFileId?: string;
  pendingChanges: boolean;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setAuthenticated: (value: boolean) => void;
  setAccessToken: (token?: string) => void;
  setLastSyncAt: (value?: string) => void;
  setLastSyncStatus: (value: LastSyncStatus) => void;
  setRemoteFileId: (value?: string) => void;
  setPendingChanges: (value: boolean) => void;
  markPendingChanges: () => void;
  clearSession: () => void;
  resetSyncState: () => void;
}

const memoryStorage = new Map<string, string>();

const fallbackStorage: StateStorage = {
  getItem: (key) => memoryStorage.get(key) ?? null,
  setItem: (key, value) => {
    memoryStorage.set(key, value);
  },
  removeItem: (key) => {
    memoryStorage.delete(key);
  },
};

const syncStoreStorage = createJSONStorage(() =>
  typeof window === "undefined" ? fallbackStorage : localStorage,
);

export const useSyncStore = create<SyncStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: undefined,
      lastSyncAt: undefined,
      lastSyncStatus: "idle",
      remoteFileId: undefined,
      pendingChanges: false,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setAccessToken: (token) => set({ accessToken: token }),
      setLastSyncAt: (value) => set({ lastSyncAt: value }),
      setLastSyncStatus: (value) => set({ lastSyncStatus: value }),
      setRemoteFileId: (value) => set({ remoteFileId: value }),
      setPendingChanges: (value) => set({ pendingChanges: value }),
      markPendingChanges: () => set({ pendingChanges: true }),
      clearSession: () =>
        set({
          isAuthenticated: false,
          accessToken: undefined,
        }),
      resetSyncState: () =>
        set({
          isAuthenticated: false,
          accessToken: undefined,
          lastSyncAt: undefined,
          lastSyncStatus: "idle",
          remoteFileId: undefined,
          pendingChanges: false,
        }),
    }),
    {
      name: "anki-sync-store",
      storage: syncStoreStorage,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        lastSyncAt: state.lastSyncAt,
        lastSyncStatus: state.lastSyncStatus,
        remoteFileId: state.remoteFileId,
        pendingChanges: state.pendingChanges,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
