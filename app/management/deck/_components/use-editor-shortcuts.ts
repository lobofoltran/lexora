import { useEffect } from "react";

interface UseEditorShortcutsInput {
  enabled: boolean;
  onSave: () => void;
  onApprove?: () => void;
}

export function useEditorShortcuts({
  enabled,
  onSave,
  onApprove,
}: UseEditorShortcutsInput): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const hasModifier = event.metaKey || event.ctrlKey;

      if (!hasModifier) {
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        onSave();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();

        if (onApprove) {
          onApprove();
          return;
        }

        onSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onApprove, onSave]);
}
