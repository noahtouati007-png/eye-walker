export const WEEKLY_CHALLENGES: string[] = [
  "Cumule 35km de course cette semaine",
  "Complète les 2 séances Hyrox en difficulté Hard",
  "Semaine parfaite — aucune séance manquée (7/7)",
  "Bats ton record personnel sur 500m rameur",
  "3 séances de course sur 5 jours consécutifs",
  "Complète la séance VMA avec toutes les répétitions en Hard",
  "Cumule 2h d'ergo total (rameur + ski) dans la semaine",
  "Séance Seuil complète + séance EF le lendemain",
  "Semaine Peak complète sans modifier les séances",
  "Complete toutes les séances en utilisant le timer intégré",
  "Enchaîne 3 séances Hard sur 3 jours consécutifs",
  "Bilan : note tes 3 progrès majeurs depuis la semaine 1",
];

export const CHALLENGE_XP = 300;

export function challengeForIndex(index: number): string {
  return WEEKLY_CHALLENGES[((index % 12) + 12) % 12];
}
