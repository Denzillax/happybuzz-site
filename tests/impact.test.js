import { describe, it, expect } from "vitest";
import { nextMilestone, IMPACT_MILESTONES } from "@/lib/impact";

describe("nextMilestone (Bee-Impact Meilenstein-Leiter)", () => {
  it("startet bei der ersten Stufe mit prev 0", () => {
    expect(nextMilestone(0)).toEqual({ name: "Blühwiese (5 m²)", target: 250, prev: 0, reached: false });
  });

  it("springt bei exakt erreichter Stufe zur nächsten", () => {
    const m = nextMilestone(250);
    expect(m.target).toBe(500);
    expect(m.prev).toBe(250);
    expect(m.reached).toBe(false);
  });

  it("liefert korrekte Segment-Grenzen mitten in der Leiter", () => {
    const m = nextMilestone(700);
    expect(m.target).toBe(1500);
    expect(m.prev).toBe(500);
  });

  it("meldet reached, wenn die letzte Stufe erreicht ist", () => {
    const last = IMPACT_MILESTONES[IMPACT_MILESTONES.length - 1];
    const m = nextMilestone(last.at);
    expect(m.reached).toBe(true);
    expect(m.target).toBe(last.at);
    expect(m.prev).toBe(last.at);
  });

  it("behandelt ungültige Eingaben als 0", () => {
    expect(nextMilestone("abc").target).toBe(250);
    expect(nextMilestone(undefined).target).toBe(250);
  });
});
