import type { AppState, SessionType, Difficulty, Badge } from "./types";
import { weekNumberSince } from "./progressiveOverload";

export interface LevelInfo {
  level: number;
  name: string;
  currentThreshold: number;
  nextThreshold: number | null; // null = max level
  isMax: boolean;
}

export const LEVELS: { level: number; name: string; xp: number }[] = [
  { level: 1, name: "Débutant", xp: 0 },
  { level: 2, name: "Coureur", xp: 500 },
  { level: 3, name: "Athlète", xp: 1500 },
  { level: 4, name: "Compétiteur", xp: 3000 },
  { level: 5, name: "Elite", xp: 6000 },
  { level: 6, name: "Hyrox Pro", xp: 10000 },
  { level: 7, name: "Eye-Walker", xp: 15000 },
];

export function levelForXp(xp: number): LevelInfo {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xp) current = lvl;
  }
  const next = LEVELS.find((l) => l.level === current.level + 1) ?? null;
  return {
    level: current.level,
    name: current.name,
    currentThreshold: current.xp,
    nextThreshold: next ? next.xp : null,
    isMax: next === null,
  };
}

export function levelProgress(xp: number): number {
  const info = levelForXp(xp);
  if (info.isMax || info.nextThreshold === null) return 1;
  const span = info.nextThreshold - info.currentThreshold;
  return Math.min(1, Math.max(0, (xp - info.currentThreshold) / span));
}

// ----- XP bonuses -----
export const XP = {
  modifiedHarder: 25,
  perfectWeek: 500,
  weeklyChallenge: 300,
};

// ----- Derived counts across all logs -----
export interface DerivedCounts {
  totalCompleted: number;
  perType: Record<SessionType, number>;
  hardPerType: Record<SessionType, number>;
  maxConsecutiveHard: number;
}

const emptyPerType = (): Record<SessionType, number> => ({
  EF: 0, VMA: 0, SEUIL: 0, FORCE1: 0, FORCE2: 0, RAMEUR: 0, SKI: 0,
});

export function deriveCounts(state: AppState): DerivedCounts {
  const perType = emptyPerType();
  const hardPerType = emptyPerType();
  const history: { at: number; difficulty: string }[] = [];
  let totalCompleted = 0;

  for (const weekKey of Object.keys(state.weekLogs)) {
    const week = state.weekLogs[weekKey];
    for (const sessionType of Object.keys(week)) {
      const entry = week[sessionType];
      if (!entry?.completed) continue;
      totalCompleted++;
      if (sessionType in perType) {
        perType[sessionType as SessionType]++;
        if (entry.difficulty === "hard") hardPerType[sessionType as SessionType]++;
      }
      history.push({
        at: entry.completedAt ? new Date(entry.completedAt).getTime() : 0,
        difficulty: entry.difficulty,
      });
    }
  }

  history.sort((a, b) => a.at - b.at);
  let run = 0;
  let maxConsecutiveHard = 0;
  for (const h of history) {
    if (h.difficulty === "hard") {
      run++;
      maxConsecutiveHard = Math.max(maxConsecutiveHard, run);
    } else {
      run = 0;
    }
  }

  return { totalCompleted, perType, hardPerType, maxConsecutiveHard };
}

// ----- Badge checking -----
export interface BadgeContext {
  completionHour: number; // 0-23, hour a session was just completed
  perfectWeekJustAchieved: boolean;
  phaseName: string; // "Peak" | "Deload" | ...
  weekFullyCompleted: boolean; // the just-updated week is 7/7
}

/** Returns ids of badges that should now be unlocked (were locked before). */
export function checkBadges(state: AppState, ctx: BadgeContext): string[] {
  const counts = deriveCounts(state);
  const info = levelForXp(state.user.xp);
  const weekNum = weekNumberSince(state.user.startDate);

  const conditions: Record<string, boolean> = {
    "premier-pas": counts.totalCompleted >= 1,
    "semaine-parfaite": ctx.perfectWeekJustAchieved || hasPerfectWeek(state),
    "iron-will": counts.totalCompleted >= 30,
    "vma-machine": counts.perType.VMA >= 10,
    "sled-dog": counts.perType.FORCE1 + counts.perType.FORCE2 >= 10,
    "rower": counts.perType.RAMEUR >= 10,
    "ski-master": counts.perType.SKI >= 10,
    "zone2-master": counts.perType.EF >= 20,
    "seuil-breaker": counts.hardPerType.SEUIL >= 5,
    "peak-performer": ctx.phaseName === "Peak" && ctx.weekFullyCompleted,
    "recuperation-sage": ctx.phaseName === "Deload" && ctx.weekFullyCompleted,
    "eye-walker-legend": info.level >= 7,
    "serie-de-feu": state.user.streak >= 7,
    "inarretable": state.user.streak >= 21,
    "centurion": counts.totalCompleted >= 100,
    // hidden
    "ghost-mode": ctx.completionHour >= 23,
    "early-bird": ctx.completionHour < 6,
    "no-pain-no-gain": counts.maxConsecutiveHard >= 5,
    "perfectionniste": state.modificationCount >= 10,
    "eye-of-the-storm": weekNum >= 15,
  };

  const newly: string[] = [];
  for (const id of Object.keys(conditions)) {
    const badge = state.badges[id];
    if (badge && !badge.unlocked && conditions[id]) newly.push(id);
  }
  return newly;
}

function hasPerfectWeek(state: AppState): boolean {
  for (const weekKey of Object.keys(state.weekLogs)) {
    const week = state.weekLogs[weekKey];
    let completed = 0;
    for (const t of Object.keys(week)) if (week[t]?.completed) completed++;
    if (completed >= 7) return true;
  }
  return false;
}

export function unlockBadges(
  badges: Record<string, Badge>,
  ids: string[],
  at: string
): Record<string, Badge> {
  const next = { ...badges };
  for (const id of ids) {
    if (next[id]) next[id] = { ...next[id], unlocked: true, unlockedAt: at };
  }
  return next;
}
