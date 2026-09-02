export type SessionType =
  | "EF"
  | "VMA"
  | "SEUIL"
  | "FORCE1"
  | "FORCE2"
  | "RAMEUR"
  | "SKI";

export type Difficulty = "easy" | "medium" | "hard";

export interface UserProfile {
  name: string;
  vma: number; // km/h
  fcmax: number; // BPM
  thresholdPace: number; // sec/km
  level: number;
  xp: number;
  streak: number;
  lastTrainingDate: string; // ISO date string
  totalSessions: number;
  startDate: string; // ISO date
}

export interface SessionBlock {
  id: string;
  label: string;
  type: "warmup" | "work" | "rest" | "cooldown";
  duration?: number; // seconds
  reps?: number;
  sets?: number;
  weight?: string;
  intensity?: string;
  notes?: string;
}

export interface SessionConfig {
  type: SessionType;
  difficulty: Difficulty;
  blocks: SessionBlock[];
  xpReward: number;
  estimatedDuration: number; // minutes
}

export interface WeekLogEntry {
  completed: boolean;
  difficulty: string;
  xpEarned: number;
  completedAt?: string;
  notes?: string;
}

export interface WeekLog {
  [sessionType: string]: WeekLogEntry;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  hidden: boolean;
}

export interface PersonalBests {
  rameur500: string;
  rameur2000: string;
  ski500: string;
  run1km: string;
  vma: string;
}

export interface AppState {
  user: UserProfile;
  weekLogs: Record<string, WeekLog>; // key: "YYYY-Www"
  badges: Record<string, Badge>;
  customSessions: Record<string, SessionBlock[]>;
  currentWeekChallenge: number; // 0-11
  challengeCompleted: boolean;
  personalBests: PersonalBests;
  onboarded: boolean;
  modificationCount: number; // # of session customizations (Perfectionniste badge)
}

export type PhaseIndex = 0 | 1 | 2 | 3;

export interface Phase {
  index: PhaseIndex;
  name: string;
  color: string;
  description: string;
}
