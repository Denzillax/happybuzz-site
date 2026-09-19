"use client";
// Pixel-Biene für den Hero (Denis 19.09.2026): steht an ihrem Platz und schlägt mit den Flügeln, fliegt aber nicht.
// Gewählt aus vier Entwürfen: die Biene von vorn. Ihre Flügel sind das BEEDARO-B: rechts das Logo (Quadrate zum
// Körper hin, die zwei Bögen nach aussen), links gespiegelt. Beim Flügelschlag wird das B schmal und wieder breit,
// rund neunmal pro Sekunde. Mit "Bewegung reduzieren" steht das erste Bild.
// Zeichen: Y Körper (Honig), K Ink (Streifen, Augen, Fühler, Stachel), F Flügel, . leer.
import { useEffect, useState } from "react";

const FARBE = { Y: "#F5C518", K: "#0A0A0A", F: "#0A0A0A" };
// Körper von vorn: Kugelfühler, zwei Augen, Streifen, Stachel
const KOERPER = ["KK.....KK", ".K.....K.", "..K...K..", "..YYYYY..", ".YYYYYYY.", ".YKYYYKY.", ".YYYYYYY.", "YYYYYYYYY", "KKKKKKKKK", "YYYYYYYYY", "KKKKKKKKK", ".YYYYYYY.", "..KKKKK..", "...YYY...", "....K...."];
// Das Logo im Kleinen (eine Kachel pro Logo-Quadrat): links die versetzten Quadrate, rechts der B-Körper mit Taille
const B_KLEIN = ["..XXX.", ".X.XXX", "X.XXX.", ".X.XXX", "..XXX."];
const FLUEGEL_AB = 3; // Zeile des Körpers, an der die Flügel ansetzen

// Flügel aus dem kleinen B: Höhe immer doppelt, Breite doppelt (offen) oder einfach (beim Schlag schmal)
function fluegel(offen) {
  const zeilen = [];
  for (const z of B_KLEIN) {
    const breit = [...z].map((ch) => (ch === "X" ? "F" : ".").repeat(offen ? 2 : 1)).join("").padEnd(12, ".");
    zeilen.push(breit, breit);
  }
  return zeilen; // 10 Zeilen hoch, 12 breit, Quadrate links (zum Körper), Bögen rechts
}
function bild(offen) {
  const f = fluegel(offen), leer = ".".repeat(12);
  return KOERPER.map((k, r) => {
    const rechts = r >= FLUEGEL_AB && r < FLUEGEL_AB + f.length ? f[r - FLUEGEL_AB] : leer;
    const links = [...rechts].reverse().join("");
    return `${links}.${k}.${rechts}`;
  });
}
const BILD_OFFEN = bild(true), BILD_SCHMAL = bild(false);

export default function PixelBiene({ pixel = 5, title = "Biene" }) {
  const [schlag, setSchlag] = useState(false);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setSchlag((s) => !s), 110);
    return () => clearInterval(t);
  }, []);
  const zeilen = schlag ? BILD_SCHMAL : BILD_OFFEN, breit = zeilen[0].length, hoch = zeilen.length;
  return (
    <svg width={breit * pixel} height={hoch * pixel} viewBox={`0 0 ${breit} ${hoch}`} shapeRendering="crispEdges" role="img" aria-label={title} className="wl-biene" style={{ display: "block" }}>
      {zeilen.map((zeile, r) => [...zeile].map((ch, c) => (FARBE[ch] ? <rect key={`${r}-${c}`} x={c} y={r} width="0.92" height="0.92" fill={FARBE[ch]} /> : null)))}
    </svg>
  );
}
