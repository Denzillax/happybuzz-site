// ═══════════════════════════════════════════════════════════════
// KATALOG-Designsystem — kanonische Referenz ist die LOGIN-SEITE
// (src/app/login/page.jsx). Entscheid vom 16.08.2026: dieser Look gilt
// ueberall, oeffentlich wie eingeloggt.
//
// Vokabular der Referenz:
//   · Seitenhintergrund SAND, Karten PAPER mit 1px-INK-Rahmen, ECKIG (radius 0)
//   · harter Versatzschatten statt Weichzeichner
//   · Labels/Eyebrows/Tab-Beschriftungen: Space Mono, Grossbuchstaben
//   · Inputs eckig, 1.5px INK, Fokus: Petrol-Rahmen + Honey-Versatzschatten
//   · Primaerbutton Honey, eckig, Versatzschatten in INK
//
// Frueher hatte jede Seite ihre eigene K-Kopie dieser Werte — genau daraus
// entstand die Drift ("ueberall ein wenig anders"). Neue Styles importieren
// von HIER, nie lokal kopieren.
// ═══════════════════════════════════════════════════════════════

export const K = {
  ink: "#14110D",
  sand: "#F9F4EC",
  paper: "#FBF8F2",
  honey: "#F4C03F",
  petrol: "#0B5E5C",
  moss: "#5B8C5A",
  muted: "rgba(20,17,13,0.6)",
};

export const MONO = "'Space Mono', monospace";
export const HEAD = "'General Sans', sans-serif";
export const BODY = "'Manrope', sans-serif";

// Karten (Login: Formular-Panel)
export const card = {
  background: K.paper,
  border: `1px solid ${K.ink}`,
  borderRadius: 0,
  boxShadow: "8px 8px 0 rgba(20,17,13,.12)",
};

// Karten ohne Schatten (Listenzeilen, verschachtelte Flaechen)
export const cardFlat = {
  background: "#fff",
  border: `1px solid ${K.ink}`,
  borderRadius: 0,
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
  borderRadius: 0,
  border: `1.5px solid ${K.ink}`,
  background: "#fff",
  fontSize: 15,
  fontFamily: BODY,
  color: K.ink,
  outline: "none",
  boxSizing: "border-box",
};
export const inputFocus = {
  border: `1.5px solid ${K.petrol}`,
  boxShadow: `3px 3px 0 ${K.honey}`,
};

// Primaerbutton (Login: "Anmelden")
export const btnPrimary = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 0,
  border: `1.5px solid ${K.ink}`,
  background: K.honey,
  color: K.ink,
  fontSize: 15,
  fontWeight: 800,
  fontFamily: BODY,
  cursor: "pointer",
  boxShadow: `3px 3px 0 ${K.ink}`,
};

// Sekundaerbutton (Login: Google/Apple)
export const btnSecondary = {
  padding: "11px 16px",
  borderRadius: 0,
  border: `1.5px solid ${K.ink}`,
  background: "#fff",
  color: K.ink,
  fontSize: 14,
  fontWeight: 700,
  fontFamily: BODY,
  cursor: "pointer",
};
