// Einzige Quelle für den Zustand einer Buchung (Miete oder Service) aus Sicht der Buchungsseite.
//
// Hintergrund (Denis 24.09.2026): rental_bookings.status bleibt nach der Bestätigung für immer auf "confirmed",
// der eigentliche Ablauf (übergeben, Rückgabe markiert, abgeschlossen) läuft auf purchases.status. Die Seite
// zeigte darum alte Mieten noch als "Bestätigt", obwohl sie längst überfällig oder abgeschlossen waren.
// Darum wird der Zustand hier aus BEIDEN Quellen abgeleitet und die Buchung ist entweder "offen" oder "zu".
//
// Rückgabe: Ende einer Miete ist end_date (Tag der Rückgabe), bei einem Service der Wunschtermin (start_date).
// Überfällig heisst: der Tag ist vorbei und die Sache ist weder zurückgegeben noch abgeschlossen noch abgesagt.

const ZU_BUCHUNG = ["returned", "cancelled", "rejected"];

function tagDiff(datum, heute) {
  if (!datum) return null;
  const d = new Date(datum);
  if (isNaN(d)) return null;
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(heute.getFullYear(), heute.getMonth(), heute.getDate());
  return Math.round((b - a) / 86400000); // positiv = Datum liegt in der Vergangenheit
}

export function bookingState(b, heute = new Date()) {
  const ps = b.purchase?.status || null;
  const service = b.listing?.listing_type === "service";

  if (b.status === "cancelled" || b.status === "rejected" || ps === "cancelled") {
    return { key: "cancelled", label: "Abgesagt", offen: false, ueberfaellig: 0 };
  }
  if (b.status === "returned" || ps === "completed") {
    return { key: "done", label: service ? "Abgeschlossen" : "Zurückgegeben", offen: false, ueberfaellig: 0 };
  }
  if (b.status === "pending") {
    return { key: "pending", label: "Angefragt", offen: true, ueberfaellig: 0 };
  }
  if (ps === "return_pending") {
    return { key: "return_pending", label: "Rückgabe markiert", offen: true, ueberfaellig: 0 };
  }
  if (ps === "damage_reported" || ps === "disputed") {
    return { key: "problem", label: "Beanstandet", offen: true, ueberfaellig: 0 };
  }

  const ende = service ? b.start_date : (b.end_date || b.start_date);
  const vorbei = tagDiff(ende, heute);        // Tage seit dem Ende
  const bisStart = tagDiff(b.start_date, heute); // negativ = Start liegt noch vor uns

  if (vorbei !== null && vorbei > 0) {
    return service
      ? { key: "past", label: "Termin vorbei", offen: true, ueberfaellig: vorbei }
      : { key: "overdue", label: "Überfällig", offen: true, ueberfaellig: vorbei };
  }
  if (!service && bisStart !== null && bisStart >= 0) {
    return { key: "active", label: "Laufend", offen: true, ueberfaellig: 0, rest: vorbei === null ? null : -vorbei };
  }
  return { key: "confirmed", label: "Bestätigt", offen: true, ueberfaellig: 0, bisStart: bisStart === null ? null : -bisStart };
}

// Sortierung: Offene zuerst, darin die überfälligen (längste zuerst), dann nach Enddatum. Geschlossene nach Datum absteigend.
export function sortBookings(liste, heute = new Date()) {
  return liste
    .map((b) => ({ b, s: bookingState(b, heute) }))
    .sort((x, y) => {
      if (x.s.offen !== y.s.offen) return x.s.offen ? -1 : 1;
      if (x.s.offen) {
        if (x.s.ueberfaellig !== y.s.ueberfaellig) return y.s.ueberfaellig - x.s.ueberfaellig;
        return new Date(x.b.end_date || x.b.start_date) - new Date(y.b.end_date || y.b.start_date);
      }
      return new Date(y.b.created_at) - new Date(x.b.created_at);
    });
}

// Vorbereitete Nachricht für den Chat bei überfälliger Miete (Spec 24.09.2026). Wird nur ins Eingabefeld
// gesetzt, nie automatisch gesendet. Tonalität: direkt, trocken, keine Ausrufezeichen.
export function mahnText(rolle, titel, endDatum) {
  const t = titel || "dem Inserat";
  if (rolle === "owner") {
    const d = new Date(endDatum);
    const datum = isNaN(d) ? "dem vereinbarten Tag" : d.toLocaleDateString("de-CH", { day: "numeric", month: "short" });
    return `Hallo, die Rückgabe von "${t}" war am ${datum} vereinbart. Wann bekomme ich sie zurück?`;
  }
  return `Hallo, ich bin mit "${t}" spät dran. Wann kann ich sie zurückbringen?`;
}
