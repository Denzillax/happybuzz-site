"use client";
// Grosse Laufschrift im Katalog-Stil: fette Grossbuchstaben, Ink-Linien oben
// und unten, endloser Lauf mit "·"-Trennern. Kein Schliessen-X (Kampagnen-
// Element, kein Alert). prefers-reduced-motion: Text steht still (CSS).
import { useEffect, useState } from "react";
import { getTicker } from "@/lib/announcement";

export function Ticker({ placement }) {
  const [t, setT] = useState(null);

  useEffect(() => {
    let active = true;
    getTicker().then((row) => { if (active) setT(row); });
    return () => { active = false; };
  }, []);

  if (!t || !t.enabled || !(t.message || "").trim() || t.placement !== placement) return null;

  // Text mehrfach wiederholen, damit die Schleife auch bei kurzen Texten
  // luecken­los laeuft (Track wird per CSS um 50% verschoben => 2 identische Haelften)
  const einheit = `${t.message.trim()} · `;
  const haelfte = einheit.repeat(6);

  return (
    <div className="no-print" style={{
      background: t.bg_color, color: t.text_color, overflow: "hidden",
      borderTop: "1.5px solid #14110D", borderBottom: "1.5px solid #14110D",
    }}>
      <div className="ticker-track" style={{
        display: "inline-flex", whiteSpace: "nowrap",
        fontFamily: "'General Sans', 'Manrope', sans-serif",
        fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em",
        fontSize: "clamp(20px, 2.6vw, 30px)", lineHeight: 1, padding: "14px 0",
      }}>
        <span>{haelfte}</span>
        <span aria-hidden="true">{haelfte}</span>
      </div>
    </div>
  );
}
