import { describe, it, expect } from "vitest";
import { buildSwissQR, splitStreet, feeQrPayload } from "../src/lib/swissQR";

// Banken verarbeiten kombinierte Adressen (Typ K) nur noch bis 30.09.2026;
// der Payload MUSS strukturierte Adressen (Typ S) liefern.
describe("swissQR strukturiert", () => {
  const basis = {
    iban: "CH9300762011623852957", name: "MOQRO by Denis Mihaljevic",
    street: "Gemeindehausstrasse 11B", postalCode: "6010", city: "Kriens",
    amount: "42.00", currency: "CHF",
    dName: "Max Muster", dStreet: "Teststrasse 5", dPostalCode: "8000", dCity: "Zürich",
    message: "Gebuehren FEE-2026-08-XXXXXX",
  };

  it("trennt Strasse und Hausnummer", () => {
    expect(splitStreet("Gemeindehausstrasse 11B")).toEqual(["Gemeindehausstrasse", "11B"]);
    expect(splitStreet("Rue de la Gare 3")).toEqual(["Rue de la Gare", "3"]);
    expect(splitStreet("Postfach")).toEqual(["Postfach", ""]);
    expect(splitStreet("")).toEqual(["", ""]);
  });

  it("nutzt Typ S und enthaelt kein K mehr", () => {
    const zeilen = buildSwissQR(basis).split("\r\n");
    expect(zeilen[0]).toBe("SPC");
    expect(zeilen[1]).toBe("0200");
    expect(zeilen[4]).toBe("S");            // Creditor AdrTp
    expect(zeilen).not.toContain("K");
  });

  it("Creditor strukturiert: Strasse, Nr, PLZ, Ort getrennt", () => {
    const z = buildSwissQR(basis).split("\r\n");
    expect(z.slice(4, 11)).toEqual(["S", "MOQRO by Denis Mihaljevic", "Gemeindehausstrasse", "11B", "6010", "Kriens", "CH"]);
  });

  it("Debtor strukturiert; ohne Debtor bleiben alle 7 Felder leer", () => {
    const mit = buildSwissQR(basis).split("\r\n");
    expect(mit.slice(20, 27)).toEqual(["S", "Max Muster", "Teststrasse", "5", "8000", "Zürich", "CH"]);
    const ohne = buildSwissQR({ ...basis, dName: "" }).split("\r\n");
    expect(ohne.slice(20, 27)).toEqual(["", "", "", "", "", "", ""]);
  });

  it("endet mit NON / Nachricht / EPD und hat 31 Zeilen", () => {
    const z = buildSwissQR(basis).split("\r\n");
    expect(z).toHaveLength(31);
    expect(z[27]).toBe("NON");
    expect(z[29]).toBe("Gebuehren FEE-2026-08-XXXXXX");
    expect(z[30]).toBe("EPD");
  });

  it("feeQrPayload verweigert ohne echte IBAN (kein Platzhalter-Zahlteil)", () => {
    expect(feeQrPayload({ total_fees: 10, invoice_ref: "X" }, {}, {})).toBeNull();
    expect(feeQrPayload({ total_fees: 10, invoice_ref: "X" }, {}, { name: "BEEDARO", iban: "" })).toBeNull();
    // alter Platzhalter hat eine kaputte Pruefsumme -> ebenfalls kein QR
    expect(feeQrPayload({ total_fees: 10, invoice_ref: "X" }, {}, { name: "BEEDARO", iban: "CH1234567890123456789" })).toBeNull();
    // gueltige IBAN -> QR kommt
    expect(feeQrPayload({ total_fees: 10, invoice_ref: "X" }, {}, { name: "BEEDARO", iban: "CH9300762011623852957", street: "Weg 1", postal_code: "6010", city: "Kriens" })).toContain("SPC");
  });
});
