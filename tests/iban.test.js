import { describe, it, expect } from "vitest";
import { normalizeIban, formatIban, isValidIban, IBAN_LENGTH } from "../src/lib/iban";

// CH93 0076 2011 6238 5295 7 ist die offizielle Beispiel-IBAN (gueltige Pruefsumme).
const GUELTIG = "CH9300762011623852957";

describe("iban", () => {
  it("normalisiert: Grossbuchstaben, keine Sonderzeichen, hart auf 21 gekappt", () => {
    expect(normalizeIban("ch93 0076-2011.6238 5295 7")).toBe(GUELTIG);
    expect(normalizeIban(GUELTIG + "9999999999999999")).toHaveLength(IBAN_LENGTH);
    expect(normalizeIban("<script>alert(1)</script>" )).toBe("SCRIPTALERT1SCRIPT");
    expect(normalizeIban("")).toBe("");
    expect(normalizeIban(null)).toBe("");
  });

  it("formatiert in 4er-Bloecken", () => {
    expect(formatIban(GUELTIG)).toBe("CH93 0076 2011 6238 5295 7");
    expect(formatIban("ch930076")).toBe("CH93 0076");
  });

  it("akzeptiert nur CH/LI mit korrekter Pruefsumme", () => {
    expect(isValidIban(GUELTIG)).toBe(true);
    expect(isValidIban("CH93 0076 2011 6238 5295 7")).toBe(true);
    expect(isValidIban("LI21 0881 0000 2324 013A A")).toBe(true);   // offizielles LI-Beispiel
    expect(isValidIban("CH9300762011623852958")).toBe(false);        // Pruefsumme kaputt
    expect(isValidIban("DE89370400440532013000")).toBe(false);       // falsches Land
    expect(isValidIban("CH93")).toBe(false);                         // zu kurz
    expect(isValidIban("")).toBe(false);
  });
});
