const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_DAYS = 30;

function toPositiveDeltaMs(target: Date, now: Date): number {
  return Math.max(0, target.getTime() - now.getTime());
}

function formatMonthValue(months: number): string {
  const rounded = Math.round(months * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

export function formatIntervalPreview(date: Date, now: Date = new Date()): string {
  const deltaMs = toPositiveDeltaMs(date, now);

  if (deltaMs < HOUR_MS) {
    const minutes = Math.max(1, Math.round(deltaMs / MINUTE_MS));
    return `+${minutes}m`;
  }

  if (deltaMs < DAY_MS) {
    const hours = Math.max(1, Math.round(deltaMs / HOUR_MS));
    return `+${hours}h`;
  }

  const days = Math.max(1, Math.round(deltaMs / DAY_MS));

  if (days < MONTH_DAYS) {
    return `+${days}d`;
  }

  const months = days / MONTH_DAYS;
  return `+${formatMonthValue(months)}mo`;
}

export function formatIntervalPreviewA11y(date: Date, now: Date = new Date()): string {
  const deltaMs = toPositiveDeltaMs(date, now);

  if (deltaMs < HOUR_MS) {
    const minutes = Math.max(1, Math.round(deltaMs / MINUTE_MS));
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  if (deltaMs < DAY_MS) {
    const hours = Math.max(1, Math.round(deltaMs / HOUR_MS));
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  const days = Math.max(1, Math.round(deltaMs / DAY_MS));

  if (days < MONTH_DAYS) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  const months = days / MONTH_DAYS;
  const monthLabel = formatMonthValue(months);
  return `${monthLabel} month${monthLabel === "1" ? "" : "s"}`;
}
