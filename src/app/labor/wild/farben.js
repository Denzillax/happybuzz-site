// Farben der neuen Frontseite, einzige Quelle für alles, was in JavaScript zeichnet (Pixelfeld, Biene, Balken).
// Dieselben Werte stehen als CSS-Variablen (--wl-*) in globals.css unter WILD-LABOR. Wer eine Farbe ändert, ändert beide.
// Regeln: Ink trägt Schrift, Logo und Knöpfe. Zitrone ist die Markenfarbe für Flächen (auf Weiss nie als kleine
// Schrift oder feines Zeichen, dafür gibt es Honig). Blau, Violett, Lime, Rot und Navy sind Akzente: Sie kennzeichnen
// die fünf Formate und färben das Pixelfeld, sonst nichts.
export const FARBEN = {
  ink: "#0A0A0A",
  zitrone: "#FBF062", // Markenfarbe, nur für Flächen
  honig: "#F5C518",   // Gelb für kleine Zeichen auf Weiss (Biene, Smiley, Festpreis-Marke)
  blau: "#3B5BD9",
  lila: "#6C4CF1",
  lime: "#D8FF00",
  limeDunkel: "#9BC400", // Lime für feine Linien auf Weiss
  rot: "#E0492A",
  navy: "#1C2541",
};
// Farbe pro Inserattyp, für Linien und Marken auf weissem Grund
export const TYPFARBE = { sell: FARBEN.honig, auction: FARBEN.blau, rent: FARBEN.lila, free: FARBEN.limeDunkel, service: FARBEN.rot };
