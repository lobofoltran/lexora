import { Button } from "@/components/ui/button";
import {
  formatIntervalPreview,
  formatIntervalPreviewA11y,
} from "@/lib/format-interval-preview";
import { cn } from "@/lib/utils";
import type { ReviewGrade } from "@/services/review.service";

interface GradeConfig {
  label: string;
  variant: "outline" | "secondary" | "default";
  className: string;
}

const gradeConfig: Record<ReviewGrade, GradeConfig> = {
  hard: {
    label: "Hard",
    variant: "outline",
    className: `
      border-red-500/50
      text-red-600
      hover:bg-red-500/10
      hover:text-red-600
      dark:text-red-400
      dark:border-red-400/40
    `,
  },

  normal: {
    label: "Normal",
    variant: "outline",
    className: `
      border-yellow-500/50
      text-yellow-600
      hover:bg-yellow-500/10
      hover:text-yellow-600
      dark:text-yellow-400
      dark:border-yellow-400/40
    `,
  },

  easy: {
    label: "Easy",
    variant: "default",
    className: `
      bg-primary
      text-primary-foreground
      hover:bg-primary/90
    `,
  },
};

export interface IntervalPreviewButtonProps {
  grade: ReviewGrade;
  previewDate: Date | null;
  onClick: () => void;
}

export function IntervalPreviewButton({
  grade,
  previewDate,
  onClick,
}: IntervalPreviewButtonProps) {
  const config = gradeConfig[grade];
  const previewLabel = previewDate ? formatIntervalPreview(previewDate) : null;
  const ariaLabel = previewDate
    ? `Grade ${config.label} - next review in ${formatIntervalPreviewA11y(previewDate)}`
    : `Grade ${config.label}`;

  return (
    <Button
      variant={config.variant}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn("h-auto min-w-24 px-3 py-2", config.className)}
    >
      <span className="flex flex-col items-center leading-tight">
        <span>{config.label}</span>
        {previewLabel ? (
          <span className="text-[0.7rem] opacity-80">{previewLabel}</span>
        ) : null}
      </span>
    </Button>
  );
}
