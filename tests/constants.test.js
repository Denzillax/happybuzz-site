import { describe, it, expect } from "vitest";
import {
  BEE_LEVELS, getBeeLevel, getBeeLevelProgress, getNextBeeLevel,
  FEE_TIERS, BEE_IMPACT_RATE, CONDITION_LABELS, CONDITIONS,
} from "@/lib/constants";

describe("Bee-Level (Gamification-Stufen)", () => {
  it("ordnet Grenzwerte den richtigen Stufen zu", () => {
    expect(getBeeLevel(0).key).toBe("starter");
    expect(getBeeLevel(9.99).key).toBe("starter");
    expect(getBeeLevel(10).key).toBe("busy_bee");
    expect(getBeeLevel(50).key).toBe("hive_builder");
    expect(getBeeLevel(150).key).toBe("queen");
    expect(getBeeLevel(500).key).toBe("legend");
    expect(getBeeLevel(999999).key).toBe("legend");
  });
  it("behandelt ungültige Werte als 0", () => {
    expect(getBeeLevel(undefined).key).toBe("starter");
    expect(getBeeLevel("abc").key).toBe("starter");
  });
  it("berechnet den Fortschritt im Segment (0 bis 100)", () => {
    expect(getBeeLevelProgress(0)).toBe(0);
    expect(getBeeLevelProgress(5)).toBe(50);   // Starter: 0-10
    expect(getBeeLevelProgress(600)).toBe(100); // Legend: max = Infinity
  });
  it("kennt die nächste Stufe und endet bei Legend", () => {
    expect(getNextBeeLevel(0).key).toBe("busy_bee");
    expect(getNextBeeLevel(600)).toBeNull();
  });
  it("Stufen sind lückenlos aufsteigend", () => {
    for (let i = 1; i < BEE_LEVELS.length; i++) {
      expect(BEE_LEVELS[i].min).toBe(BEE_LEVELS[i - 1].max);
    }
  });
});

describe("Gebührenmodell (Bee-Rate)", () => {
  it("bietet exakt die vier Stufen 3/5/7/10", () => {
    expect(FEE_TIERS.map(t => t.pct)).toEqual([3, 5, 7, 10]);
  });
  it("Bee-Impact ist immer 20% der Gebühr", () => {
    expect(BEE_IMPACT_RATE).toBe(0.2);
  });
});

describe("Zustands-Labels", () => {
  it("mappt DB-Enum auf deutsche Labels", () => {
    expect(CONDITION_LABELS.like_new).toBe("Wie neu");
    expect(CONDITION_LABELS.new).toBe("Neu");
    expect(CONDITIONS).toHaveLength(5);
  });
});
