"use client";
// Punkt-Schriftzug mit Biene (Denis 19.09.2026). Vorbild ist der "LOOKBOOK"-Schriftzug von
// squareo.framer.website, dort zerfällt das Wort beim Scrollen. Hier hat der Effekt einen
// Grund: eine Biene aus Punkten fliegt durch das Wort, die Punkte stieben auseinander und
// federn an ihren Platz zurück. Vor dem Mauszeiger weichen sie ebenfalls aus.
//  - Das Wort ist eine Zeichenfläche, für Suchmaschinen und Screenreader also unsichtbar.
//    Darum trägt sie role="img" mit Beschriftung, und der Hauptsatz bleibt echter Text.
//  - Die Schleife läuft nur, solange sich etwas bewegt und der Schriftzug im Bild ist.
//  - Mit "Bewegung reduzieren" steht das Wort still, ohne Biene.
import { useEffect, useRef } from "react";

const TEAL = "#007C7C";
const BIENENFARBE = { H: "#F4C03F", K: "#191615", W: "#191615", w: "#191615", E: "#F4C03F", A: "#191615" };
// Biene als Punktbild, von vorn (dritte Fassung, 17 x 13, nach Denis' Vorlage vom 19.09.2026):
// Ink-Silhouette mit runden Flügeln, Kugelfühlern, zwei Honigstreifen und Stachel.
// H Honig, K Ink, W Flügel, w Flügelrand (verschwindet beim Flügelschlag), E Auge, A Fühler.
// Dieselbe Figur als Vektor: public/bee-flach.svg (scratch "flachbiene.py").
const BIENE = [
  "...AA.......AA...",
  "....A.......A....",
  ".....A.KKK.A.....",
  ".....KKKKKKK.....",
  ".....KKEKEKK.....",
  ".wWW.KKKKKKK.WWw.",
  "wWWW.KHHHHHK.WWWw",
  "wWWW.KKKKKKK.WWWw",
  "wWWW.KHHHHHK.WWWw",
  ".wWW.KKKKKKK.WWw.",
  ".....KKKKKKK.....",
  ".......KKK.......",
  "........K........",
];
const SPALTEN = 17;

// farbe: Punktfarbe des Worts. schrift: Schriftfamilie, aus der das Wort gerastert wird.
export default function PunktSchriftzug({ wort = "BEEDARO", pause = 7000, farbe = TEAL, schrift = "General Sans" }) {
  const cvRef = useRef(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let punkte = [], B = 0, H = 0, raster = 6, raf = 0, sichtbar = true, laeuft = false, tot = false;
    const biene = { an: false, x: 0, y: 0, t: 0, richtung: 1, pollen: null };
    const maus = { x: -9999, y: -9999 };

    const aufbauen = () => {
      const breite = Math.min(620, cv.parentElement.clientWidth);
      if (breite < 60) return;
      if (breite === B && punkte.length) return; // ResizeObserver meldet auch ohne Breitenänderung
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      B = breite; H = Math.round(breite * 0.2);
      raster = breite > 480 ? 6 : 5;
      cv.width = Math.round(B * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = B + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Wort unsichtbar setzen und an den Rasterpunkten abtasten
      const m = document.createElement("canvas"); m.width = B; m.height = H;
      const mx = m.getContext("2d");
      let grad = H * 0.92;
      mx.font = `800 ${grad}px "${schrift}", "General Sans", "Manrope", Arial, sans-serif`;
      const w = mx.measureText(wort).width;
      if (w > B - raster * 2) grad *= (B - raster * 2) / w;
      mx.font = `800 ${grad}px "${schrift}", "General Sans", "Manrope", Arial, sans-serif`;
      mx.textAlign = "center"; mx.textBaseline = "middle";
      mx.fillText(wort, B / 2, H / 2 + grad * 0.04);
      const d = mx.getImageData(0, 0, B, H).data;
      punkte = [];
      for (let y = raster / 2; y < H; y += raster) {
        for (let x = raster / 2; x < B; x += raster) {
          if (d[(Math.floor(y) * B + Math.floor(x)) * 4 + 3] > 110) punkte.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 });
        }
      }
      malen();
    };

    const stoss = (px, py, radius, kraft) => {
      const r2 = radius * radius;
      for (const p of punkte) {
        const dx = p.x - px, dy = p.y - py, q = dx * dx + dy * dy;
        if (q < r2 && q > 0.01) { const l = Math.sqrt(q), k = (1 - l / radius) * kraft; p.vx += (dx / l) * k; p.vy += (dy / l) * k; }
      }
    };

    const malen = () => {
      ctx.clearRect(0, 0, B, H);
      ctx.fillStyle = farbe;
      const r = raster * 0.4;
      for (const p of punkte) { ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill(); }
      if (biene.an) {
        // Eigenleben: Flügelschlag (Flügelrand), Blinzeln alle paar Sekunden, wippende Fühler
        const z = raster * 0.8, flatter = Math.floor(biene.t / 3) % 2;
        const blinzelt = biene.t % 150 > 142;
        const wipp = Math.sin(biene.t / 7) * z * 0.18;
        for (let zeile = 0; zeile < BIENE.length; zeile++) {
          for (let spalte = 0; spalte < SPALTEN; spalte++) {
            let ch = BIENE[zeile][biene.richtung === 1 ? spalte : SPALTEN - 1 - spalte];
            if (ch === ".") continue;
            if (ch === "w" && flatter) continue;
            if (ch === "E" && blinzelt) ch = "K";
            ctx.fillStyle = BIENENFARBE[ch];
            const klein = ch === "A" && zeile > 0;
            ctx.beginPath();
            ctx.arc(biene.x - (SPALTEN / 2) * z + spalte * z + (ch === "A" ? wipp : 0), biene.y - (BIENE.length / 2) * z + zeile * z, (klein ? 0.3 : 0.42) * z, 0, 6.2832);
            ctx.fill();
          }
        }
      }
    };

    const takt = () => {
      raf = 0;
      if (tot) return;
      let bewegt = false;
      if (biene.an) {
        bewegt = true;
        biene.t += 1;
        // In der Wortmitte wird sie langsamer, als sähe sie sich um
        const mitte = 1 - Math.min(1, Math.abs(biene.x - B / 2) / (B * 0.22));
        biene.x += biene.richtung * (B / 190) * (1 - mitte * 0.62);
        biene.y = H / 2 + Math.sin(biene.t / 16) * H * 0.24 + Math.sin(biene.t / 5) * 1.2;
        stoss(biene.x, biene.y, raster * 7.5, 1.7);
        // Pollen: beim Überqueren der Mitte nimmt sie einen Punkt des Worts mit. Fliegt sie
        // hinaus, lässt sie ihn los und er zischt an seinen Platz zurück.
        if (!biene.pollen && mitte > 0.9) {
          let best = null, bd = 1e9;
          for (const p of punkte) { const q = (p.hx - biene.x) ** 2 + (p.hy - biene.y) ** 2; if (q < bd) { bd = q; best = p; } }
          biene.pollen = best;
        }
        if (biene.pollen) {
          const p = biene.pollen; p.vx = 0; p.vy = 0;
          p.x = biene.x - biene.richtung * raster * 1.2; p.y = biene.y + raster * 5.4;
        }
        if (biene.x > B + raster * 14 || biene.x < -raster * 14) { biene.an = false; biene.pollen = null; }
      }
      if (maus.x > -9000) stoss(maus.x, maus.y, raster * 6, 0.9);
      for (const p of punkte) {
        if (p === biene.pollen) continue;
        p.vx += (p.hx - p.x) * 0.05; p.vy += (p.hy - p.y) * 0.05;
        p.vx *= 0.83; p.vy *= 0.83; p.x += p.vx; p.y += p.vy;
        if (Math.abs(p.vx) > 0.02 || Math.abs(p.vy) > 0.02 || Math.abs(p.hx - p.x) > 0.05 || Math.abs(p.hy - p.y) > 0.05) bewegt = true;
      }
      malen();
      if (bewegt && sichtbar) raf = requestAnimationFrame(takt); else laeuft = false;
    };
    const anwerfen = () => { if (!laeuft && sichtbar && !ruhig && !tot) { laeuft = true; raf = requestAnimationFrame(takt); } };

    const losfliegen = () => {
      if (biene.an || !sichtbar || ruhig || document.hidden) return;
      biene.richtung = biene.richtung === 1 ? -1 : 1;
      biene.x = biene.richtung === 1 ? -raster * 12 : B + raster * 12;
      biene.t = 0; biene.an = true; anwerfen();
    };

    const bewegung = (e) => {
      const b = cv.getBoundingClientRect();
      if (!b.width) return;
      maus.x = ((e.clientX - b.left) * B) / b.width; maus.y = ((e.clientY - b.top) * H) / b.height;
      anwerfen();
    };
    const weg = () => { maus.x = -9999; };

    const start = () => { if (!tot) { aufbauen(); } };
    if (document.fonts && document.fonts.load) document.fonts.load(`800 80px "${schrift}"`).then(start, start); else start();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => aufbauen()) : null;
    ro?.observe(cv.parentElement);
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((es) => { sichtbar = es[0].isIntersecting; if (sichtbar) anwerfen(); }) : null;
    io?.observe(cv);
    cv.addEventListener("mousemove", bewegung);
    cv.addEventListener("mouseleave", weg);
    const erster = setTimeout(losfliegen, 1200);
    const takter = setInterval(losfliegen, pause);

    return () => {
      tot = true; cancelAnimationFrame(raf); clearTimeout(erster); clearInterval(takter);
      ro?.disconnect(); io?.disconnect();
      cv.removeEventListener("mousemove", bewegung); cv.removeEventListener("mouseleave", weg);
    };
  }, [wort, pause, farbe, schrift]);

  return <canvas ref={cvRef} className="bh-wort" role="img" aria-label="Beedaro" />;
}
