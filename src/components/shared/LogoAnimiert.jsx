"use client";
import { B_ALLEIN, QUADRATE_LISTE } from "@/components/shared/BLogo";

// Animiertes Logo (Denis 25.09.2026, Spec docs/superpowers/specs/2026-09-25-logo-animation-design.md): das B steht, die sechs
// Kacheln rasten von aussen nach innen ein, danach wischt sich die Wortmarke von links auf. Einmal im App-Splash, in
// Schleife als Ladeanzeige im Admin (schleife). Farbe über currentColor (white = weiss auf dunklem Grund).
// Keyframes und Klassen la-* in globals.css. Bei "weniger Bewegung" steht das Logo sofort fertig.
//
// Reihenfolge der Kacheln (Index in QUADRATE_LISTE): die vom B entfernteste zuerst, die drei am B zuletzt.
const REIHENFOLGE = [3, 0, 2, 5, 1, 4];

export function LogoAnimiert({ width = 190, white = false, schleife = false }) {
  const bGr = width * 0.185;
  return (
    <span className={"la" + (schleife ? " la-schleife" : "")} aria-label="BEEDARO" role="img"
      style={{ display: "inline-flex", alignItems: "center", gap: width * 0.042, color: white ? "#fff" : "#191615" }}>
      <svg width={bGr} height={(bGr * 885.5) / 911.7} viewBox="0 0 911.7 885.5" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
        {QUADRATE_LISTE.map(([x, y, b], i) => (
          <rect key={i} className="la-kachel" x={x} y={y} width={b} height={177} fill="currentColor"
            style={{ animationDelay: `${REIHENFOLGE.indexOf(i) * 90}ms` }} />
        ))}
        <path d={B_ALLEIN} fill="currentColor" />
      </svg>
      <span className="la-wort" style={{ fontFamily: "'Sora', 'Manrope', sans-serif", fontSize: width * 0.178, fontWeight: 700, letterSpacing: "-.05em", lineHeight: 1 }}>beedaro</span>
    </span>
  );
}
