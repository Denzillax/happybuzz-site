// ═══════════════════════════════════════════════════════════════
// MEEKO-Designsystem (seit 20.09.2026, vorher KLAR seit 24.08.2026): 1 px Ink-Rand, Rundung 20, Pastellflaechen,
// keine Schlagschatten, Hauptknopf dunkel. Werte unten sind umgestellt, die Namen (sand, honey) sind geblieben.
// Frueherer Katalog-Look (eckig, Ink-Rahmen, Space Mono, Versatzschatten)
// ist abgeloest. Vokabular:
//   · Flaechen weiss, Panels #F3F3FF, Karten mit Hairline rgba(29,29,29,.16)
//   · Ecken weich (radius 10), Schatten weich und sparsam
//   · Labels: Manrope, Grossbuchstaben, dezentes Letter-Spacing
//   · Primaerbutton Honey, rund; Fokus: Teal-Rahmen + weicher Ring
// Neue Styles importieren von HIER, nie lokal kopieren.
// ═══════════════════════════════════════════════════════════════

export const K = {
  ink: "#1D1D1D",
  sand: "#F3F3FF",
  paper: "#FFFFFF",
  honey: "#FFE7A9", // Meeko: Butter. Das alte Gelb lebt nur noch in Sternen und Spielen
  petrol: "#1D1D1D",
  moss: "#50804F",
  muted: "rgba(29,29,29,0.6)",
};

export const MONO = "'Instrument Sans', 'Manrope', sans-serif";
export const HEAD = "'Instrument Sans', 'General Sans', sans-serif";
export const BODY = "'Instrument Sans', 'Manrope', sans-serif";

// Karten (Login: Formular-Panel)
export const card = {
  background: K.paper,
  border: "1px solid #1D1D1D",
  borderRadius: 20,
  boxShadow: "none",
};

// Karten ohne Schatten (Listenzeilen, verschachtelte Flaechen)
export const cardFlat = {
  background: "#fff",
  border: "1px solid #1D1D1D",
  borderRadius: 20,
};

// Mono-Grossbuchstaben (Labels "E-MAIL", Eyebrows, Tab-Beschriftungen)
export const monoLabel = {
  fontFamily: MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: K.ink,
};

// Eingabefelder
export const input = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #1D1D1D",
  background: "#fff",
  fontSize: 16,
  fontFamily: BODY,
  color: K.ink,
  outline: "none",
  boxSizing: "border-box",
};
export const inputFocus = {
  border: "1.5px solid #1D1D1D",
  boxShadow: "0 0 0 3px rgba(29,29,29,.16)",
};

// Primaerbutton (Login: "Anmelden")
export const btnPrimary = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 10,
  border: "1px solid #1D1D1D",
  background: "#DBF5F0", // Hauptknopf in Mint mit Ink-Rand (Denis 20.09.2026)
  color: "#1D1D1D",
  fontSize: 16,
  fontWeight: 600,
  fontFamily: BODY,
  cursor: "pointer",
  boxShadow: "inset 0 -4px 0 rgba(29,29,29,.16)",
};

// Sekundaerbutton (Login: Google/Apple)
export const btnSecondary = {
  padding: "11px 16px",
  borderRadius: 10,
  border: "1px solid #1D1D1D",
  background: "#fff",
  color: K.ink,
  fontSize: 14,
  fontWeight: 700,
  fontFamily: BODY,
  cursor: "pointer",
};
