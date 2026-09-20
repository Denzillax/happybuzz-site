// ═══════════════════════════════════════════════════════════════
// BEEDARO Design Tokens — Single Source of Truth
// Regel seit dem Meeko-Design (20.09.2026): Ink = alles Klickbare (frueher Teal), Pastell = Flaechen, Red = Dringlichkeit.
// Die Schluessel teal/tealDark heissen weiter so, damit kein Aufrufer bricht, tragen aber Ink.
// ═══════════════════════════════════════════════════════════════

export const colors = {
  // Brand (Gold = nur Marke, Logo, Featured) — Werte gemäß Brand-Spec (CLAUDE.md)
  yellow:     "#F4C03F",   // seit dem Meeko-Design nur noch für Sterne und Spiele. Flächen: butter, Schrift und Rahmen: dark
  butter:     "#FFE7A9",
  yellowSoft: "#FFF5D8",
  yellowHover:"#D9A005",
  yellowLight:"#FFF5D8",
  yellowDark: "#D9A005",

  // CTA (Teal = alles Klickbare)
  teal:       "#1D1D1D",
  tealDark:   "#1D1D1D",

  // Natur-Grün (Bee-Impact, Gratis, Naturschutz) — Brand-Spec #50804F.
  // NICHT mit `green` verwechseln: das ist ein Legacy-Alias auf Teal (s.u.).
  nature:     "#50804F",
  natureSoft: "#EAF1E9",

  // Signal (Red = Dringlichkeit, Badges, Alerts)
  red:        "#C62828",
  redSoft:    "#FFEBEE",

  // Text
  dark:       "#1D1D1D",
  graphite:   "#34343B",
  muted:      "#5B626C",
  mutedLt:    "#686E78",

  // Surface
  cream:      "#F5F6F8",   // Off-White-Tint (Panels, Chips, Hover) auf weisser Seite — ersetzt frühere Sand-Fläche
  surface:    "#FFFFFF",
  warm:       "#F5F6F8",
  cloud:      "#F5F6F8",

  // Borders
  border:     "#1D1D1D",          // Rahmen rundum: 1 px Ink (Meeko)
  borderLt:   "rgba(29,29,29,.16)", // Trennlinien und leise Flächen

  // Info
  sky:        "#6BA9FF",
  skySoft:    "#EBF3FF",

  // Legacy aliases (backward compat) — ACHTUNG: green = Teal (für Verifiziert/
  // Erfolg). Für echtes Natur-Grün `nature`/`natureSoft` nutzen.
  green:      "#50804F",
  greenSoft:  "#DBF5F0",
  blue:       "#6BA9FF",
  blueSoft:   "#EBF3FF",
};

export const fonts = {
  head: "'Instrument Sans', 'General Sans', 'Inter', system-ui, sans-serif",
  body: "'Instrument Sans', 'Manrope', system-ui, sans-serif",
};

// Klar-Look (Ricardo-inspiriert): weiche Rundungen statt eckigem Katalog.
// full bleibt fuer Kreise (Avatare, Punkte) erhalten.
export const radius = {
  sm: 12,  // kleine Kästen (Foto-Plätze, Hinweise), vorher 8
  md: 20,   // Karten und Boxen einheitlich 20 (Meeko, 20.09.2026)
  lg: 20,
  xl: 20,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const shadows = {
  sm:   "none", // Meeko: Karten haben einen Rand statt eines Schattens
  md:   "none",
  lg:   "0 8px 30px rgba(0,0,0,.1)",
  card:      "none",   // dezenter Dauer-Schatten (Karten-Ruhezustand)
  cardHover: "none",  // Hover-Lift
};

export const T = { ...colors, ...fonts, ...radius, ...spacing };
