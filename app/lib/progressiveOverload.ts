import { differenceInCalendarDays } from "date-fns";
import type { Phase, PhaseIndex, Difficulty } from "./types";

export const PHASES: Record<PhaseIndex, Phase> = {
  0: { index: 0, name: "Base", color: "#00d4ff", description: "Programme normal, difficulté Moyen par défaut." },
  1: { index: 1, name: "Build", color: "#f97316", description: "+5-10% de volume, Moyen/Difficile encouragés." },
  2: { index: 2, name: "Peak", color: "#ef4444", description: "Intensité maximale, Difficile encouragé." },
  3: { index: 3, name: "Deload", color: "#22c55e", description: "Toutes les séances en Facile, volume -40%." },
};

export function weekNumberSince(startDate: string, ref: Date = new Date()): number {
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return 0;
  const days = differenceInCalendarDays(ref, start);
  return Math.max(0, Math.floor(days / 7));
}

export function phaseForWeek(weekNumber: number): Phase {
  const idx = (Math.floor(weekNumber / 4) % 4) as PhaseIndex;
  return PHASES[idx];
}

export function currentPhase(startDate: string, ref: Date = new Date()): Phase {
  return phaseForWeek(weekNumberSince(startDate, ref));
}

/** Difficulty the program recommends for a given phase. */
export function recommendedDifficulty(phaseIndex: number): Difficulty {
  switch (phaseIndex) {
    case 2:
      return "hard";
    case 3:
      return "easy";
    default:
      return "medium";
  }
}

/** Deload forces every session to easy. */
export function enforcePhaseDifficulty(phaseIndex: number, selected: Difficulty): Difficulty {
  return phaseIndex === 3 ? "easy" : selected;
}

/** Cycle position 1..16 for the "Eye of the Storm" badge (full 16-week cycle). */
export function cycleWeek(weekNumber: number): number {
  return (weekNumber % 16) + 1;
}
