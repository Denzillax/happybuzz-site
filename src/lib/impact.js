// Meilenstein-Leiter für den Bee-Impact-Fortschritt (CHF bezahlt). Editierbar.
export const IMPACT_MILESTONES = [
  { at: 250,   name: "Blühwiese (5 m²)" },
  { at: 500,   name: "Wildbienenhotel" },
  { at: 1500,  name: "Streuobstwiese" },
  { at: 5000,  name: "Bienenweide (1 ha)" },
  { at: 10000, name: "Naturschutz-Fonds" },
];

// Nächste unerreichte Stufe + Vorgänger-Schwelle (Basis des Segment-Fortschritts).
export function nextMilestone(geflossen) {
  const g = Number(geflossen) || 0;
  const idx = IMPACT_MILESTONES.findIndex((m) => m.at > g);
  if (idx === -1) {
    const last = IMPACT_MILESTONES[IMPACT_MILESTONES.length - 1];
    return { name: last.name, target: last.at, prev: last.at, reached: true };
  }
  return {
    name: IMPACT_MILESTONES[idx].name,
    target: IMPACT_MILESTONES[idx].at,
    prev: idx === 0 ? 0 : IMPACT_MILESTONES[idx - 1].at,
    reached: false,
  };
}
