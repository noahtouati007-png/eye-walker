import type { SessionType, Difficulty, SessionBlock, SessionConfig } from "./types";

let _id = 0;
const uid = (prefix: string) => `${prefix}-${_id++}`;

const XP_BY_DIFFICULTY: Record<Difficulty, number> = { easy: 100, medium: 150, hard: 200 };

type Category = "run" | "force" | "ergo";
const CATEGORY: Record<SessionType, Category> = {
  EF: "run", VMA: "run", SEUIL: "run", FORCE1: "force", FORCE2: "force", RAMEUR: "ergo", SKI: "ergo",
};
export const categoryOf = (type: SessionType): Category => CATEGORY[type];

// ---------- Progression context (long-term overload) ----------
export interface Prog {
  week: number;
  phaseIndex: number; // 0 Base, 1 Build, 2 Peak, 3 Deload
  meso: number; // mesocycle number (increments every 4 weeks)
  deload: boolean;
  bump: number; // extra volume units accrued over mesocycles (-1 on deload)
}

function progFor(week: number, phaseIndex: number): Prog {
  const meso = Math.floor(week / 4);
  const deload = phaseIndex === 3;
  const bump = deload ? -1 : Math.min(meso, 4);
  return { week, phaseIndex, meso, deload, bump };
}

/** Scale a base count by the accrued progression, clamped. */
function scaled(base: number, p: Prog, max: number, min = 2): number {
  return Math.max(min, Math.min(max, base + p.bump));
}

// ---------- Warm-up protocols ----------
function warmup(category: Category): SessionBlock[] {
  if (category === "run")
    return [
      { id: uid("wu"), label: "Footing très léger", type: "warmup", duration: 600, intensity: "60% FCmax" },
      { id: uid("wu"), label: "Mobilité dynamique (hanches, chevilles)", type: "warmup", duration: 180 },
      { id: uid("wu"), label: "4 x 100m accélérations progressives", type: "warmup", reps: 4, intensity: "60% → 95%" },
      { id: uid("wu"), label: "Gammes : montées de genoux, talons-fesses, foulées bondissantes", type: "warmup", notes: "2 x 20m chaque" },
    ];
  if (category === "force")
    return [
      { id: uid("wu"), label: "Foam roller (quadris, ischios, fessiers, dorsaux)", type: "warmup", duration: 300 },
      { id: uid("wu"), label: "Activation : 2x15 pont fessier, 2x12 bird-dog, 2x10 dead bug", type: "warmup" },
      { id: uid("wu"), label: "Complexe barre vide : 10 Good Morning + 10 Back Squat + 10 RDL", type: "warmup", sets: 2 },
      { id: uid("wu"), label: "Montée en charge : 50% x5, 65% x3, 80% x1 du poids de travail", type: "warmup", sets: 3 },
    ];
  return [
    { id: uid("wu"), label: "Ergo progressif à 50% puis 65%", type: "warmup", duration: 300, intensity: "50-65%" },
    { id: uid("wu"), label: "3 x 20sec accélération / 40sec facile", type: "warmup", reps: 3 },
    { id: uid("wu"), label: "Mobilité épaules, bassin, dorsaux", type: "warmup", duration: 150 },
  ];
}

// ---------- Cool-down protocols ----------
function cooldown(category: Category): SessionBlock[] {
  if (category === "run")
    return [
      { id: uid("cd"), label: "Footing très lent (retour au calme)", type: "cooldown", duration: 600, intensity: "50% FCmax" },
      { id: uid("cd"), label: "Étirements : ischios, psoas, mollets, fessiers, quadris", type: "cooldown", duration: 720 },
    ];
  if (category === "force")
    return [
      { id: uid("cd"), label: "Stretching statique full body", type: "cooldown", duration: 600 },
      { id: uid("cd"), label: "Respiration 4-7-8 (retour parasympathique)", type: "cooldown", notes: "3 cycles" },
      { id: uid("cd"), label: "Foam roller zones travaillées", type: "cooldown", duration: 300 },
    ];
  return [
    { id: uid("cd"), label: "Ergo très léger à 40%", type: "cooldown", duration: 300, intensity: "40%" },
    { id: uid("cd"), label: "Stretching épaules, dorsaux, avant-bras", type: "cooldown", duration: 420 },
    { id: uid("cd"), label: "Mobilité thoracique — foam roller", type: "cooldown", duration: 180 },
  ];
}

// ---------- Block factory ----------
const B = (partial: Omit<SessionBlock, "id" | "type"> & { type?: SessionBlock["type"] }): SessionBlock => ({
  id: uid("w"),
  type: partial.type ?? "work",
  ...partial,
});
const rest = (duration: number, label = "Récupération"): SessionBlock => B({ label, type: "rest", duration });
const hyroxCue = (text: string): SessionBlock => B({ label: `🎯 Transfert Hyrox : ${text}`, type: "work" });

// ---------- Variant type ----------
interface Variant {
  name: string;
  focus: string;
  build: (d: Difficulty, p: Prog) => SessionBlock[];
}

const D = <T,>(d: Difficulty, easy: T, medium: T, hard: T): T => (d === "easy" ? easy : d === "medium" ? medium : hard);

// =====================================================================
//  VARIANTS — rotate weekly so no two consecutive weeks are identical
// =====================================================================
const VARIANTS: Record<SessionType, Variant[]> = {
  // ------------------------------- EF -------------------------------
  EF: [
    {
      name: "Sortie longue Zone 2",
      focus: "Base aérobie · économie de course",
      build: (d, p) => [
        B({ label: "Course continue Zone 2", duration: D(d, 3600, 4500, 5400) + p.bump * 300, intensity: D(d, "65% FCmax ≈ 6:00/km", "68% FCmax ≈ 5:30/km", "70% FCmax ≈ 5:00/km"), rpe: "RPE 4-5" }),
        hyroxCue("nez uniquement sur les 20 premières minutes pour ancrer la respiration basse."),
      ],
    },
    {
      name: "EF vallonnée + côtes",
      focus: "Puissance spécifique · renforcement course",
      build: (d, p) => [
        B({ label: "Zone 2 sur parcours vallonné", duration: D(d, 2400, 3000, 3600), intensity: "68% FCmax" }),
        B({ label: `${scaled(D(d, 6, 8, 10), p, 12)} x côtes en puissance`, reps: scaled(D(d, 6, 8, 10), p, 12), duration: 30, intensity: "effort 85%, descente en marche", rpe: "RPE 8" }),
        B({ label: "Retour Zone 2", duration: 900, intensity: "65% FCmax" }),
        hyroxCue("attaque de pied actif en côte = poussée sur sled plus efficace."),
      ],
    },
    {
      name: "EF + lignes droites",
      focus: "Fraîcheur neuromusculaire · foulée",
      build: (d, p) => [
        B({ label: "Zone 2 fluide", duration: D(d, 3000, 3600, 4200), intensity: "66% FCmax" }),
        B({ label: `${scaled(D(d, 6, 8, 8), p, 10)} x lignes droites 100m`, reps: scaled(D(d, 6, 8, 8), p, 10), distance: "100m", intensity: "90% relâché", notes: "récup marche retour" }),
      ],
    },
    {
      name: "EF + gainage course",
      focus: "Endurance + transfert tronc",
      build: (d) => [
        B({ label: "Zone 2", duration: D(d, 2700, 3300, 3900), intensity: "66% FCmax" }),
        B({ label: "Circuit gainage x3", sets: 3, notes: "gainage 45s, side plank 30s/côté, hollow 30s, superman 30s" }),
        hyroxCue("tronc solide = moins de perte d'énergie en fin de course compromise."),
      ],
    },
  ],

  // ------------------------------- VMA ------------------------------
  VMA: [
    {
      name: "30/30 Billat",
      focus: "VO2max · puissance aérobie",
      build: (d, p) => {
        const sets = D(d, 2, 2, 3);
        const reps = scaled(D(d, 8, 10, 10), p, 12);
        const out: SessionBlock[] = [];
        for (let s = 0; s < sets; s++) {
          out.push(B({ label: `Série ${s + 1} : ${reps} x 30s / 30s`, reps, intensity: D(d, "105% VMA / footing", "107% VMA / footing", "110% VMA / footing"), rpe: "RPE 8-9" }));
          if (s < sets - 1) out.push(rest(D(d, 180, 180, 150), "Récup entre séries (footing)"));
        }
        out.push(hyroxCue("garde une cadence >90 même fatigué : c'est la clé du roxzone."));
        return out;
      },
    },
    {
      name: "400m rapides",
      focus: "Vitesse spécifique · tolérance lactique",
      build: (d, p) => [
        B({ label: `${scaled(D(d, 8, 10, 12), p, 14)} x 400m`, reps: scaled(D(d, 8, 10, 12), p, 14), distance: "400m", intensity: D(d, "103% VMA", "105% VMA", "107% VMA"), rpe: "RPE 9" }),
        rest(D(d, 90, 75, 60), "Récup active entre chaque"),
        hyroxCue("négative split sur les 4 dernières : simule le finish."),
      ],
    },
    {
      name: "Pyramide 200→800",
      focus: "Gestion d'allure · large spectre",
      build: (d, p) => {
        const blocks: SessionBlock[] = [
          B({ label: "200m", distance: "200m", intensity: "106% VMA" }),
          B({ label: "400m", distance: "400m", intensity: "104% VMA" }),
          B({ label: "600m", distance: "600m", intensity: "102% VMA" }),
          B({ label: "800m", distance: "800m", intensity: "100% VMA" }),
          B({ label: "600m", distance: "600m", intensity: "102% VMA" }),
          B({ label: "400m", distance: "400m", intensity: "104% VMA" }),
          B({ label: "200m", distance: "200m", intensity: "108% VMA" }),
        ];
        const withRest: SessionBlock[] = [];
        blocks.forEach((b, i) => { withRest.push(b); if (i < blocks.length - 1) withRest.push(rest(90)); });
        if (d === "hard" || p.bump >= 3) { withRest.push(rest(180, "Récup longue")); withRest.push(B({ label: "Rappel : 4 x 200m", reps: 4, distance: "200m", intensity: "110% VMA" })); }
        return withRest;
      },
    },
    {
      name: "VMA compromise Hyrox",
      focus: "Transfert course compromise (jambes fatiguées)",
      build: (d, p) => [
        B({ label: `${scaled(D(d, 4, 5, 6), p, 8)} rounds : 15 Wall Balls + 400m`, reps: scaled(D(d, 4, 5, 6), p, 8), intensity: "course @ 100% VMA après les WB", rpe: "RPE 9", notes: "Wall Balls 9kg, enchaîne directement la course" }),
        rest(D(d, 120, 90, 75)),
        hyroxCue("c'est LA séance la plus proche de la course : cœur haut avant de courir."),
      ],
    },
  ],

  // ------------------------------ SEUIL -----------------------------
  SEUIL: [
    {
      name: "Seuil continu",
      focus: "Repousser le seuil lactique",
      build: (d, p) => [
        B({ label: D(d, "3 x 12min", "2 x 20min", "40min continu"), reps: D(d, 3, 2, 1), duration: D(d, 720, 1200, 2400), intensity: "allure seuil (RPE 7-8)", rpe: "RPE 7-8" }),
        rest(D(d, 180, 300, 0), d === "hard" ? "Pas de récup — bloc continu" : "Récup trot"),
        hyroxCue(`vise ${scaled(0, p, 4) > 0 ? "+5s/km" : "l'allure"} plus rapide que ta dernière séance seuil.`),
      ],
    },
    {
      name: "Over-unders",
      focus: "Bascule seuil ± · clairance lactate",
      build: (d, p) => [
        B({ label: `${scaled(D(d, 4, 5, 6), p, 8)} x (2min sous-seuil / 1min au-dessus)`, reps: scaled(D(d, 4, 5, 6), p, 8), intensity: "sous = RPE 7 / au-dessus = RPE 9", tempo: "sans récup entre under/over" }),
        rest(D(d, 120, 90, 60), "Récup entre blocs"),
        hyroxCue("apprends à recycler le lactate en courant : essentiel entre les stations."),
      ],
    },
    {
      name: "Seuil brisé + stations",
      focus: "Transfert Hyrox · course sous fatigue",
      build: (d, p) => [
        B({ label: `${scaled(D(d, 4, 5, 6), p, 7)} rounds : 1km seuil + 20 Wall Balls`, reps: scaled(D(d, 4, 5, 6), p, 7), distance: "1km", intensity: "seuil, puis WB immédiat", rpe: "RPE 8" }),
        rest(D(d, 120, 90, 75)),
        hyroxCue("le 1km reprend à allure seuil DÈS la dernière wall ball posée."),
      ],
    },
    {
      name: "Tempo progressif",
      focus: "Contrôle d'allure · negative split",
      build: (d, p) => [
        B({ label: `${scaled(D(d, 3, 3, 4), p, 5)} x 10min en negative split`, reps: scaled(D(d, 3, 3, 4), p, 5), duration: 600, intensity: "1er tiers RPE 6 → dernier tiers RPE 8", tempo: "accélère chaque 3min20" }),
        rest(120),
      ],
    },
  ],

  // ----------------------------- FORCE1 -----------------------------
  FORCE1: [
    {
      name: "Force maximale bas du corps",
      focus: "Force maximale · recrutement",
      build: (d, p) => [
        B({ label: "Back Squat", sets: scaled(D(d, 4, 4, 5), p, 6), reps: D(d, 5, 4, 3), weight: D(d, "80% 1RM", "85% 1RM", "88-90% 1RM"), tempo: "30X1", rpe: "RPE 8" }),
        B({ label: "Deadlift", sets: D(d, 3, 4, 4), reps: D(d, 5, 4, 3), weight: D(d, "80% 1RM", "85% 1RM", "88% 1RM") }),
        rest(180, "Récup entre séries lourdes"),
        B({ label: "Accessoire : Bulgarian Split Squat", sets: 3, reps: 8, notes: "charge modérée, contrôle" }),
        B({ label: "Accessoire : Nordic curls / Leg curl", sets: 3, reps: 8 }),
        hyroxCue("jambes fortes = poussée de sled explosive et lunges tenues."),
      ],
    },
    {
      name: "Chaîne postérieure & unilatéral",
      focus: "Déséquilibres · robustesse",
      build: (d, p) => [
        B({ label: "Trap-bar Deadlift", sets: scaled(D(d, 4, 4, 5), p, 6), reps: D(d, 6, 5, 4), weight: D(d, "75% 1RM", "82% 1RM", "85% 1RM") }),
        B({ label: "Hip Thrust", sets: 4, reps: D(d, 8, 6, 5), weight: D(d, "70%", "80%", "85%"), tempo: "pause 2s en haut" }),
        B({ label: "Romanian Deadlift", sets: 3, reps: 8, tempo: "3s excentrique" }),
        rest(150),
        B({ label: "Step-up lesté (unilatéral)", sets: 3, reps: 10, notes: "10 par jambe, hauteur genou" }),
        hyroxCue("chaîne postérieure = farmers carry et sandbag sans casser le dos."),
      ],
    },
    {
      name: "Contraste / PAP (force-vitesse)",
      focus: "Puissance · transfert explosif",
      build: (d, p) => [
        B({ label: "Back Squat lourd", sets: scaled(D(d, 4, 5, 5), p, 6), reps: 3, weight: D(d, "80%", "85%", "87%"), notes: "complexe de contraste" }),
        B({ label: "+ Box Jump (juste après le squat)", sets: D(d, 4, 5, 5), reps: 5, intensity: "explosif max", rpe: "qualité > quantité" }),
        rest(180, "Récup complète (contraste)"),
        B({ label: "Trap-bar DL", sets: 4, reps: 3, weight: "80%" }),
        B({ label: "+ Broad Jump", sets: 4, reps: 4, distance: "saut max" }),
        hyroxCue("la puissance explosive se transfère au burpee broad jump et aux départs ergo."),
      ],
    },
    {
      name: "Force-endurance jambes",
      focus: "Endurance de force · lactique locale",
      build: (d, p) => [
        B({ label: "Front Squat tempo", sets: scaled(D(d, 3, 4, 4), p, 5), reps: D(d, 10, 12, 15), weight: D(d, "60%", "65%", "70%"), tempo: "3110" }),
        B({ label: "Walking Lunges lestées", sets: 4, distance: D(d, "20m", "30m", "40m"), weight: "haltères", rpe: "RPE 8" }),
        B({ label: "Goblet Squat en continu", sets: 3, reps: 20 }),
        rest(120),
        hyroxCue("brûlure de quads contrôlée = tu tiens les 100 lunges sandbag du parcours."),
      ],
    },
  ],

  // ----------------------------- FORCE2 -----------------------------
  FORCE2: [
    {
      name: "Simulation Hyrox 1/2",
      focus: "Enchaînement stations + course",
      build: (d, p) => [
        B({ label: `${scaled(D(d, 3, 4, 4), p, 5)} rounds à enchaîner :`, reps: scaled(D(d, 3, 4, 4), p, 5), intensity: D(d, "effort 70%", "effort 80%", "effort 88%") }),
        B({ label: "• 500m Row ou SkiErg", distance: "500m" }),
        B({ label: "• 20 Wall Balls (9kg)", reps: 20 }),
        B({ label: "• Sled Push", distance: D(d, "12,5m", "15m", "20m"), weight: "lourd" }),
        B({ label: "• 200m Run", distance: "200m", notes: "course compromise en fin de round" }),
        rest(D(d, 150, 90, 75), "Récup entre rounds"),
        hyroxCue("transitions <10s : le roxzone se gagne sur les petits détails."),
      ],
    },
    {
      name: "Stations lourdes (force spé)",
      focus: "Force spécifique stations",
      build: (d, p) => [
        B({ label: "Sled Push lourd", sets: scaled(D(d, 4, 5, 6), p, 8), distance: "15m", weight: D(d, "+40kg", "+60kg", "+80kg"), rpe: "RPE 9" }),
        B({ label: "Sled Pull lourd", sets: D(d, 4, 5, 6), distance: "15m", weight: "lourd" }),
        B({ label: "Farmers Carry", sets: 4, distance: D(d, "40m", "50m", "60m"), weight: D(d, "2x24kg", "2x28kg", "2x32kg") }),
        B({ label: "Sandbag Lunges", sets: 4, distance: "20m", weight: D(d, "20kg", "25kg", "30kg") }),
        rest(120),
        hyroxCue("charges > jour de course : le poids de course paraîtra léger."),
      ],
    },
    {
      name: "Compromised running (roxzone)",
      focus: "Course sous fatigue · transitions",
      build: (d, p) => [
        B({ label: `${scaled(D(d, 6, 8, 8), p, 12)} x (200m run + 1 station)`, reps: scaled(D(d, 6, 8, 8), p, 12), distance: "200m", notes: "stations en rotation : WB / burpee BJ / sled / farmers / sandbag" }),
        rest(D(d, 75, 60, 45), "Transition rapide"),
        hyroxCue("objectif : temps de course stable malgré la fatigue accumulée."),
      ],
    },
    {
      name: "Bloc engine (SkiErg/Row/Burpee)",
      focus: "Moteur cardio · haut du corps",
      build: (d, p) => [
        B({ label: "SkiErg", distance: D(d, "750m", "1000m", "1000m"), intensity: "allure course" }),
        B({ label: "Burpee Broad Jump", distance: D(d, "60m", "80m", "80m") }),
        B({ label: "Row", distance: D(d, "750m", "1000m", "1000m"), intensity: "allure course" }),
        B({ label: `${scaled(2, p, 4)} tours du bloc ci-dessus`, reps: scaled(2, p, 4), rpe: "RPE 8-9" }),
        rest(120),
        hyroxCue("gère la respiration sur le ski et le row : ce sont tes récup actives en course."),
      ],
    },
  ],

  // ----------------------------- RAMEUR -----------------------------
  RAMEUR: [
    {
      name: "500m allure course",
      focus: "Puissance spécifique 1000m Hyrox",
      build: (d, p) => [
        B({ label: `${scaled(D(d, 6, 7, 8), p, 10)} x 500m`, reps: scaled(D(d, 6, 7, 8), p, 10), distance: "500m", intensity: D(d, "allure course +2s", "allure course", "allure course -2s/500m"), tempo: "cadence 26-28 s/m", rpe: "RPE 8-9" }),
        rest(D(d, 120, 105, 90), "Récup = temps de rame"),
        hyroxCue("verrouille un split cible et tiens-le : régularité > départ trop vite."),
      ],
    },
    {
      name: "Seuil rameur",
      focus: "Endurance de puissance",
      build: (d, p) => [
        B({ label: D(d, "4 x 1000m", "3 x 1500m", "3 x 2000m"), reps: D(d, 4, 3, 3), distance: D(d, "1000m", "1500m", "2000m"), intensity: "allure seuil", tempo: "cadence 24-26 s/m" }),
        rest(D(d, 180, 210, 240)),
      ],
    },
    {
      name: "Sprints & départs",
      focus: "Explosivité · premiers coups",
      build: (d, p) => [
        B({ label: `${scaled(D(d, 8, 10, 12), p, 14)} x 250m départ arrêté`, reps: scaled(D(d, 8, 10, 12), p, 14), distance: "250m", intensity: "max contrôlé", notes: "3 premiers coups puissants puis rythme" }),
        rest(90),
        hyroxCue("maîtrise le départ arrêté : tu rames toujours après une course."),
      ],
    },
    {
      name: "Pyramide 250→1000",
      focus: "Large spectre · gestion",
      build: (d) => [
        B({ label: "250m", distance: "250m", intensity: "vite" }),
        rest(60),
        B({ label: "500m", distance: "500m", intensity: "allure course" }),
        rest(90),
        B({ label: "750m", distance: "750m", intensity: "seuil+" }),
        rest(120),
        B({ label: "1000m", distance: "1000m", intensity: "allure course Hyrox" }),
        rest(120),
        B({ label: d === "hard" ? "Redescente 750-500-250" : "Retour au calme rameur", duration: d === "hard" ? undefined : 300 }),
      ],
    },
  ],

  // ------------------------------- SKI ------------------------------
  SKI: [
    {
      name: "1min on/off",
      focus: "Puissance haut du corps · VO2",
      build: (d, p) => [
        B({ label: `${scaled(D(d, 8, 10, 12), p, 16)} x 1min effort / 1min facile`, reps: scaled(D(d, 8, 10, 12), p, 16), intensity: D(d, "effort 80%", "effort 85%", "effort 90%"), tempo: "engagement dorsaux + tronc" }),
        hyroxCue("tire avec le tronc, pas que les bras : tu économises pour le sled."),
      ],
    },
    {
      name: "500m répétés",
      focus: "Spécifique station SkiErg",
      build: (d, p) => [
        B({ label: `${scaled(D(d, 6, 7, 8), p, 10)} x 500m`, reps: scaled(D(d, 6, 7, 8), p, 10), distance: "500m", intensity: "allure course", tempo: "cadence régulière" }),
        rest(D(d, 120, 100, 90)),
      ],
    },
    {
      name: "Pyramide + tirage",
      focus: "Endurance + renfort tirage",
      build: (d, p) => [
        B({ label: "Ski 250-500-750-500-250m", notes: "récup = 1/2 temps d'effort" }),
        rest(120),
        B({ label: "Superset tirage x3", sets: 3, notes: "12 tractions/row TRX + 15 face pull + 40s ski explosif" }),
        B({ label: `${scaled(0, p, 2)} tour(s) bonus du superset`, reps: scaled(0, p, 2) }),
        hyroxCue("un dos endurant tient le ski, le row ET le sled pull."),
      ],
    },
    {
      name: "Sprints 100m + gainage",
      focus: "Explosivité + tronc",
      build: (d, p) => [
        B({ label: `${scaled(D(d, 8, 10, 12), p, 14)} x 100m sprint ski`, reps: scaled(D(d, 8, 10, 12), p, 14), distance: "100m", intensity: "max" }),
        rest(60),
        B({ label: "Gainage anti-rotation", sets: 3, notes: "Pallof press 12/côté + hollow hold 40s" }),
      ],
    },
  ],
};

// duration estimate baseline (minutes)
const BASE_DURATION: Record<SessionType, Record<Difficulty, number>> = {
  EF: { easy: 75, medium: 90, hard: 105 },
  VMA: { easy: 55, medium: 65, hard: 72 },
  SEUIL: { easy: 65, medium: 72, hard: 68 },
  FORCE1: { easy: 60, medium: 70, hard: 82 },
  FORCE2: { easy: 55, medium: 65, hard: 78 },
  RAMEUR: { easy: 50, medium: 58, hard: 60 },
  SKI: { easy: 48, medium: 55, hard: 58 },
};

export const SESSION_DESCRIPTIONS: Record<SessionType, string> = {
  EF: "Course longue en Zone 2, construire la base aérobie et l'économie de course.",
  VMA: "Fractions haute intensité pour développer VO2max, vitesse et tolérance lactique.",
  SEUIL: "Travail au seuil lactique pour tenir une allure élevée plus longtemps.",
  FORCE1: "Force pure et puissance : socle athlétique transférable aux stations.",
  FORCE2: "Séance fonctionnelle : stations Hyrox et course compromise en conditions de course.",
  RAMEUR: "Intervalles rameur pour la puissance et l'endurance spécifique du 1000m.",
  SKI: "Intervalles ski erg : moteur cardio et chaîne de tirage haut du corps.",
};

export function variantCount(type: SessionType): number {
  return VARIANTS[type].length;
}

export function variantMeta(type: SessionType, index: number): { name: string; focus: string } {
  const v = VARIANTS[type][((index % VARIANTS[type].length) + VARIANTS[type].length) % VARIANTS[type].length];
  return { name: v.name, focus: v.focus };
}

export interface GetSessionOptions {
  week?: number;
  phaseIndex?: number;
  variantIndex?: number;
  customWork?: SessionBlock[];
}

export function getSession(
  type: SessionType,
  difficulty: Difficulty,
  opts: GetSessionOptions = {}
): SessionConfig {
  _id = 0;
  const week = opts.week ?? 0;
  const phaseIndex = opts.phaseIndex ?? Math.floor(week / 4) % 4;
  const variants = VARIANTS[type];
  const variantIndex = ((opts.variantIndex ?? week % variants.length) % variants.length + variants.length) % variants.length;
  const variant = variants[variantIndex];
  const p = progFor(week, phaseIndex);

  const category = categoryOf(type);
  const work = opts.customWork && opts.customWork.length > 0 ? opts.customWork : variant.build(difficulty, p).filter(Boolean);
  const blocks = [...warmup(category), ...work, ...cooldown(category)];

  const durAdjust = Math.round(p.bump * 3) - (p.deload ? Math.round(BASE_DURATION[type][difficulty] * 0.35) : 0);
  const progression = p.deload
    ? "Semaine Deload : volume réduit ~40%, technique parfaite, récup prioritaire."
    : `Bloc ${p.meso + 1} · objectif : dépasser tes chiffres de la même séance il y a ${variants.length} semaines (charge, allure ou tours).`;

  return {
    type,
    difficulty,
    blocks,
    xpReward: XP_BY_DIFFICULTY[difficulty],
    estimatedDuration: Math.max(35, BASE_DURATION[type][difficulty] + durAdjust),
    variantIndex,
    variantName: variant.name,
    focus: variant.focus,
    progression,
    weekNumber: week,
  };
}

export function xpForDifficulty(difficulty: Difficulty): number {
  return XP_BY_DIFFICULTY[difficulty];
}
