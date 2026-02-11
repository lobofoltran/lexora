"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]";

    if (!isLocalhost && window.location.protocol !== "https:") {
      return;
    }

    let updateIntervalId: number | null = null;

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        void registration.update();
        updateIntervalId = window.setInterval(() => {
          void registration.update();
        }, 60 * 60 * 1000);
      })
      .catch(() => {
        // Ignore registration errors; app continues without PWA features.
      });

    return () => {
      if (updateIntervalId !== null) {
        window.clearInterval(updateIntervalId);
      }
    };
  }, []);

  return null;
}
