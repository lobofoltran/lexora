"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownViewer } from "@/components/markdown-viewer";

import { useEditorShortcuts } from "./use-editor-shortcuts";

type EditorStatus = "Draft" | "Editing";

interface EditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  status: EditorStatus;
  front: string;
  back: string;
  dirty: boolean;
  saveLabel: string;
  approveLabel?: string;
  onFrontChange: (value: string) => void;
  onBackChange: (value: string) => void;
  onSave: () => void;
  onApprove?: () => void;
  onCancel: () => void;
}

function buildPreview(front: string, back: string): string {
  return [
    "## Front",
    "",
    front.trim() || "_Empty front_",
    "",
    "---",
    "",
    "## Back",
    "",
    back.trim() || "_Empty back_",
  ].join("\n");
}

export function EditorModal({
  open,
  onOpenChange,
  title,
  status,
  front,
  back,
  dirty,
  saveLabel,
  approveLabel,
  onFrontChange,
  onBackChange,
  onSave,
  onApprove,
  onCancel,
}: EditorModalProps) {
  useEditorShortcuts({ enabled: open, onSave, onApprove });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[85vh] w-[95vw] max-w-5xl gap-0 overflow-hidden p-0 sm:max-w-5xl"
        showCloseButton={false}
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="sticky top-0 z-10 border-b bg-background px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle>{title}</DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={status === "Draft" ? "secondary" : "outline"}>
                    {status}
                  </Badge>
                  <span
                    className={[
                      "text-xs",
                      dirty ? "text-foreground" : "text-muted-foreground",
                    ].join(" ")}
                    aria-live="polite"
                  >
                    {dirty ? "Unsaved changes" : "All changes saved"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={onSave}>
                  {saveLabel}
                </Button>
                {onApprove && approveLabel ? (
                  <Button size="sm" onClick={onApprove}>
                    {approveLabel}
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-hidden p-3">
            <div className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="flex min-h-0 flex-col rounded-md border">
                <div className="border-b px-3 py-2">
                  <Label htmlFor="editor-front">Front editor</Label>
                </div>
                <ScrollArea className="min-h-0 flex-1 p-3">
                  <Textarea
                    id="editor-front"
                    value={front}
                    onChange={(event) => onFrontChange(event.target.value)}
                    className="min-h-[56vh] resize-y font-mono"
                    aria-label="Front markdown editor"
                  />
                </ScrollArea>
              </div>

              <div className="flex min-h-0 flex-col rounded-md border">
                <div className="border-b px-3 py-2">
                  <Label htmlFor="editor-back">Back editor</Label>
                </div>
                <ScrollArea className="min-h-0 flex-1 p-3">
                  <Textarea
                    id="editor-back"
                    value={back}
                    onChange={(event) => onBackChange(event.target.value)}
                    className="min-h-[56vh] resize-y font-mono"
                    aria-label="Back markdown editor"
                  />
                </ScrollArea>
              </div>

              <div className="flex min-h-0 flex-col rounded-md border">
                <div className="border-b px-3 py-2">
                  <Label>Live preview</Label>
                </div>
                <ScrollArea className="min-h-0 flex-1 p-3">
                  <MarkdownViewer content={buildPreview(front, back)} />
                </ScrollArea>
              </div>
            </div>
          </div>

          <Separator />

          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 bg-background px-4 py-3">
            <Button size="sm" variant="outline" onClick={onSave}>
              {saveLabel}
            </Button>
            {onApprove && approveLabel ? (
              <Button size="sm" onClick={onApprove}>
                {approveLabel}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
