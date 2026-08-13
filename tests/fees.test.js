import { describe, it, expect } from "vitest";
import { makeArtRef, makeBeeRef, makeFeeRef, parseArtRef, artIdRange, artRefMatches, calcFee, calcBeeImpact } from "@/lib/fees";
import { FEE_TIERS, BEE_IMPACT_RATE, DEFAULT_FEE_TIER, DEFAULT_FEE_PERCENT } from "@/lib/constants";

// Regressionsschutz: Standard-Bee-Rate war frueher an fuenf Stellen unterschiedlich
// hinterlegt (fees.js 5%, Formular 7%, DB-Default supporter). Diese Tests halten
// Code und DB-Default auf demselben Tarif.
describe("Standard-Bee-Rate (eine Quelle der Wahrheit)", () => {
  it("DEFAULT_FEE_PERCENT entspricht dem Prozentsatz von DEFAULT_FEE_TIER", () => {
    const tier = FEE_TIERS.find((t) => t.tier === DEFAULT_FEE_TIER);
    expect(tier).toBeDefined();
    expect(DEFAULT_FEE_PERCENT).toBe(tier.pct);
  });

  it("Standard ist Impact / 7% (muss mit dem DB-Default von listings uebereinstimmen)", () => {
    expect(DEFAULT_FEE_TIER).toBe("impact");
    expect(DEFAULT_FEE_PERCENT).toBe(7);
  });

  it("calcFee faellt ohne Satz auf die Standard-Bee-Rate zurueck, nicht auf einen Fremdwert", () => {
    expect(calcFee(100)).toBe(DEFAULT_FEE_PERCENT);
    expect(calcFee(100, null)).toBe(DEFAULT_FEE_PERCENT);
    expect(calcFee(100, 0)).toBe(DEFAULT_FEE_PERCENT);
  });

  it("Bee-Impact bleibt 20% der Gebuehr", () => {
    expect(BEE_IMPACT_RATE).toBe(0.2);
    expect(calcBeeImpact(calcFee(100, 10))).toBeCloseTo(2, 10);
  });
});

describe("makeArtRef / makeBeeRef (Referenznummern)", () => {
  it("bildet ART-Nr aus den ersten 8 Hex-Zeichen der UUID", () => {
    expect(makeArtRef("344bf4fd-fd72-431a-a168-77c938829b3e")).toBe("ART-344BF4FD");
  });
  it("übersteht leere Eingaben", () => {
    expect(makeArtRef(null)).toBe("ART-");
    expect(makeArtRef(undefined)).toBe("ART-");
  });
  it("bildet BEE-Nr analog", () => {
    expect(makeBeeRef("4216b88c-16df-4844-bc3c-2a3240d343a0")).toBe("BEE-4216B88C");
  });
});

describe("makeFeeRef (Monats- und Einzelreferenz)", () => {
  it("baut Monatsreferenz mit führender Null", () => {
    expect(makeFeeRef(2026, 6)).toBe("FEE-2026-06");
    expect(makeFeeRef(2026, 11)).toBe("FEE-2026-11");
  });
  it("baut Einzelreferenz aus UUID-Präfix", () => {
    expect(makeFeeRef("a1b2c3d4-0000-0000-0000-000000000000")).toBe("FEE-A1B2C3D4");
  });
});

describe("parseArtRef (Suche: Hijack-Schutz)", () => {
  it("akzeptiert ART-Präfix mit 4 bis 8 Hex", () => {
    expect(parseArtRef("ART-1A2B3C4D")).toBe("1a2b3c4d");
    expect(parseArtRef("art-1a2b")).toBe("1a2b");
    expect(parseArtRef("art1a2b")).toBe("1a2b"); // Bindestrich optional
  });
  it("akzeptiert nackte Eingaben NUR bei exakt 8 Hex", () => {
    expect(parseArtRef("1a2b3c4d")).toBe("1a2b3c4d");
    expect(parseArtRef("1a2b")).toBeNull(); // 4 Hex ohne Präfix: normale Suche
  });
  it("kapert keine normalen Suchbegriffe", () => {
    expect(parseArtRef("kamera")).toBeNull();
    expect(parseArtRef("velo 28 zoll")).toBeNull();
    expect(parseArtRef("")).toBeNull();
    expect(parseArtRef(null)).toBeNull();
  });
});

describe("artIdRange (UUID-Bereich aus Hex-Präfix)", () => {
  it("füllt Präfix auf 8 Zeichen und liefert lo/hi", () => {
    expect(artIdRange("344b")).toEqual({
      lo: "344b0000-0000-0000-0000-000000000000",
      hi: "344bffff-ffff-ffff-ffff-ffffffffffff",
    });
  });
  it("liefert null ohne Präfix", () => {
    expect(artIdRange("")).toBeNull();
    expect(artIdRange(null)).toBeNull();
  });
});

describe("artRefMatches (Teilstring im geladenen Bestand)", () => {
  it("findet Teilstrings der ART-Nr (case-insensitiv)", () => {
    expect(artRefMatches("344bf4fd-fd72-431a", "44bf")).toBe(true);
    expect(artRefMatches("344bf4fd-fd72-431a", "ART-344B")).toBe(true);
  });
  it("liefert false bei leerer Suche oder Nicht-Treffer", () => {
    expect(artRefMatches("344bf4fd-fd72-431a", "")).toBe(false);
    expect(artRefMatches("344bf4fd-fd72-431a", "zzzz")).toBe(false);
  });
});
