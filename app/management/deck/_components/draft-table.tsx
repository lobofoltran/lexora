"use client";

import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { AIDraftCard, DensityMode } from "./draft-types";

interface DraftTableProps {
  drafts: AIDraftCard[];
  density: DensityMode;
  onEditDraft: (draftId: string) => void;
  onApproveDraft: (draftId: string) => void;
  onDiscardDraft: (draftId: string) => void;
}

function getLengthLabel(front: string, back: string): string {
  const frontLength = front.trim().length;
  const backLength = back.trim().length;
  const total = frontLength + backLength;

  return `F:${frontLength} B:${backLength} T:${total}`;
}

function formatStyleLabel(style: string): string {
  return style
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function DraftTable({
  drafts,
  density,
  onEditDraft,
  onApproveDraft,
  onDiscardDraft,
}: DraftTableProps) {
  const dense = density === "compact";
  const previewClassName = dense
    ? "line-clamp-2 whitespace-pre-wrap break-words text-[0.6875rem] leading-snug"
    : "line-clamp-2 whitespace-pre-wrap break-words text-xs leading-relaxed";

  const metaClassName = dense
    ? "mt-1 flex flex-wrap items-center gap-1 text-[0.625rem]"
    : "mt-2 flex flex-wrap items-center gap-1 text-[0.6875rem]";

  const cellClassName = dense ? "p-1.5 align-top" : "p-2 align-top";

  return (
    <>
      <ScrollArea className="h-[48vh] rounded-md border sm:hidden" aria-label="AI drafts list">
        <div className="space-y-2 p-2">
          {drafts.map((draft) => (
            <article key={draft.id} className="space-y-2 rounded-md border p-2">
              <div className={metaClassName}>
                <Badge variant="secondary">Draft</Badge>
                <Badge variant="outline">{formatStyleLabel(draft.style)}</Badge>
                <span className="text-muted-foreground">
                  {format(new Date(draft.createdAt), "PPP 'at' HH:mm")}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-[0.6875rem] uppercase">Front</p>
                <p className={previewClassName}>{draft.front}</p>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-[0.6875rem] uppercase">Back</p>
                <p className={previewClassName}>{draft.back}</p>
              </div>

              <code className="text-muted-foreground block text-[0.6875rem]">
                {getLengthLabel(draft.front, draft.back)}
              </code>

              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onEditDraft(draft.id)}
                  aria-label="Edit draft"
                >
                  Edit
                </Button>
                <Button
                  size="xs"
                  onClick={() => onApproveDraft(draft.id)}
                  aria-label="Approve and create card"
                >
                  Approve
                </Button>
                <Button
                  size="xs"
                  variant="destructive"
                  onClick={() => onDiscardDraft(draft.id)}
                  aria-label="Discard draft"
                >
                  Discard
                </Button>
              </div>
            </article>
          ))}
        </div>
      </ScrollArea>

      <ScrollArea className="hidden h-[48vh] rounded-md border sm:block" aria-label="AI drafts table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Front preview</TableHead>
              <TableHead>Back preview</TableHead>
              <TableHead>Tokens/length</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map((draft) => (
              <TableRow key={draft.id}>
                <TableCell className={cellClassName}>
                  <p className={previewClassName}>{draft.front}</p>
                  <div className={metaClassName}>
                    <Badge variant="secondary">Draft</Badge>
                    <Badge variant="outline">{formatStyleLabel(draft.style)}</Badge>
                    <span className="text-muted-foreground">
                      {format(new Date(draft.createdAt), "PPP 'at' HH:mm")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={cellClassName}>
                  <p className={previewClassName}>{draft.back}</p>
                </TableCell>
                <TableCell className={cellClassName}>
                  <code className="text-muted-foreground text-[0.6875rem]">
                    {getLengthLabel(draft.front, draft.back)}
                  </code>
                </TableCell>
                <TableCell className={cellClassName}>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onEditDraft(draft.id)}
                      aria-label="Edit draft"
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      onClick={() => onApproveDraft(draft.id)}
                      aria-label="Approve and create card"
                    >
                      Approve
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => onDiscardDraft(draft.id)}
                      aria-label="Discard draft"
                    >
                      Discard
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </>
  );
}
