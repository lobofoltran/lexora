"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { DensityMode } from "./draft-types";

interface DraftToolbarProps {
  count: number;
  density: DensityMode;
  onDensityChange: (mode: DensityMode) => void;
  onApproveAll: () => void;
  onDiscardAll: () => void;
  onExportJson: () => void;
}

export function DraftToolbar({
  count,
  density,
  onDensityChange,
  onApproveAll,
  onDiscardAll,
  onExportJson,
}: DraftToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{count} drafts</Badge>
        <Separator orientation="vertical" className="hidden h-4 sm:block" />
        <Tabs
          value={density}
          onValueChange={(value) => onDensityChange(value as DensityMode)}
        >
          <TabsList>
            <TabsTrigger value="comfortable">Comfortable</TabsTrigger>
            <TabsTrigger value="compact">Compact</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="xs" onClick={onApproveAll} aria-label="Approve all drafts">
          Approve all
        </Button>
        <Button
          size="xs"
          variant="destructive"
          onClick={onDiscardAll}
          aria-label="Discard all drafts"
        >
          Discard all
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={onExportJson}
          aria-label="Export drafts as JSON"
        >
          Export JSON
        </Button>
      </div>
    </div>
  );
}
