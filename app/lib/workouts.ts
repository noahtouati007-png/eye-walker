import type { SessionType, Difficulty, SessionBlock, SessionConfig } from "./types";
import { SESSION_META } from "./theme";

let _id = 0;
const uid = (prefix: string) => `${prefix}-${_id++}`;

const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 100,
  medium: 150,
  hard: 200,
};

type Category = "run" | "force" | "ergo";

const CATEGORY: Record<SessionType, Category> = {
  EF: "run",
  VMA: "run",
  SEUIL: "run",
  FORCE1: "force",
  FORCE2: "force",
  RAMEUR: "ergo",
  SKI: "ergo",
};

export const categoryOf = (type: SessionType): Category => CATEGORY[type];

// ---------- WARM-UP PROTOCOLS ----------
function warmup(category: Category): SessionBlock[] {
  if (category === "run") {
    return [
      { id: uid("wu"), label: "Footing très léger", type: "warmup", duration: 600, intensity: "60% FCmax" },
      { id: uid("wu"), label: "4 x 100m accélérations progressives", type: "warmup", reps: 4, intensity: "60% → 95%" },
      { id: uid("wu"), label: "Marche récupération", type: "warmup", duration: 120 },
      { id: uid("wu"), label: "6 foulées bondissantes + 6 montées de genoux", type: "warmup", notes: "Gammes athlétiques" },
    ];
  }
  if (category === "force") {
    return [
      { id: uid("wu"), label: "Foam roller (quadris, ischios, fessiers, TFL)", type: "warmup", duration: 300 },
      { id: uid("wu"), label: "Activation : 2x15 pont fessier, 2x12 bird-dog, 2x10 dead bug", type: "warmup" },
      { id: uid("wu"), label: "Complexe barre vide : 10 Good Morning + 10 Back Squat + 10 RDL", type: "warmup", sets: 1 },
      { id: uid("wu"), label: "2 séries d'échauffement à 50% puis 65% du poids de travail", type: "warmup", sets: 2 },
    ];
  }
  return [
    { id: uid("wu"), label: "5min rame/ski à intensité 50%", type: "warmup", duration: 300, intensity: "50%" },
    { id: uid("wu"), label: "3 x 20sec effort à 70% / 40sec repos", type: "warmup", reps: 3 },
    { id: uid("wu"), label: "Repos complet", type: "warmup", duration: 120 },
    { id: uid("wu"), label: "Mobilité épaules et bassin", type: "warmup", duration: 120 },
  ];
}

// ---------- COOL-DOWN PROTOCOLS ----------
function cooldown(category: Category): SessionBlock[] {
  if (category === "run") {
    return [
      { id: uid("cd"), label: "Footing très lent", type: "cooldown", duration: 600, intensity: "50% FCmax" },
      { id: uid("cd"), label: "Étirements statiques (ischios, psoas, mollets, fessiers, quadris)", type: "cooldown", duration: 900 },
    ];
  }
  if (category === "force") {
    return [
      { id: uid("cd"), label: "Stretching statique full body", type: "cooldown", duration: 600 },
      { id: uid("cd"), label: "Respiration 4-7-8 (3 cycles)", type: "cooldown" },
      { id: uid("cd"), label: "Foam roller zones travaillées", type: "cooldown", duration: 300 },
    ];
  }
  return [
    { id: uid("cd"), label: "5min rame/ski à 40% intensité", type: "cooldown", duration: 300, intensity: "40%" },
    { id: uid("cd"), label: "Stretching épaules et dos", type: "cooldown", duration: 600 },
    { id: uid("cd"), label: "Mobilité thoracique — foam roller", type: "cooldown", duration: 180 },
  ];
}

// ---------- MAIN WORK BLOCKS ----------
function workBlocks(type: SessionType, difficulty: Difficulty): SessionBlock[] {
  const b = (partial: Omit<SessionBlock, "id" | "type"> & { type?: SessionBlock["type"] }): SessionBlock => ({
    id: uid("w"),
    type: partial.type ?? "work",
    ...partial,
  });

  switch (type) {
    case "EF":
      if (difficulty === "easy")
        return [b({ label: "Course longue Zone 2", duration: 3600, intensity: "65% FCmax ≈ 6:00/km" })];
      if (difficulty === "medium")
        return [b({ label: "Course longue Zone 2", duration: 4500, intensity: "68% FCmax ≈ 5:30/km" })];
      return [b({ label: "Course longue Zone 2+", duration: 5400, intensity: "70% FCmax ≈ 5:00/km" })];

    case "VMA":
      if (difficulty === "easy")
        return [
          b({ label: "8 x 400m", reps: 8, intensity: "100% VMA" }),
          b({ label: "Récupération entre chaque", type: "rest", duration: 90 }),
        ];
      if (difficulty === "medium")
        return [
          b({ label: "10 x 400m", reps: 10, intensity: "102% VMA" }),
          b({ label: "Récupération", type: "rest", duration: 90 }),
          b({ label: "Alt. : 6 x 800m @ 98% VMA, récup 2min", notes: "Option coach" }),
        ];
      return [
        b({ label: "12 x 400m", reps: 12, intensity: "105% VMA" }),
        b({ label: "Récupération", type: "rest", duration: 60 }),
        b({ label: "Alt. : 6 x 800m @ 100% VMA, récup 90s", notes: "Option coach" }),
      ];

    case "SEUIL":
      if (difficulty === "easy")
        return [
          b({ label: "3 x 15min @ allure seuil", reps: 3, duration: 900, intensity: "Seuil" }),
          b({ label: "Récupération marche", type: "rest", duration: 180 }),
        ];
      if (difficulty === "medium")
        return [
          b({ label: "2 x 25min @ allure seuil", reps: 2, duration: 1500, intensity: "Seuil" }),
          b({ label: "Récupération", type: "rest", duration: 300 }),
        ];
      return [b({ label: "40min continu @ allure seuil", duration: 2400, intensity: "Seuil" })];

    case "FORCE1":
      if (difficulty === "easy")
        return [
          b({ label: "Deadlift", sets: 3, reps: 8, weight: "70% 1RM" }),
          b({ label: "Back Squat", sets: 3, reps: 8, weight: "70% 1RM" }),
          b({ label: "Bulgarian Split Squat", sets: 3, reps: 8 }),
          b({ label: "Récup entre séries", type: "rest", duration: 120 }),
        ];
      if (difficulty === "medium")
        return [
          b({ label: "Deadlift", sets: 4, reps: 6, weight: "80% 1RM" }),
          b({ label: "Back Squat", sets: 4, reps: 6, weight: "80% 1RM" }),
          b({ label: "Hip Thrust", sets: 4, reps: 6, weight: "80% 1RM" }),
          b({ label: "Romanian Deadlift", sets: 4, reps: 6 }),
          b({ label: "Récup entre séries", type: "rest", duration: 150 }),
        ];
      return [
        b({ label: "Deadlift", sets: 5, reps: 4, weight: "87% 1RM" }),
        b({ label: "Back Squat", sets: 5, reps: 4, weight: "87% 1RM" }),
        b({ label: "Hip Thrust", sets: 5, reps: 3, weight: "87% 1RM" }),
        b({ label: "Bulgarian Split Squat (accessoire)", sets: 3, reps: 8 }),
        b({ label: "Romanian Deadlift (accessoire)", sets: 3, reps: 8 }),
        b({ label: "Récup entre séries", type: "rest", duration: 180 }),
      ];

    case "FORCE2":
      if (difficulty === "easy")
        return [
          b({ label: "Wall Balls (20kg/9kg)", sets: 3, reps: 15 }),
          b({ label: "Sled Push/Pull", sets: 3 }),
          b({ label: "Farmer Carry", sets: 3 }),
          b({ label: "3 rounds complets — effort 60%", intensity: "60%" }),
          b({ label: "Récup entre rounds", type: "rest", duration: 120 }),
        ];
      if (difficulty === "medium")
        return [
          b({ label: "Wall Balls (20kg/9kg)", sets: 4, reps: 18 }),
          b({ label: "Sled Push/Pull", sets: 4 }),
          b({ label: "Farmer Carry", sets: 4 }),
          b({ label: "Sandbag Lunges (20kg)", sets: 4 }),
          b({ label: "4 rounds complets — effort 75%", intensity: "75%" }),
          b({ label: "Récup entre rounds", type: "rest", duration: 90 }),
        ];
      return [
        b({ label: "Wall Balls (20kg/9kg)", sets: 5, reps: 20 }),
        b({ label: "Sled Push/Pull", sets: 5 }),
        b({ label: "Farmer Carry", sets: 5 }),
        b({ label: "Sandbag Lunges (20kg)", sets: 5 }),
        b({ label: "Burpee Broad Jump", sets: 5 }),
        b({ label: "5 rounds AMRAP-style — effort 85%", intensity: "85%" }),
        b({ label: "Récup entre rounds", type: "rest", duration: 60 }),
      ];

    case "RAMEUR":
      if (difficulty === "easy")
        return [
          b({ label: "5 x 4min", reps: 5, duration: 240, intensity: "75% effort" }),
          b({ label: "Récupération", type: "rest", duration: 120 }),
        ];
      if (difficulty === "medium")
        return [
          b({ label: "3 x 2000m", reps: 3, intensity: "allure course -5s/500m" }),
          b({ label: "Récupération", type: "rest", duration: 240 }),
        ];
      return [
        b({ label: "8 x 500m", reps: 8, intensity: "effort maximal" }),
        b({ label: "Récupération", type: "rest", duration: 120 }),
      ];

    case "SKI":
      if (difficulty === "easy")
        return [
          b({ label: "5 x 4min", reps: 5, duration: 240, intensity: "75% effort" }),
          b({ label: "Récupération", type: "rest", duration: 120 }),
        ];
      if (difficulty === "medium")
        return [
          b({ label: "6 x 3min", reps: 6, duration: 180, intensity: "80% effort" }),
          b({ label: "Récupération", type: "rest", duration: 90 }),
        ];
      return [
        b({ label: "8 x 2min", reps: 8, duration: 120, intensity: "85% effort" }),
        b({ label: "Récupération", type: "rest", duration: 60 }),
      ];
  }
}

const BASE_DURATION: Record<SessionType, Record<Difficulty, number>> = {
  EF: { easy: 80, medium: 95, hard: 110 },
  VMA: { easy: 55, medium: 65, hard: 70 },
  SEUIL: { easy: 70, medium: 75, hard: 65 },
  FORCE1: { easy: 60, medium: 70, hard: 80 },
  FORCE2: { easy: 55, medium: 65, hard: 75 },
  RAMEUR: { easy: 50, medium: 60, hard: 55 },
  SKI: { easy: 50, medium: 55, hard: 55 },
};

export const SESSION_DESCRIPTIONS: Record<SessionType, string> = {
  EF: "Course longue en Zone 2, construire la base aérobie.",
  VMA: "Fractions courtes à haute intensité pour développer la puissance aérobie.",
  SEUIL: "Course à allure seuil lactique pour repousser la limite anaérobie.",
  FORCE1: "Séance force pure axée sur les mouvements fondamentaux.",
  FORCE2: "Séance fonctionnelle simulant les stations Hyrox.",
  RAMEUR: "Intervalles rameur pour développer la puissance et l'endurance spécifique.",
  SKI: "Intervalles ski erg — travail de l'armature haute et endurance.",
};

/**
 * Build a full session config. Reset the id counter each call so ids are stable
 * per render pass (they only need to be unique within one session's block list).
 */
export function getSession(
  type: SessionType,
  difficulty: Difficulty,
  customWork?: SessionBlock[]
): SessionConfig {
  _id = 0;
  const category = categoryOf(type);
  const work = customWork && customWork.length > 0 ? customWork : workBlocks(type, difficulty);
  const blocks = [...warmup(category), ...work, ...cooldown(category)];
  return {
    type,
    difficulty,
    blocks,
    xpReward: XP_BY_DIFFICULTY[difficulty],
    estimatedDuration: BASE_DURATION[type][difficulty],
  };
}

export function xpForDifficulty(difficulty: Difficulty): number {
  return XP_BY_DIFFICULTY[difficulty];
}

export const sessionLabel = (type: SessionType) => SESSION_META[type].label;
