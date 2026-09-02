import type { SessionType, Difficulty } from "./types";

export const SESSION_META: Record<
  SessionType,
  { label: string; short: string; from: string; to: string; icon: string; accent: string }
> = {
  EF: { label: "Endurance Fondamentale", short: "EF", from: "#00d4ff", to: "#0ea5e9", icon: "🏃", accent: "#00d4ff" },
  VMA: { label: "VMA", short: "VMA", from: "#a855f7", to: "#ec4899", icon: "⚡", accent: "#a855f7" },
  SEUIL: { label: "Seuil", short: "SEUIL", from: "#ef4444", to: "#f97316", icon: "🔥", accent: "#ef4444" },
  FORCE1: { label: "Hyrox Force 1", short: "FORCE 1", from: "#f97316", to: "#eab308", icon: "🏋️", accent: "#f97316" },
  FORCE2: { label: "Hyrox Force 2", short: "FORCE 2", from: "#d97706", to: "#ef4444", icon: "💪", accent: "#d97706" },
  RAMEUR: { label: "Ergo Rameur", short: "RAMEUR", from: "#22c55e", to: "#06b6d4", icon: "🚣", accent: "#22c55e" },
  SKI: { label: "Ergo Ski Erg", short: "SKI", from: "#14b8a6", to: "#6366f1", icon: "🎿", accent: "#14b8a6" },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: "Facile", color: "#22c55e" },
  medium: { label: "Moyen", color: "#eab308" },
  hard: { label: "Difficile", color: "#ef4444" },
};

// Fixed Monday -> Sunday layout
export const WEEK_LAYOUT: { day: string; type: SessionType }[] = [
  { day: "Lundi", type: "EF" },
  { day: "Mardi", type: "FORCE1" },
  { day: "Mercredi", type: "VMA" },
  { day: "Jeudi", type: "RAMEUR" },
  { day: "Vendredi", type: "SEUIL" },
  { day: "Samedi", type: "FORCE2" },
  { day: "Dimanche", type: "SKI" },
];

export const gradient = (type: SessionType) =>
  `linear-gradient(135deg, ${SESSION_META[type].from}, ${SESSION_META[type].to})`;
