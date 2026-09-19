"use client";
// Pixelfeld unter dem Mauszeiger (Denis 19.09.2026, Idee von craft.wild.as, eigene Umsetzung):
// Über der ganzen Seite liegt ein unsichtbares Raster aus 16-px-Kacheln. Wo der Zeiger hinkommt,
// leuchten die Kacheln farbig auf und verglühen wieder. Ein Klick auf freie Fläche schickt eine
// Ringwelle durchs Raster.
//  - Die Fläche fängt keine Klicks ab (pointer-events: none) und liegt per "multiply" über der
//    Seite: Auf Weiss sieht man die Farbe, Text und Fotos bleiben lesbar.
//  - Die Wärme wird in Seitenkoordinaten gespeichert, die Spur scrollt also mit dem Karoraster mit.
//  - Nur mit echter Maus. Mit Touch oder "Bewegung reduzieren" passiert nichts.
//  - Die Schleife läuft nur, solange etwas glüht.
import { useEffect, useRef } from "react";

const Z = 16;
const FARBEN = ["#FBF062", "#3B5BD9", "#FBF062", "#E0492A", "#D8FF00", "#6C4CF1", "#FBF062", "#1C2541"];

export default function PixelFeld({ ursprung }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const fein = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fein || ruhig) return;
    const ctx = cv.getContext("2d");
    const glut = new Map(); // "cx,cy" (Seitenkoordinaten in Kacheln) -> Wärme 0..1
    let wellen = [], raf = 0, B = 0, H = 0, zoom = 1, oy = 0;

    const messen = () => {
      // body trägt auf dem Desktop einen CSS-Zoom: Zeigerkoordinaten sind Bildschirm-Pixel,
      // die Zeichenfläche rechnet in gezoomten CSS-Pixeln
      zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
      B = Math.ceil(window.innerWidth / zoom); H = Math.ceil(window.innerHeight / zoom);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(B * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = B + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Raster am Karopapier ausrichten: dessen Ursprung ist die Oberkante des Rastergrunds
      const el = ursprung ? document.querySelector(ursprung) : null;
      oy = el ? (((el.getBoundingClientRect().top / zoom + window.scrollY / zoom) % Z) + Z) % Z : 0;
    };

    const farbeVon = (cx, cy) => FARBEN[Math.abs((cx * 73856093) ^ (cy * 19349663)) % FARBEN.length];
    const heizen = (cx, cy, wert) => { const k = cx + "," + cy; glut.set(k, Math.min(1, (glut.get(k) || 0) + wert)); };

    const takt = () => {
      raf = 0;
      const sx = window.scrollX / zoom, sy = window.scrollY / zoom, jetzt = performance.now();
      // Wellen: ein Ring aus Kacheln wächst vom Klickpunkt nach aussen
      wellen = wellen.filter((w) => {
        const r = ((jetzt - w.t) / 1000) * 22, rand = Math.ceil(r) + 1;
        if (r > 26) return false;
        const staerke = 1 - r / 26;
        for (let dy = -rand; dy <= rand; dy += 1) for (let dx = -rand; dx <= rand; dx += 1) {
          if (Math.abs(Math.hypot(dx, dy) - r) < 0.6) heizen(w.cx + dx, w.cy + dy, 0.5 * staerke);
        }
        return true;
      });
      ctx.clearRect(0, 0, B, H);
      for (const [k, w] of glut) {
        const n = w * 0.93;
        if (n < 0.03) { glut.delete(k); continue; }
        glut.set(k, n);
        const [cx, cy] = k.split(",").map(Number);
        const x = cx * Z - sx, y = cy * Z + oy - sy;
        if (x < -Z || y < -Z || x > B || y > H) continue;
        ctx.globalAlpha = Math.min(1, n * 1.15);
        ctx.fillStyle = farbeVon(cx, cy);
        ctx.fillRect(x, y, Z - 1, Z - 1);
      }
      ctx.globalAlpha = 1;
      if (glut.size || wellen.length) raf = requestAnimationFrame(takt);
    };
    const anwerfen = () => { if (!raf) raf = requestAnimationFrame(takt); };

    const zeiger = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const px = (e.clientX + window.scrollX) / zoom, py = (e.clientY + window.scrollY) / zoom - oy;
      const cx = Math.floor(px / Z), cy = Math.floor(py / Z);
      for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
        const d = Math.hypot(dx, dy);
        if (d > 2.3) continue;
        // Mitte sicher, Rand zufällig: so franst die Spur aus wie verstreute Pixel
        if (d > 1 && Math.random() > 0.45) continue;
        heizen(cx + dx, cy + dy, d < 1 ? 0.55 : 0.3);
      }
      anwerfen();
    };
    const klick = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (e.target.closest && e.target.closest("a,button,input,textarea,select")) return;
      const px = (e.clientX + window.scrollX) / zoom, py = (e.clientY + window.scrollY) / zoom - oy;
      wellen.push({ cx: Math.floor(px / Z), cy: Math.floor(py / Z), t: performance.now() });
      anwerfen();
    };

    messen();
    window.addEventListener("pointermove", zeiger, { passive: true });
    window.addEventListener("pointerdown", klick, { passive: true });
    window.addEventListener("resize", messen);
    window.addEventListener("scroll", anwerfen, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", zeiger); window.removeEventListener("pointerdown", klick);
      window.removeEventListener("resize", messen); window.removeEventListener("scroll", anwerfen);
    };
  }, [ursprung]);

  return <canvas ref={ref} className="wl-feld" aria-hidden="true" />;
}
