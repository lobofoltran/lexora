"use client";

import { useEffect, useRef } from "react";

import { useDriveSync } from "@/hooks/useDriveSync";
import { loadGoogleIdentityServices } from "@/lib/google-drive/oauth.service";
import { retryPendingAutoSyncOnReconnect } from "@/lib/sync/auto-sync";

export function SyncBootstrap() {
  const { isReady, autoSync } = useDriveSync();
  const startedRef = useRef(false);

  useEffect(() => {
    // Preload GIS to avoid popup timing issues on first user click.
    void loadGoogleIdentityServices().catch(() => {
      // Ignore here; action handlers surface auth errors when needed.
    });
  }, []);

  useEffect(() => {
    if (!isReady || startedRef.current) {
      return;
    }

    startedRef.current = true;
    void autoSync("startup");
  }, [autoSync, isReady]);

  useEffect(() => {
    const handleOnline = () => {
      retryPendingAutoSyncOnReconnect();
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
