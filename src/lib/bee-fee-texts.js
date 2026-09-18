// ═══════════════════════════════════════════════════════════════
// BEE-FEE TEXTE: 5 pro Stufe, rotierend (kurz, trocken, ohne Wirkungsversprechen)
// Default: impact (7%)
// ═══════════════════════════════════════════════════════════════

export const BEE_FEE_TEXTS = {
  // Neu geschrieben am 19.09.2026. Vorher standen hier 100 Sprüche wie "Du rettest ein
  // Ökosystem" oder "Ein ganzer Kanton profitiert". Das war öko-romantisch (laut
  // Markenregeln ausdrücklich nicht gewollt) und sachlich falsch: bei einem Verkauf für
  // CHF 40 gehen 56 Rappen in den Topf. Der echte Betrag steht im Formular direkt daneben,
  // diese Zeilen kommentieren nur die Stufe. Keine Wirkungsversprechen.
  fair: [
    "Das Minimum. Geht auch.",
    "Klein, aber nicht nichts.",
    "Ein Anfang.",
    "Sparsam. Die Bienen nehmen es trotzdem.",
    "Wenig Gebühr, wenig Beitrag. Fair eben.",
  ],
  supporter: [
    "Solider Beitrag.",
    "Etwas mehr für den Topf.",
    "Mehr als das Minimum. Danke.",
    "Ein ordentlicher Anteil für den Bienenschutz.",
    "Das merkt man schon.",
  ],
  impact: [
    "Der Standard. Gut gewählt.",
    "Spürbar mehr für Schweizer Bienenschutz.",
    "Guter Mittelweg zwischen Erlös und Beitrag.",
    "Damit lässt sich etwas anfangen.",
    "Ein Fünftel davon geht direkt in Projekte.",
  ],
  hero: [
    "Das Maximum. Respekt.",
    "Mehr geht nicht.",
    "Grosszügig. Die Platzierung dankt es dir auch.",
    "Der grösste Anteil für den Bienenschutz.",
    "Volle Stufe.",
  ],
};

// Zufälligen Text für eine Stufe holen
export function getRandomBeeText(tier) {
  const texts = BEE_FEE_TEXTS[tier];
  if (!texts || texts.length === 0) return "";
  return texts[Math.floor(Math.random() * texts.length)];
}

// Alle 4 Texte auf einmal (für die Auswahl-UI)
export function getRandomBeeTexts() {
  return {
    fair: getRandomBeeText("fair"),
    supporter: getRandomBeeText("supporter"),
    impact: getRandomBeeText("impact"),
    hero: getRandomBeeText("hero"),
  };
}

// Untertitel pro Stufe (statisch)
export const BEE_FEE_SUBTITLES = {
  fair: "Die kleinste Gebühr, der kleinste Beitrag.",
  supporter: "Etwas mehr Gebühr, etwas mehr für den Bienenschutz.",
  impact: "Der Standard: guter Beitrag, gute Platzierung.",
  hero: "Der grösste Beitrag und die beste Platzierung.",
};

// Partner-Organisationen (für spätere Anzeige)
export const BEE_PARTNERS = [
  { name: "FreeTheBees", url: "https://freethebees.ch", focus: "Wilde Honigbienen, Zeidlerei, BeeMapping" },
  { name: "BienenSchweiz", url: "https://bienen.ch", focus: "Blühflächen, Imkerförderung" },
  { name: "WildBee.ch", url: "https://wildbee.ch", focus: "Wildbienen, natürliche Nistplätze" },
  { name: "NimS", url: "https://natur-im-siedlungsraum.ch", focus: "Wildbienen in Städten" },
  { name: "ProSpecieRara", url: "https://prospecierara.ch", focus: "Genetische Vielfalt, Artenschutz" },
];
