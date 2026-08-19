"use client";

import { useEffect, useRef, useState } from "react";

// Easter Egg: Biene erscheint selten, fliegt dem Cursor hinterher und weicht
// sanft aus, wenn man ihr zu nahe kommt. Fangen (Klick) bleibt machbar: dann
// haelt sie an, sagt einen trockenen Spruch (immer oberhalb) und fliegt davon.
// Geheime Abkuerzung: Alt+B oder "bee" tippen (ausserhalb von Eingabefeldern).

const SPRUECHE = [
  "Ich arbeite hier nur.",
  "Schon was inseriert? Dein Keller weiss mehr.",
  "Ich nehme 7 Prozent. Fürs Fliegen.",
  "Weiter stöbern. Ich bestäube derweil.",
  "Kein Honig. Nur gute Deals.",
  "Ich bin die Qualitätskontrolle.",
  "Du hast mich gefunden. Sag es niemandem.",
  "Preise schneiden, Blumen retten. Was machst du so?",
];

const MAX_FLUEGE = 4;        // pro Sitzung; die Tastenkombi zaehlt nicht mit
const FLUGZEIT_MS = 22000;   // danach fliegt sie von selbst davon
const AUSWEICH_RADIUS = 150; // ab dieser Cursor-Naehe weicht sie aus
const TEMPO_FOLGEN = 240;    // px/s Richtung Cursor
const TEMPO_FLUCHT = 205;    // px/s beim Ausweichen: langsamer als eine Maus, fangbar

export default function FlyingBee() {
  const beeRef = useRef(null);
  const animRef = useRef(null);
  const loopRef = useRef(null);
  const timerRef = useRef(null);
  const bubbleTimerRef = useRef(null);
  const stateRef = useRef("idle"); // idle | flying | talking | exiting
  const posRef = useRef({ x: 0, y: 0 }); // Bienen-Mittelpunkt
  const velRef = useRef({ x: 0, y: 0 });
  const mausRef = useRef(null);
  const wanderRef = useRef({ x: 0, y: 0, bis: 0 });
  const faceRef = useRef(1); // scaleX: 1 = Kopf links (Original), -1 = gespiegelt
  const sizeRef = useRef(92);
  const [visible, setVisible] = useState(false);
  const [size, setSize] = useState(92);
  const [bubble, setBubble] = useState(null);

  const reducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Desktop-Zoom (body { zoom: 1.1/1.15/1.25 }): Pointer-Koordinaten kommen
  // ungezoomt, Element-Positionen im Body sind gezoomt. Alles auf den
  // Body-Massstab umrechnen, sonst jagt die Biene einen versetzten Punkt.
  const zoomFaktor = () => parseFloat(getComputedStyle(document.body).zoom) || 1;

  const landen = () => {
    stateRef.current = "idle";
    setVisible(false);
    setBubble(null);
    cancelAnimationFrame(loopRef.current);
  };

  const fliegen = (erzwungen = false) => {
    const bee = beeRef.current;
    if (!bee || stateRef.current !== "idle" || reducedMotion()) return;
    if (!erzwungen) {
      const n = parseInt(sessionStorage.getItem("bee_fluege") || "0", 10);
      if (n >= MAX_FLUEGE) return;
      sessionStorage.setItem("bee_fluege", String(n + 1));
    }
    const z = zoomFaktor();
    const vw = window.innerWidth / z;
    const vh = window.innerHeight / z;
    const s = vw < 640 ? 84 : 92;
    sizeRef.current = s;
    setSize(s);
    stateRef.current = "flying";
    setVisible(true);

    const vonLinks = Math.random() < 0.5;
    posRef.current = { x: vonLinks ? -120 : vw + 120, y: vh * (0.2 + Math.random() * 0.4) };
    velRef.current = { x: vonLinks ? 200 : -200, y: 0 };
    wanderRef.current = { x: vw / 2, y: vh / 2, bis: 0 };

    const t0 = performance.now();
    let letzt = t0;

    const schritt = (now) => {
      if (stateRef.current !== "flying") return;
      const dt = Math.min((now - letzt) / 1000, 0.05);
      letzt = now;
      const zf = zoomFaktor();
      const w = window.innerWidth / zf;
      const h = window.innerHeight / zf;
      const pos = posRef.current;
      const vel = velRef.current;

      // Ziel: der Cursor. Ohne Cursor (Touch) wandert sie zwischen Zufallspunkten.
      let ziel = mausRef.current;
      if (!ziel) {
        const wd = wanderRef.current;
        if (now > wd.bis || Math.hypot(wd.x - pos.x, wd.y - pos.y) < 60) {
          wd.x = 70 + Math.random() * (w - 140);
          wd.y = 110 + Math.random() * Math.max(h - 280, 120);
          wd.bis = now + 1500 + Math.random() * 1500;
        }
        ziel = wd;
      }

      const dx = ziel.x - pos.x;
      const dy = ziel.y - pos.y;
      const dist = Math.hypot(dx, dy) || 1;
      let rx = dx / dist;
      let ry = dy / dist;
      let tempo = TEMPO_FOLGEN;
      if (mausRef.current && dist < AUSWEICH_RADIUS) {
        // Sanft ausweichen: weg vom Cursor, aber langsamer als eine Maus
        rx = -rx;
        ry = -ry;
        tempo = TEMPO_FLUCHT;
      } else if (dist < 40) {
        tempo = 0; // angekommen, nur schweben
      }

      // Traeges Einlenken statt hartem Richtungswechsel
      const k = Math.min(1, dt * 2.6);
      vel.x += (rx * tempo - vel.x) * k;
      vel.y += (ry * tempo - vel.y) * k;
      pos.x += vel.x * dt;
      pos.y += vel.y * dt + Math.sin(now / 170) * 0.9; // Geflatter

      // Flugraum: oben Platz fuer die Sprechblase lassen
      pos.x = Math.min(Math.max(pos.x, 40), w - 40);
      pos.y = Math.min(Math.max(pos.y, 105), h - 110);

      // Blickrichtung mit Hysterese (kein Zappeln beim Schweben)
      if (vel.x > 45) faceRef.current = -1;
      else if (vel.x < -45) faceRef.current = 1;

      const halb = sizeRef.current / 2;
      bee.style.transform = `translate(${pos.x - halb}px, ${pos.y - halb}px) scaleX(${faceRef.current})`;

      if (now - t0 > FLUGZEIT_MS) {
        abflug();
        return;
      }
      loopRef.current = requestAnimationFrame(schritt);
    };
    loopRef.current = requestAnimationFrame(schritt);
  };

  const abflug = () => {
    const bee = beeRef.current;
    if (!bee) return landen();
    stateRef.current = "exiting";
    setBubble(null);
    cancelAnimationFrame(loopRef.current);
    const pos = posRef.current;
    const halb = sizeRef.current / 2;
    const vw = window.innerWidth / zoomFaktor();
    // In Blickrichtung raus (faceRef -1 = schaut nach rechts)
    const zielX = faceRef.current === -1 ? vw + 220 : -220;
    const anim = bee.animate(
      [
        { transform: `translate(${pos.x - halb}px, ${pos.y - halb}px) scaleX(${faceRef.current})` },
        { transform: `translate(${zielX}px, ${pos.y - halb - 160}px) scaleX(${faceRef.current})` },
      ],
      { duration: 750, easing: "cubic-bezier(.5,0,1,.5)" }
    );
    animRef.current = anim;
    anim.onfinish = landen;
  };

  const angeklickt = () => {
    if (stateRef.current !== "flying") return;
    stateRef.current = "talking";
    cancelAnimationFrame(loopRef.current);
    const pos = posRef.current;
    const halb = sizeRef.current / 2;
    const x = Math.min(Math.max(pos.x, 130), window.innerWidth / zoomFaktor() - 130);
    // Immer OBERHALB der Biene (Flugraum garantiert den Platz dafuer)
    setBubble({ x, y: pos.y - halb - 10, text: SPRUECHE[Math.floor(Math.random() * SPRUECHE.length)] });
    bubbleTimerRef.current = setTimeout(abflug, 3000);
  };

  useEffect(() => {
    if (reducedMotion()) return;

    // Cursor-Position fuer Folgen und Ausweichen
    const onPointer = (e) => {
      const z = zoomFaktor();
      mausRef.current = { x: e.clientX / z, y: e.clientY / z };
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });

    // Zufalls-Fluege: erster nach 1-3 Minuten, danach alle 5-12 Minuten
    let aktiv = true;
    const naechster = (minS, maxS) => {
      if (!aktiv) return;
      timerRef.current = setTimeout(() => {
        fliegen(false);
        naechster(300, 720);
      }, (minS + Math.random() * (maxS - minS)) * 1000);
    };
    naechster(60, 180);

    // Geheime Abkuerzung: Alt+B oder "bee" tippen
    let puffer = "";
    const onKey = (e) => {
      if (e.altKey && e.key.toLowerCase() === "b") { fliegen(true); return; }
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key.length === 1) {
        puffer = (puffer + e.key.toLowerCase()).slice(-3);
        if (puffer === "bee") { puffer = ""; fliegen(true); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      aktiv = false;
      clearTimeout(timerRef.current);
      clearTimeout(bubbleTimerRef.current);
      cancelAnimationFrame(loopRef.current);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={beeRef}
        src="/bee.svg"
        alt=""
        aria-hidden="true"
        onClick={angeklickt}
        style={{
          position: "fixed", left: 0, top: 0, width: size, height: "auto",
          zIndex: 9000, cursor: "pointer", willChange: "transform",
          display: visible ? "block" : "none",
          pointerEvents: visible ? "auto" : "none",
        }}
      />
      {bubble && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed", left: bubble.x, top: bubble.y,
            transform: "translate(-50%, -100%)", zIndex: 9001,
            background: "#fff", border: "1.5px solid #191615",
            boxShadow: "2px 2px 0 #191615", padding: "9px 13px",
            fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600,
            color: "#191615", maxWidth: 250, pointerEvents: "none",
          }}
        >
          {bubble.text}
        </div>
      )}
    </>
  );
}
