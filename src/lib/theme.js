// ═══════════════════════════════════════════════════════════════
// BEEDARO Design Tokens — Single Source of Truth
// Regel: Gold = nur Marke/Logo, Teal = alles Klickbare, Red = Dringlichkeit
// ═══════════════════════════════════════════════════════════════

export const colors = {
  // Brand (Gold = nur Marke, Logo, Featured) — Werte gemäß Brand-Spec (CLAUDE.md)
  yellow:     "#F4C03F",
  yellowSoft: "#FFF5D8",
  yellowHover:"#D9A005",
  yellowLight:"#FFF5D8",
  yellowDark: "#D9A005",

  // CTA (Teal = alles Klickbare)
  teal:       "#0E9493",
  tealDark:   "#0A7170",

  // Natur-Grün (Bee-Impact, Gratis, Naturschutz) — Brand-Spec #5B8C5A.
  // NICHT mit `green` verwechseln: das ist ein Legacy-Alias auf Teal (s.u.).
  nature:     "#5B8C5A",
  natureSoft: "#EAF1E9",

  // Signal (Red = Dringlichkeit, Badges, Alerts)
  red:        "#EB5E55",
  redSoft:    "#FFF0F0",

  // Text
  dark:       "#191615",
  graphite:   "#34343B",
  muted:      "#757575",
  mutedLt:    "#9E9E9E",

  // Surface
  cream:      "#F9F4EC",
  surface:    "#FFFFFF",
  warm:       "#F9F4EC",
  cloud:      "#F9F4EC",

  // Borders
  border:     "#E2E2E2",
  borderLt:   "#EEEEEE",

  // Info
  sky:        "#6BA9FF",
  skySoft:    "#EBF3FF",

  // Legacy aliases (backward compat) — ACHTUNG: green = Teal (für Verifiziert/
  // Erfolg). Für echtes Natur-Grün `nature`/`natureSoft` nutzen.
  green:      "#0E9493",
  greenSoft:  "#E6F5F5",
  blue:       "#6BA9FF",
  blueSoft:   "#EBF3FF",
};

export const fonts = {
  head: "'General Sans', 'Inter', system-ui, sans-serif",
  body: "'Manrope', system-ui, sans-serif",
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 26,
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
  sm:   "0 2px 8px rgba(0,0,0,.04)",
  md:   "0 4px 16px rgba(0,0,0,.06)",
  lg:   "0 8px 30px rgba(0,0,0,.1)",
  card:      "0 4px 16px rgba(0,0,0,.05)",   // dezenter Dauer-Schatten (Karten-Ruhezustand)
  cardHover: "0 10px 30px rgba(0,0,0,.10)",  // Hover-Lift
};

export const T = { ...colors, ...fonts, ...radius, ...spacing };
