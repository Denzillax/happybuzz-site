"use client";
// Pixel-Biene für den Hero (Denis 19.09.2026): steht an ihrem Platz und schlägt mit den Flügeln, fliegt aber nicht.
// Es ist der Entwurf 02 ("von vorn"), unverändert in Grösse und Körper: Kugelfühler, zwei Augen, Streifen, Stachel,
// 7 px pro Kachel. Nur die runden Flügel sind durch das BEEDARO-B ersetzt, in Rot: rechts das Logo (Quadrate zum
// Körper hin, die zwei Bögen nach aussen), links gespiegelt. Beim Flügelschlag wird das B schmal und wieder breit,
// rund neunmal pro Sekunde. Mit "Bewegung reduzieren" steht das erste Bild.
// Zeichen: Y Körper (Honig), K Ink, R Flügel rot, . leer.
import { useEffect, useState } from "react";

const FARBE = { Y: "#F5C518", K: "#0A0A0A", R: "#E0492A" };
// Das Logo im Kleinen (eine Kachel pro Logo-Quadrat): links die versetzten Quadrate, rechts der B-Körper mit Taille
const B_OFFEN = ["..RRR.", ".R.RRR", "R.RRR.", ".R.RRR", "..RRR."];
const B_SCHMAL = ["..RR..", ".R.R..", "R.RR..", ".R.R..", "..RR.."];
// Körper des Entwurfs 02, sieben Kacheln breit. Zeilen 5 bis 9 tragen die Flügel.
const OBEN = ["....KK.......KK....", ".....K.......K.....", "......K.....K......", ".......YYYYY.......", "......YYYYYYY......"];
const MITTE = ["YKYYYKY", "YYYYYYY", "KKKKKKK", "YYYYYYY", "KKKKKKK"];
const UNTEN = ["......YYYYYYY......", ".......KKKKK.......", "........YYY........", ".........K........."];

const bild = (b) => [...OBEN, ...MITTE.map((k, i) => `${[...b[i]].reverse().join("")}${k}${b[i]}`), ...UNTEN];
const BILD_OFFEN = bild(B_OFFEN), BILD_SCHMAL = bild(B_SCHMAL);

export default function PixelBiene({ pixel = 7, title = "Biene" }) {
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
