"use client";

import { useEffect, useRef, useState } from "react";

// Easter Egg: Biene fliegt selten quer durchs Bild. Klick stoppt sie fuer
// einen trockenen Spruch, danach fliegt sie beschleunigt davon.
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

const MAX_FLUEGE = 4; // pro Sitzung; die Tastenkombi zaehlt nicht mit

export default function FlyingBee() {
  const beeRef = useRef(null);
  const animRef = useRef(null);
  const timerRef = useRef(null);
  const bubbleTimerRef = useRef(null);
  const stateRef = useRef("idle"); // idle | flying | talking | exiting
  const dirRef = useRef(1);
  const [visible, setVisible] = useState(false);
  const [size, setSize] = useState(92);
  const [bubble, setBubble] = useState(null);

  const reducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const landen = () => {
    stateRef.current = "idle";
    setVisible(false);
    setBubble(null);
  };

  const fliegen = (erzwungen = false) => {
    const bee = beeRef.current;
    if (!bee || stateRef.current !== "idle" || reducedMotion()) return;
    if (!erzwungen) {
      const n = parseInt(sessionStorage.getItem("bee_fluege") || "0", 10);
      if (n >= MAX_FLUEGE) return;
      sessionStorage.setItem("bee_fluege", String(n + 1));
    }
    stateRef.current = "flying";
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setSize(vw < 640 ? 62 : 92);
    setVisible(true);

    const ltr = Math.random() < 0.5;
    dirRef.current = ltr ? 1 : -1;
    const x0 = ltr ? -160 : vw + 160;
    const x1 = ltr ? vw + 160 : -160;
    const baseY = vh * (0.15 + Math.random() * 0.45);
    const amp = 30 + Math.random() * 60;
    const freq = 2 + Math.random() * 1.5;
    const phase = Math.random() * Math.PI * 2;

    const steps = 10;
    const frames = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const y = baseY + Math.sin(phase + t * Math.PI * freq) * amp;
      // Artwork schaut nach links, beim Flug nach rechts also spiegeln
      frames.push({ transform: `translate(${x}px, ${y}px) scaleX(${ltr ? -1 : 1})` });
    }
    const anim = bee.animate(frames, { duration: 6500 + Math.random() * 2500, easing: "linear" });
    animRef.current = anim;
    anim.onfinish = landen;
  };

  const abflug = () => {
    const bee = beeRef.current;
    if (!bee) return landen();
    stateRef.current = "exiting";
    setBubble(null);
    const m = new DOMMatrix(getComputedStyle(bee).transform);
    const vw = window.innerWidth;
    const zielX = dirRef.current > 0 ? vw + 200 : -200;
    const alt = animRef.current;
    if (alt) alt.cancel();
    const anim = bee.animate(
      [
        { transform: `translate(${m.e}px, ${m.f}px) scaleX(${dirRef.current > 0 ? -1 : 1})` },
        { transform: `translate(${zielX}px, ${m.f - 140}px) scaleX(${dirRef.current > 0 ? -1 : 1})` },
      ],
      { duration: 750, easing: "cubic-bezier(.5,0,1,.5)" }
    );
    animRef.current = anim;
    anim.onfinish = landen;
  };

  const angeklickt = () => {
    const bee = beeRef.current;
    if (!bee || stateRef.current !== "flying") return;
    stateRef.current = "talking";
    if (animRef.current) animRef.current.pause();
    const r = bee.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2, 130), window.innerWidth - 130);
    setBubble({ x, y: Math.max(r.top, 70), text: SPRUECHE[Math.floor(Math.random() * SPRUECHE.length)] });
    bubbleTimerRef.current = setTimeout(abflug, 3000);
  };

  useEffect(() => {
    if (reducedMotion()) return;

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
      window.removeEventListener("keydown", onKey);
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
            position: "fixed", left: bubble.x, top: bubble.y - 12,
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
