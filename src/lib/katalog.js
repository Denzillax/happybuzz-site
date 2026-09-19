// ═══════════════════════════════════════════════════════════════
// KLAR-Designsystem (Ricardo-inspiriert, seit 24.08.2026).
// Frueherer Katalog-Look (eckig, Ink-Rahmen, Space Mono, Versatzschatten)
// ist abgeloest. Vokabular:
//   · Flaechen weiss, Panels #F5F6F8, Karten mit Hairline #E5E8EC
//   · Ecken weich (radius 10), Schatten weich und sparsam
//   · Labels: Manrope, Grossbuchstaben, dezentes Letter-Spacing
//   · Primaerbutton Honey, rund; Fokus: Teal-Rahmen + weicher Ring
// Neue Styles importieren von HIER, nie lokal kopieren.
// ═══════════════════════════════════════════════════════════════

export const K = {
  ink: "#191615",
  sand: "#F5F6F8",
  paper: "#FFFFFF",
  honey: "#F4C03F",
  petrol: "#0B5E5C",
  moss: "#50804F",
  muted: "rgba(20,17,13,0.6)",
};

export const MONO = "'Manrope', sans-serif";
export const HEAD = "'General Sans', sans-serif";
export const BODY = "'Manrope', sans-serif";

// Karten (Login: Formular-Panel)
export const card = {
  background: K.paper,
  border: "1px solid #E5E8EC",
  borderRadius: 10,
  boxShadow: "0 2px 10px rgba(25,22,21,.08)",
};

// Karten ohne Schatten (Listenzeilen, verschachtelte Flaechen)
export const cardFlat = {
  background: "#fff",
  border: "1px solid #E5E8EC",
  borderRadius: 10,
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
  borderRadius: 10,
  border: "1px solid #E5E8EC",
  background: "#fff",
  fontSize: 15,
  fontFamily: BODY,
  color: K.ink,
  outline: "none",
  boxSizing: "border-box",
};
export const inputFocus = {
  border: "1.5px solid #007C7C",
  boxShadow: "0 0 0 3px rgba(0,124,124,.15)",
};

// Primaerbutton (Login: "Anmelden")
export const btnPrimary = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 10,
  border: "1px solid #E5E8EC",
  background: K.honey,
  color: K.ink,
  fontSize: 15,
  fontWeight: 800,
  fontFamily: BODY,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(25,22,21,.15)",
};

// Sekundaerbutton (Login: Google/Apple)
export const btnSecondary = {
  padding: "11px 16px",
  borderRadius: 10,
  border: "1px solid #E5E8EC",
  background: "#fff",
  color: K.ink,
  fontSize: 14,
  fontWeight: 700,
  fontFamily: BODY,
  cursor: "pointer",
};
