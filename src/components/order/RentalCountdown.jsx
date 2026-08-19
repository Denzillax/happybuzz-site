"use client";
// Live-Countdown der laufenden Mietzeit im Katalog-Stil: Anzeigetafel mit
// Mono-Ziffern (Tage/Std/Min/Sek, tickt sekuendlich) und kraeftigem
// Fortschrittsbalken. Farben: Moss laeuft, Honig-Gelb Endspurt (ab 80%
// verstrichener Zeit), Rot ueberfaellig (Tafel zaehlt dann vorwaerts).
// end_date ist nur ein Datum: der letzte Miettag zaehlt voll (bis 23:59:59).
import { useEffect, useState } from "react";
import { fonts } from "@/lib/theme";

const MONO = "'Space Mono', ui-monospace, monospace";
const INK = "#14110D";
const SAND = "#F9F4EC";
const MOSS = "#5B8C5A";
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

  const kaestchen = [
    [tage, "Tage"],
    [std, "Std"],
    [min, "Min"],
    [sek, "Sek"],
  ];

  return (
    <div style={{ background: SAND, border: `1.5px solid ${INK}`, padding: "14px 14px 16px", marginBottom: 14, textAlign: "left" }}>
      <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: overdue ? ROT : "#7a756d", marginBottom: 10 }}>
        {overdue ? "Überfällig seit" : "Rückgabe in"}
      </div>

      {/* Anzeigetafel */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {kaestchen.map(([wert, label]) => (
          <div key={label} style={{ flex: "0 0 auto", textAlign: "center" }}>
            <div style={{
              minWidth: 52, padding: "8px 6px", background: "#fff",
              border: `1.5px solid ${INK}`, boxSizing: "border-box",
              fontFamily: MONO, fontSize: 24, fontWeight: 700, lineHeight: 1,
              color: overdue ? ROT : INK, fontVariantNumeric: "tabular-nums",
            }}>
              {String(wert).padStart(2, "0")}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#7a756d", marginTop: 4 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Fortschritt mit Start/Ende */}
      <div style={{ height: 10, border: `1.5px solid ${INK}`, background: "#fff", boxSizing: "border-box", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.round(progress * 100)}%`, background: farbe, transition: "width .5s linear" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontFamily: MONO, fontSize: 10.5, color: "#7a756d" }}>
        {/* Links steht der tatsaechliche Beginn des Balkens (Uebergabe oder Mietstart) */}
        <span>{fmtDatum(start)}</span>
        <span style={{ fontFamily: fonts.body, fontWeight: 700, color: overdue ? ROT : INK, fontSize: 11.5 }}>
          {overdue ? `${tage} ${tage === 1 ? "Tag" : "Tage"} drüber` : `${tage} ${tage === 1 ? "Tag" : "Tage"} übrig`}
        </span>
        <span>{fmtDatum(endDate)}</span>
      </div>
    </div>
  );
}
