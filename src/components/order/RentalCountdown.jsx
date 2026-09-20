"use client";
// Live-Countdown der laufenden Mietzeit im Katalog-Stil: Anzeigetafel mit
// Mono-Ziffern (Tage/Std/Min/Sek, tickt sekuendlich) und kraeftigem
// Fortschrittsbalken. Farben: Moss laeuft, Honig-Gelb Endspurt (ab 80%
// verstrichener Zeit), Rot ueberfaellig (Tafel zaehlt dann vorwaerts).
// end_date ist nur ein Datum: der letzte Miettag zaehlt voll (bis 23:59:59).
import { useEffect, useState } from "react";
import { fonts } from "@/lib/theme";

const MONO = "'Instrument Sans', 'Manrope', sans-serif";
const INK = "#1D1D1D";
const SAND = "#F3F3FF";
const MOSS = "#50804F";
const HONIG = "#F4A100";
const ROT = "#c62828";

function endeDesTages(d) {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}

const fmtDatum = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short" });

export function RentalCountdown({ startDate, endDate, handoverAt }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Balken laeuft ab dem Moment, in dem der Mieter den Artikel HAT (Uebergabe),
  // auch wenn der gebuchte Zeitraum erst spaeter beginnt: er sitzt sonst
  // sichtbar auf 0%, obwohl die Miete faktisch laeuft.
  const gebuchterStart = new Date(startDate).getTime();
  const uebergabe = handoverAt ? new Date(handoverAt).getTime() : null;
  const start = uebergabe ? Math.min(uebergabe, gebuchterStart) : gebuchterStart;
  const ende = endeDesTages(endDate).getTime();
  const overdue = now > ende;
  const diff = Math.abs(ende - now);
  const tage = Math.floor(diff / 86400000);
  const std = Math.floor((diff % 86400000) / 3600000);
  const min = Math.floor((diff % 3600000) / 60000);
  const sek = Math.floor((diff % 60000) / 1000);
  const progress = Math.min(1, Math.max(0, (now - start) / Math.max(1, ende - start)));
  const farbe = overdue ? ROT : progress > 0.8 ? HONIG : MOSS;
  // Gebuchte Mietdauer (Rueckgabetag zaehlt nicht als Miettag) — gleiche Zahl
  // wie in Buchungen und Rechnung; die Restzeit steht schon auf der Tafel
  const mietTage = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000));

  const kaestchen = [
    [tage, "Tage"],
    [std, "Std"],
    [min, "Min"],
    [sek, "Sek"],
  ];

  return (
    // Meeko (Denis 20.09.2026): Himmel-Tafel (Farbe des Formats Miete) mit Rundung, Ziffern auf weissen Kacheln mit
    // eingedrücktem Schatten wie bei der Challenge der Woche, runder Fortschrittsbalken. Überfällig: Rosé-Tafel.
    <div style={{ background: overdue ? "#FBEBEA" : "#E3F2FF", border: "1px solid #1D1D1D", borderRadius: 20, padding: "20px 22px 22px", marginBottom: 14, textAlign: "left" }}>
      <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: overdue ? ROT : INK, marginBottom: 12 }}>
        {overdue ? "Überfällig seit" : "Rückgabe in"}
      </div>

      {/* Anzeigetafel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: 18, maxWidth: 420 }}>
        {kaestchen.map(([wert, label]) => (
          <div key={label} style={{ textAlign: "center", padding: "12px 6px 10px", background: "#fff", border: "1px solid #1D1D1D", borderRadius: 14, boxShadow: "inset 0 -5px 0 rgba(29,29,29,.12)" }}>
            <div style={{
              fontFamily: MONO, fontSize: 32, fontWeight: 500, letterSpacing: "-.04em", lineHeight: 1,
              color: overdue ? ROT : INK, fontVariantNumeric: "tabular-nums",
            }}>
              {String(wert).padStart(2, "0")}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: INK, opacity: .6, marginTop: 3 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Fortschritt mit Start/Ende */}
      <div style={{ height: 14, border: "1px solid #1D1D1D", borderRadius: 999, background: "#fff", boxSizing: "border-box", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.round(progress * 100)}%`, background: farbe, borderRadius: 999, transition: "width .5s linear" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: MONO, fontSize: 13, color: INK, opacity: .75 }}>
        {/* Links steht der tatsaechliche Beginn des Balkens (Uebergabe oder Mietstart) */}
        <span>{fmtDatum(start)}</span>
        <span style={{ fontFamily: fonts.body, fontWeight: 600, color: overdue ? ROT : INK, fontSize: 13.5, opacity: 1 }}>
          {overdue ? `${tage} ${tage === 1 ? "Tag" : "Tage"} drüber` : `Mietdauer: ${mietTage} ${mietTage === 1 ? "Tag" : "Tage"}`}
        </span>
        <span>{fmtDatum(endDate)}</span>
      </div>
    </div>
  );
}
