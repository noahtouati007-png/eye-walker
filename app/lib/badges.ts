import type { Badge } from "./types";

type BadgeDef = Omit<Badge, "unlocked" | "unlockedAt">;

export const BADGE_DEFS: BadgeDef[] = [
  // ----- Visible -----
  { id: "premier-pas", name: "Premier Pas", description: "Première séance complétée.", icon: "👣", hidden: false },
  { id: "semaine-parfaite", name: "Semaine Parfaite", description: "7/7 séances dans une semaine.", icon: "💎", hidden: false },
  { id: "iron-will", name: "Iron Will", description: "30 séances complétées au total.", icon: "🛡️", hidden: false },
  { id: "vma-machine", name: "VMA Machine", description: "10 séances VMA complétées.", icon: "⚡", hidden: false },
  { id: "sled-dog", name: "Sled Dog", description: "10 séances Hyrox Force complétées (Force 1 + Force 2).", icon: "🛷", hidden: false },
  { id: "rower", name: "Rower", description: "10 séances Rameur complétées.", icon: "🚣", hidden: false },
  { id: "ski-master", name: "Ski Master", description: "10 séances Ski Erg complétées.", icon: "🎿", hidden: false },
  { id: "zone2-master", name: "Zone 2 Master", description: "20 séances EF complétées.", icon: "🫀", hidden: false },
  { id: "seuil-breaker", name: "Seuil Breaker", description: "5 séances Seuil complétées en Hard.", icon: "🌋", hidden: false },
  { id: "peak-performer", name: "Peak Performer", description: "Terminer une semaine Peak complète.", icon: "⛰️", hidden: false },
  { id: "recuperation-sage", name: "Récupération Sage", description: "Compléter une semaine Deload complète.", icon: "🧘", hidden: false },
  { id: "eye-walker-legend", name: "Eye-Walker Legend", description: "Atteindre le niveau 7.", icon: "👁️", hidden: false },
  { id: "serie-de-feu", name: "Série de Feu", description: "7 jours consécutifs d'entraînement.", icon: "🔥", hidden: false },
  { id: "inarretable", name: "Inarrêtable", description: "21 jours consécutifs d'entraînement.", icon: "🚀", hidden: false },
  { id: "centurion", name: "Centurion", description: "100 séances complétées.", icon: "🏛️", hidden: false },
  // ----- Hidden -----
  { id: "ghost-mode", name: "Ghost Mode", description: "Compléter une séance à 23h ou après.", icon: "👻", hidden: true },
  { id: "early-bird", name: "Early Bird", description: "Compléter une séance avant 6h du matin.", icon: "🐦", hidden: true },
  { id: "no-pain-no-gain", name: "No Pain No Gain", description: "5 séances Hard consécutives.", icon: "😤", hidden: true },
  { id: "perfectionniste", name: "Perfectionniste", description: "Modifier et personnaliser 10 séances.", icon: "🎯", hidden: true },
  { id: "eye-of-the-storm", name: "Eye of the Storm", description: "Compléter les 4 phases d'un cycle complet (16 semaines).", icon: "🌀", hidden: true },
];

export function createBadges(): Record<string, Badge> {
  const record: Record<string, Badge> = {};
  for (const def of BADGE_DEFS) {
    record[def.id] = { ...def, unlocked: false };
  }
  return record;
}
