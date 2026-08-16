// ═══════════════════════════════════════════════════════════════
// IBAN — eine Quelle für Eingabe, Formatierung und Prüfung.
// BEEDARO zahlt in CHF über Schweizer QR-Rechnungen aus, darum sind
// nur CH- und LI-IBANs (21 Zeichen) erlaubt.
// ═══════════════════════════════════════════════════════════════

export const IBAN_LENGTH = 21;

// Eingabe säubern: Grossbuchstaben, nur A-Z/0-9, hart auf 21 Zeichen gekappt.
// Damit kann niemand "irgendetwas ganz Langes" einfügen.
export function normalizeIban(v) {
  return (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, IBAN_LENGTH);
}

// Anzeige/Eingabe in 4er-Blöcken: CH93 0076 2011 6238 5295 7
export function formatIban(v) {
  return normalizeIban(v).replace(/(.{4})/g, "$1 ").trim();
}

// Vollständige Prüfung: Land CH/LI, exakt 21 Zeichen, mod-97-Prüfsumme (ISO 13616).
export function isValidIban(v) {
  const s = normalizeIban(v);
  if (s.length !== IBAN_LENGTH) return false;
  if (!/^(CH|LI)\d{2}[0-9A-Z]{17}$/.test(s)) return false;
  const rearranged = s.slice(4) + s.slice(0, 4);
  let rem = 0;
  for (const ch of rearranged) {
    const val = ch >= "0" && ch <= "9" ? ch : String(ch.charCodeAt(0) - 55);
    for (const d of val) rem = (rem * 10 + (d.charCodeAt(0) - 48)) % 97;
  }
  return rem === 1;
}
