import { describe, it, expect } from "vitest";
import { bookingState, mahnText } from "@/lib/bookingStatus";

describe("mahnText", () => {
  it("Vermieter fragt nach der Rückgabe mit Datum", () => {
    expect(mahnText("owner", "Tromä", "2026-08-31"))
      .toBe('Hallo, die Rückgabe von "Tromä" war am 31. Aug. vereinbart. Wann bekomme ich sie zurück?');
  });
  it("Mieter meldet sich spät dran", () => {
    expect(mahnText("renter", "Tromä", "2026-08-31"))
      .toBe('Hallo, ich bin mit "Tromä" spät dran. Wann kann ich sie zurückbringen?');
  });
  it("ohne Titel steht das Inserat", () => {
    expect(mahnText("renter", null, "2026-08-31")).toContain('"dem Inserat"');
  });
});

describe("bookingState", () => {
  const heute = new Date(2026, 8, 24); // 24.09.2026
  it("bestätigte Miete mit Enddatum in der Vergangenheit ist überfällig", () => {
    const s = bookingState({ status: "confirmed", start_date: "2026-08-20", end_date: "2026-08-31", listing: { listing_type: "rent" }, purchase: { status: "delivered" } }, heute);
    expect(s.key).toBe("overdue");
    expect(s.ueberfaellig).toBe(24);
  });
  it("abgeschlossene Bestellung schliesst die Buchung", () => {
    const s = bookingState({ status: "confirmed", start_date: "2026-08-28", end_date: "2026-08-28", listing: { listing_type: "service" }, purchase: { status: "completed" } }, heute);
    expect(s.offen).toBe(false);
  });
});
