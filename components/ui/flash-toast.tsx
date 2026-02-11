"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FlashToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export function FlashToast({ open, message, onClose }: FlashToastProps) {
  return (
    <div
      className={[
        "pointer-events-none fixed right-4 bottom-4 z-50 transition-all duration-200",
        open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 z-[9999]",
      ].join(" ")}
      aria-live="polite"
      aria-atomic="true"
    >
      <Card className="pointer-events-auto min-w-64">
        <CardContent className="flex items-center justify-between gap-3">
          <span className="text-xs">{message}</span>
          <Button type="button" variant="destructive" size="xs" onClick={onClose}>
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
