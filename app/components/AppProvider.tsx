"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  useCallback,
} from "react";
import type {
  AppState,
  UserProfile,
  SessionType,
  Difficulty,
  SessionBlock,
  Badge,
  PersonalBests,
} from "../lib/types";
import { createBadges } from "../lib/badges";
import {
  levelForXp,
  checkBadges,
  unlockBadges,
  XP,
  type LevelInfo,
} from "../lib/gamification";
import { xpForDifficulty } from "../lib/workouts";
import { currentPhase } from "../lib/progressiveOverload";
import { challengeForIndex, CHALLENGE_XP } from "../lib/challenges";
import { weekKey, todayISO, calendarDayGap } from "../lib/date";

// ---------- Storage keys ----------
const KEYS = {
  user: "ew_user",
  logs: "ew_logs",
  badges: "ew_badges",
  sessions: "ew_sessions",
  onboarded: "ew_onboarded",
  pbs: "ew_pbs",
  meta: "ew_meta",
};

// ---------- Defaults ----------
function defaultUser(): UserProfile {
  return {
    name: "",
    vma: 18,
    fcmax: 190,
    thresholdPace: 250, // 4:10 min/km in seconds
    level: 1,
    xp: 0,
    streak: 0,
    lastTrainingDate: "",
    totalSessions: 0,
    startDate: new Date().toISOString(),
  };
}

function defaultPBs(): PersonalBests {
  return { rameur500: "", rameur2000: "", ski500: "", run1km: "", vma: "" };
}

function defaultState(): AppState {
  return {
    user: defaultUser(),
    weekLogs: {},
    badges: createBadges(),
    customSessions: {},
    currentWeekChallenge: 0,
    challengeCompleted: false,
    personalBests: defaultPBs(),
    onboarded: false,
    modificationCount: 0,
  };
}

// ---------- Reducer ----------
type Action =
  | { type: "HYDRATE"; payload: AppState }
  | { type: "SET_STATE"; payload: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
    case "SET_STATE":
      return action.payload;
    default:
      return state;
  }
}

// ---------- Context ----------
export interface CompleteResult {
  xpEarned: number;
  leveledUp: boolean;
  newLevel: LevelInfo | null;
  newBadges: Badge[];
  perfectWeek: boolean;
  streakMilestone: number | null;
}

export interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  levelInfo: LevelInfo;
  levelUpInfo: LevelInfo | null;
  clearLevelUp: () => void;
  // mutations
  finishOnboarding: (user: Partial<UserProfile>) => void;
  updateUser: (patch: Partial<UserProfile>) => void;
  completeSession: (
    type: SessionType,
    difficulty: Difficulty,
    notes?: string
  ) => CompleteResult;
  saveCustomSession: (type: SessionType, blocks: SessionBlock[]) => void;
  resetCustomSession: (type: SessionType) => void;
  updatePersonalBests: (patch: Partial<PersonalBests>) => void;
  completeChallenge: () => number | null;
  resetProgress: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// ---------- Provider ----------
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelInfo | null>(null);
  const didHydrate = useRef(false);

  // ----- Hydrate from localStorage (client only) -----
  useEffect(() => {
    if (typeof window === "undefined" || didHydrate.current) return;
    didHydrate.current = true;
    const base = defaultState();
    try {
      const read = <T,>(key: string, fallback: T): T => {
        const raw = window.localStorage.getItem(key);
        return raw !== null ? (JSON.parse(raw) as T) : fallback;
      };
      const meta = read<{ currentWeekChallenge: number; challengeCompleted: boolean; modificationCount: number }>(
        KEYS.meta,
        {
          currentWeekChallenge: base.currentWeekChallenge,
          challengeCompleted: base.challengeCompleted,
          modificationCount: base.modificationCount,
        }
      );
      const loaded: AppState = {
        user: { ...base.user, ...read<Partial<UserProfile>>(KEYS.user, {}) },
        weekLogs: read(KEYS.logs, base.weekLogs),
        // merge badge defs with saved unlock state
        badges: mergeBadges(base.badges, read(KEYS.badges, {})),
        customSessions: read(KEYS.sessions, base.customSessions),
        currentWeekChallenge: meta.currentWeekChallenge ?? 0,
        challengeCompleted: meta.challengeCompleted ?? false,
        personalBests: { ...base.personalBests, ...read<Partial<PersonalBests>>(KEYS.pbs, {}) },
        onboarded: read(KEYS.onboarded, false),
        modificationCount: meta.modificationCount ?? 0,
      };
      dispatch({ type: "HYDRATE", payload: loaded });
    } catch {
      dispatch({ type: "HYDRATE", payload: base });
    } finally {
      setHydrated(true);
    }
  }, []);

  // ----- Persist on change (after hydration) -----
  const persist = useCallback((s: AppState) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(KEYS.user, JSON.stringify(s.user));
      window.localStorage.setItem(KEYS.logs, JSON.stringify(s.weekLogs));
      window.localStorage.setItem(KEYS.badges, JSON.stringify(s.badges));
      window.localStorage.setItem(KEYS.sessions, JSON.stringify(s.customSessions));
      window.localStorage.setItem(KEYS.onboarded, JSON.stringify(s.onboarded));
      window.localStorage.setItem(KEYS.pbs, JSON.stringify(s.personalBests));
      window.localStorage.setItem(
        KEYS.meta,
        JSON.stringify({
          currentWeekChallenge: s.currentWeekChallenge,
          challengeCompleted: s.challengeCompleted,
          modificationCount: s.modificationCount,
        })
      );
    } catch {
      /* storage unavailable */
    }
  }, []);

  const commit = useCallback(
    (next: AppState) => {
      dispatch({ type: "SET_STATE", payload: next });
      persist(next);
    },
    [persist]
  );

  const levelInfo = levelForXp(state.user.xp);

  // ----- Mutations -----
  const finishOnboarding = useCallback(
    (user: Partial<UserProfile>) => {
      const next: AppState = {
        ...state,
        user: {
          ...state.user,
          ...user,
          startDate: state.user.startDate || new Date().toISOString(),
        },
        onboarded: true,
      };
      commit(next);
    },
    [state, commit]
  );

  const updateUser = useCallback(
    (patch: Partial<UserProfile>) => {
      commit({ ...state, user: { ...state.user, ...patch } });
    },
    [state, commit]
  );

  const completeSession = useCallback(
    (type: SessionType, difficulty: Difficulty, notes?: string): CompleteResult => {
      const now = new Date();
      const key = weekKey(now);
      const prevLevel = levelForXp(state.user.xp).level;

      // XP
      let xpEarned = xpForDifficulty(difficulty);
      if (difficulty === "hard") xpEarned += XP.modifiedHarder;

      // Week log
      const week = { ...(state.weekLogs[key] ?? {}) };
      const completedBefore = Object.values(week).filter((e) => e.completed).length;
      const alreadyDone = week[type]?.completed;
      week[type] = {
        completed: true,
        difficulty,
        xpEarned,
        completedAt: now.toISOString(),
        notes,
      };
      const completedAfter = Object.values(week).filter((e) => e.completed).length;

      // Perfect week bonus (award once, on reaching 7)
      let perfectWeek = false;
      if (completedAfter === 7 && completedBefore < 7) {
        perfectWeek = true;
        xpEarned += XP.perfectWeek;
      }

      // Streak
      let streak = state.user.streak;
      const gap = state.user.lastTrainingDate
        ? calendarDayGap(state.user.lastTrainingDate, now)
        : Infinity;
      if (gap === 0) {
        streak = Math.max(1, streak); // same day, keep
      } else if (gap === 1) {
        streak = streak + 1;
      } else {
        streak = 1; // gap >= 2 or first ever
      }

      const streakMilestone = [7, 14, 21, 30].includes(streak) ? streak : null;

      const user: UserProfile = {
        ...state.user,
        xp: state.user.xp + xpEarned,
        streak,
        lastTrainingDate: now.toISOString(),
        totalSessions: state.user.totalSessions + (alreadyDone ? 0 : 1),
      };

      const newLevelInfo = levelForXp(user.xp);
      user.level = newLevelInfo.level;
      const leveledUp = newLevelInfo.level > prevLevel;

      const phase = currentPhase(user.startDate, now);

      let nextState: AppState = {
        ...state,
        user,
        weekLogs: { ...state.weekLogs, [key]: week },
      };

      // Badges
      const newIds = checkBadges(nextState, {
        completionHour: now.getHours(),
        perfectWeekJustAchieved: perfectWeek,
        phaseName: phase.name,
        weekFullyCompleted: completedAfter >= 7,
      });
      let newBadges: Badge[] = [];
      if (newIds.length > 0) {
        const unlocked = unlockBadges(nextState.badges, newIds, now.toISOString());
        newBadges = newIds.map((id) => unlocked[id]);
        nextState = { ...nextState, badges: unlocked };
      }

      commit(nextState);

      if (leveledUp) setLevelUpInfo(newLevelInfo);

      return {
        xpEarned,
        leveledUp,
        newLevel: leveledUp ? newLevelInfo : null,
        newBadges,
        perfectWeek,
        streakMilestone,
      };
    },
    [state, commit]
  );

  const saveCustomSession = useCallback(
    (type: SessionType, blocks: SessionBlock[]) => {
      commit({
        ...state,
        customSessions: { ...state.customSessions, [type]: blocks },
        modificationCount: state.modificationCount + 1,
      });
    },
    [state, commit]
  );

  const resetCustomSession = useCallback(
    (type: SessionType) => {
      const next = { ...state.customSessions };
      delete next[type];
      commit({ ...state, customSessions: next });
    },
    [state, commit]
  );

  const updatePersonalBests = useCallback(
    (patch: Partial<PersonalBests>) => {
      commit({ ...state, personalBests: { ...state.personalBests, ...patch } });
    },
    [state, commit]
  );

  const completeChallenge = useCallback((): number | null => {
    if (state.challengeCompleted) return null;
    const user = { ...state.user, xp: state.user.xp + CHALLENGE_XP };
    user.level = levelForXp(user.xp).level;
    commit({ ...state, user, challengeCompleted: true });
    return CHALLENGE_XP;
  }, [state, commit]);

  const resetProgress = useCallback(() => {
    commit(defaultState());
  }, [commit]);

  const clearLevelUp = useCallback(() => setLevelUpInfo(null), []);

  const value: AppContextValue = {
    state,
    hydrated,
    levelInfo,
    levelUpInfo,
    clearLevelUp,
    finishOnboarding,
    updateUser,
    completeSession,
    saveCustomSession,
    resetCustomSession,
    updatePersonalBests,
    completeChallenge,
    resetProgress,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function mergeBadges(
  defs: Record<string, Badge>,
  saved: Record<string, Partial<Badge>>
): Record<string, Badge> {
  const out: Record<string, Badge> = {};
  for (const id of Object.keys(defs)) {
    out[id] = {
      ...defs[id],
      unlocked: saved[id]?.unlocked ?? false,
      unlockedAt: saved[id]?.unlockedAt,
    };
  }
  return out;
}

export { challengeForIndex };
