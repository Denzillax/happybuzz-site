"use client";
// Grosse Laufschrift im Katalog-Stil: fette Grossbuchstaben, Ink-Linien oben
// und unten, endloser Lauf mit "·"-Trennern. Kein Schliessen-X (Kampagnen-
// Element, kein Alert). prefers-reduced-motion: Text steht still (CSS).
//
// TickerBar ist die reine Darstellung und rendert auch die Admin-Vorschau:
// was der Admin sieht, ist exakt die Live-Laufschrift. Das Tempo ist konstant
// (Pixel pro Sekunde), egal wie lang der Text ist: die Komponente misst die
// echte Breite einer Text-Einheit und rechnet die Animationsdauer daraus.
import { useEffect, useRef, useState } from "react";
import { getTicker } from "@/lib/announcement";

// Stufen aus site_ticker.speed -> Pixel pro Sekunde
const TEMPO = { slow: 45, normal: 90, fast: 150 };

export function TickerBar({ message, bgColor, textColor, speed = "normal", disabled = false }) {
  const boxRef = useRef(null);
  const messRef = useRef(null);
  // repeat: Wiederholungen pro Haelfte; dur: Sekunden fuer eine halbe Runde
  const [lauf, setLauf] = useState({ repeat: 6, dur: 30 });

  const text = (message || "").trim();
  const einheit = `${text} · `;

  useEffect(() => {
    if (!text) return;
    const messen = () => {
      const boxW = boxRef.current?.offsetWidth || 0;
      const einheitW = messRef.current?.offsetWidth || 0;
      if (!boxW || !einheitW) return;
      const px = TEMPO[speed] || TEMPO.normal;
      // Jede Haelfte muss den Sichtbereich fuellen (plus eine Einheit Reserve)
      // UND mindestens 4 Sekunden Lauf hergeben — sonst wuerde eine Mindest-
      // dauer kurze Texte ausbremsen und das Tempo waere nicht mehr konstant.
      const repeat = Math.max(2, Math.ceil(boxW / einheitW) + 1, Math.ceil((px * 4) / einheitW));
      // Der Track wandert um eine halbe Breite (= repeat * einheitW) pro Runde
      const dur = (repeat * einheitW) / px;
      setLauf({ repeat, dur });
    };
    messen();
    // Nach Font-Laden nochmal (General Sans kommt async, Breite aendert sich)
    if (document.fonts?.ready) document.fonts.ready.then(messen).catch(() => {});
    const ro = new ResizeObserver(messen);
    if (boxRef.current) ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, [text, speed]);

  if (!text) return null;
  const haelfte = einheit.repeat(lauf.repeat);
  // Klar-Look: schlankes Band, normale Gross-/Kleinschreibung, moderates Gewicht
  const schrift = {
    fontFamily: "'Manrope', 'General Sans', sans-serif",
    fontWeight: 700, letterSpacing: ".01em",
    fontSize: "clamp(13px, 1.4vw, 15px)", lineHeight: 1,
  };

  return (
    <div ref={boxRef} className="no-print" style={{
      background: bgColor, color: textColor, overflow: "hidden", position: "relative",
      opacity: disabled ? 0.45 : 1,
    }}>
      {/* Unsichtbare Mess-Einheit in identischer Schrift */}
      <span ref={messRef} aria-hidden="true" style={{ ...schrift, position: "absolute", visibility: "hidden", whiteSpace: "pre" }}>{einheit}</span>
      <div className="ticker-track" style={{
        ...schrift, display: "inline-flex", whiteSpace: "pre", padding: "9px 0",
        "--ticker-dur": `${lauf.dur}s`,
      }}>
        <span>{haelfte}</span>
        <span aria-hidden="true">{haelfte}</span>
      </div>
    </div>
  );
}

export function Ticker({ placement }) {
  const [t, setT] = useState(null);

  useEffect(() => {
    let active = true;
    getTicker().then((row) => { if (active) setT(row); });
    return () => { active = false; };
  }, []);

  if (!t || !t.enabled || !(t.message || "").trim() || t.placement !== placement) return null;
  return <TickerBar message={t.message} bgColor={t.bg_color} textColor={t.text_color} speed={t.speed} />;
}
