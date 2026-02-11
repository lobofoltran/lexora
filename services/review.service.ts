import { addDays, addHours, addMinutes } from "date-fns";
import type { Card } from "@/types/flashcards";

export type ReviewGrade = "hard" | "normal" | "easy";

/**
 * Config de limites da escada inicial
 */
const HARD_MAX_STEP = 6;     // controla até onde escala minutos
const NORMAL_MAX_STEP = 2;  // 6h, 12h, 24h
const EASY_MAX_STEP = 2;    // 1d, 2d, 4d

/**
 * Helpers matemáticos
 */
function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * HARD → minutos escaláveis
 *
 * 0 → 5m
 * 1 → 15m
 * 2 → 30m
 * 3 → 60m
 * 4 → 120m
 * 5 → 240m
 */
function hardMinutesFromStep(step: number): number {
  if (step <= 0) return 5;
  return 15 * Math.pow(2, step - 1);
}

/**
 * NORMAL → horas escaláveis
 *
 * 0 → 6h
 * 1 → 12h
 * 2 → 24h
 */
function normalHoursFromStep(step: number): number {
  return 6 * Math.pow(2, step);
}

/**
 * EASY → dias escaláveis
 *
 * 0 → 1d
 * 1 → 2d
 * 2 → 4d
 */
function easyDaysFromStep(step: number): number {
  return 1 * Math.pow(2, step);
}

/**
 * Função principal de revisão
 */
export function applyReviewGrade(
  card: Card & { lapses?: number },
  grade: ReviewGrade,
  now: Date = new Date(),
): Card & { lapses?: number } {
  let repetitions = card.repetitions ?? 0;
  let intervalDays = card.intervalDays ?? 1;
  let easeFactor = card.easeFactor ?? 2.5;
  let lapses = card.lapses ?? 0;

  let due: Date;

  /**
   * HARD
   * Loop curto em minutos
   */
  if (grade === "hard") {
    lapses += 1;
    repetitions = 0;

    const step = clampInt(lapses - 1, 0, HARD_MAX_STEP);
    const minutes = hardMinutesFromStep(step);

    due = addMinutes(now, minutes);

    // penaliza ease
    easeFactor = Math.max(1.3, easeFactor - 0.2);

    // intervalDays precisa ser inteiro → mínimo 1
    intervalDays = 1;
  }

  /**
   * NORMAL
   * Ladder inicial + crescimento moderado
   */
  else if (grade === "normal") {
    repetitions += 1;

    const ladderStep = repetitions - 1;

    if (ladderStep <= NORMAL_MAX_STEP) {
      const hours = normalHoursFromStep(ladderStep);
      due = addHours(now, hours);

      // dias arredondados → evita erro zod
      intervalDays = Math.max(1, Math.round(hours / 24));
    } else {
      // crescimento pós-ladder
      intervalDays = Math.max(1, Math.round(intervalDays * 1.8));
      due = addDays(now, intervalDays);
    }
  }

  /**
   * EASY
   * Ladder + crescimento exponencial
   */
  else {
    repetitions += 1;

    const ladderStep = repetitions - 1;

    if (ladderStep <= EASY_MAX_STEP) {
      const days = easyDaysFromStep(ladderStep);
      intervalDays = days;
      due = addDays(now, days);
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
      due = addDays(now, intervalDays);
    }

    easeFactor += 0.1;
  }

  return {
    ...card,
    repetitions,
    intervalDays,      // sempre int
    easeFactor,
    lapses,
    dueDate: due.toISOString(),
    lastReviewedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/**
 * Preview timing (Anki-like)
 */
export function previewNextInterval(
  card: Card & { lapses?: number },
  grade: ReviewGrade,
  now: Date = new Date(),
): Date {
  return new Date(applyReviewGrade(card, grade, now).dueDate);
}
