"use client";
// Pixelfeld unter dem Mauszeiger (Denis 19.09.2026, Idee von craft.wild.as, eigene Umsetzung).
// Auf dem Karoraster (und NUR dort, nicht im Hero oder Header) liegt ein Raster aus 16-px-Kacheln.
// Dritte Fassung, "interaktiver und überraschender":
//  1. Spur: Wo der Zeiger hinkommt, glühen Kacheln farbig auf und verglühen wieder.
//  2. Aufladen: Maustaste auf freier Fläche gedrückt halten, unter dem Zeiger wächst ein flackerndes
//     Feld. Loslassen schickt eine Druckwelle, je länger gehalten, desto grösser, mit kurzem Beben.
//  3. Pixel-Biene: Steht der Zeiger ein paar Sekunden still, kommt eine Biene aus Pixeln angeflogen.
//     Danach folgt sie dem Zeiger mit Verzögerung und zieht eine gelbe Spur. Verlässt der Zeiger
//     das Raster, fliegt sie davon.
//  4. Karten: Fährt man auf ein Inserat (data-typ), blitzt sein Rand im Raster in der Formatfarbe auf.
// Technik:
//  - Die Fläche fängt keine Klicks ab (pointer-events: none) und liegt HINTER dem Inhalt: Sie färbt
//    nur das Karopapier, nie Karten, Fotos oder Text (Rastergrund = Stapelkontext, Fläche 0, Inhalt 1).
//  - Wärme in Seitenkoordinaten: Die Spur scrollt mit dem Karoraster mit.
//  - Nur mit echter Maus. Mit Touch oder "Bewegung reduzieren" passiert nichts.
//  - Die Schleife läuft nur, solange etwas glüht, geladen wird oder die Biene fliegt.
import { useEffect, useRef } from "react";

const Z = 16;
const FARBEN = ["#FBF062", "#3B5BD9", "#FBF062", "#E0492A", "#D8FF00", "#6C4CF1", "#FBF062", "#1C2541"];
const TYPFARBE = { sell: "#FBF062", auction: "#3B5BD9", rent: "#6C4CF1", free: "#D8FF00", service: "#E0492A" };
// Biene als Punktbild, Kopf rechts. Y Körper, K Streifen, W Flügel, E Auge, L Beine. Ein Bildpunkt = 5 px.
const BIENE = ["..WW.WW..", "..WW.WW..", ".YKYKYKK.", "YYKYKYKEK", ".YKYKYKK.", "..L..L..."];
const BFARBE = { Y: "#F5C518", K: "#0A0A0A", W: "#B9C4CC", E: "#FFFFFF", L: "#0A0A0A" };
const BP = 5;

export default function PixelFeld({ ursprung }) {
  const ref = useRef(null);
  const obenRef = useRef(null); // zweite Fläche ÜBER dem Inhalt, nur für die Biene (sie soll nicht hinter Karten verschwinden)

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const fein = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fein || ruhig) return;
    const ctx = cv.getContext("2d");
    const cvB = obenRef.current, ctxB = cvB.getContext("2d");
    const glut = new Map(); // "cx,cy" (Seitenkoordinaten in Kacheln) -> { w: Wärme 0..1, f: feste Farbe oder null }
    let wellen = [], raf = 0, B = 0, H = 0, zoom = 1, oy = 0, oben = 0, unten = 0;
    let beben = 0, bild = 0;
    const maus = { x: 0, y: 0, imRaster: false, zuletzt: 0 };
    const ladung = { an: false, t0: 0, x: 0, y: 0 };
    const biene = { an: false, geht: false, x: 0, y: 0, vx: 0, vy: 0, blick: 1 };
    let letzteKarte = null;

    const messen = () => {
      // body trägt auf dem Desktop einen CSS-Zoom: Zeigerkoordinaten sind Bildschirm-Pixel,
      // die Zeichenfläche rechnet in gezoomten CSS-Pixeln
      zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
      B = Math.ceil(window.innerWidth / zoom); H = Math.ceil(window.innerHeight / zoom);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const [c, x] of [[cv, ctx], [cvB, ctxB]]) {
        c.width = Math.round(B * dpr); c.height = Math.round(H * dpr);
        c.style.width = B + "px"; c.style.height = H + "px";
        x.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const el = ursprung ? document.querySelector(ursprung) : null;
      const r = el ? el.getBoundingClientRect() : null;
      // oben/unten: Grenzen des Rastergrunds in Seitenkoordinaten. Ausserhalb glüht nichts.
      oben = r ? (r.top + window.scrollY) / zoom : 0; unten = r ? (r.bottom + window.scrollY) / zoom : Infinity;
      oy = ((oben % Z) + Z) % Z; // Raster am Karopapier ausrichten
    };

    const seite = (e) => ({ x: (e.clientX + window.scrollX) / zoom, y: (e.clientY + window.scrollY) / zoom });
    const zelle = (x, y) => [Math.floor(x / Z), Math.floor((y - oy) / Z)];
    const farbeVon = (cx, cy) => FARBEN[Math.abs((cx * 73856093) ^ (cy * 19349663)) % FARBEN.length];
    const heizen = (cx, cy, wert, farbe) => {
      const y = cy * Z + oy;
      if (y < oben || y + Z > unten) return; // nur auf dem Karoraster
      const k = cx + "," + cy, alt = glut.get(k);
      glut.set(k, { w: Math.min(1, (alt ? alt.w : 0) + wert), f: farbe || (alt ? alt.f : null) });
    };

    const bieneMalen = (sx, sy) => {
      const bx = biene.x - sx - (BIENE[0].length * BP) / 2, by = biene.y - sy - (BIENE.length * BP) / 2;
      const schlag = Math.floor(bild / 4) % 2;
      BIENE.forEach((zeile, r) => {
        if (r === (schlag ? 0 : 1)) return; // Flügelschlag: abwechselnd eine der zwei Flügelreihen
        for (let c = 0; c < zeile.length; c += 1) {
          const ch = zeile[biene.blick === 1 ? c : zeile.length - 1 - c];
          if (ch === ".") continue;
          ctxB.fillStyle = BFARBE[ch];
          ctxB.fillRect(Math.round(bx + c * BP), Math.round(by + r * BP), BP, BP);
        }
      });
    };

    const takt = () => {
      raf = 0; bild += 1;
      const sx = window.scrollX / zoom, sy = window.scrollY / zoom, jetzt = performance.now();

      // Aufladen: flackerndes Feld, das mit der Haltedauer wächst
      if (ladung.an) {
        const ch = Math.min((jetzt - ladung.t0) / 2200, 1), radius = 1 + ch * 5;
        const [cx, cy] = zelle(ladung.x, ladung.y);
        const rand = Math.ceil(radius);
        for (let dy = -rand; dy <= rand; dy += 1) for (let dx = -rand; dx <= rand; dx += 1) {
          if (Math.hypot(dx, dy) <= radius && Math.random() < 0.35) heizen(cx + dx, cy + dy, 0.25 + ch * 0.3);
        }
      }

      // Wellen: ein Ring aus Kacheln wächst vom Auslösepunkt nach aussen
      wellen = wellen.filter((w) => {
        const r = ((jetzt - w.t) / 1000) * (20 + w.kraft * 14), rand = Math.ceil(r) + 1;
        if (r > w.weite) return false;
        const staerke = (1 - r / w.weite) * (0.5 + w.kraft * 0.3), dicke = 0.6 + w.kraft * 0.5;
        for (let dy = -rand; dy <= rand; dy += 1) for (let dx = -rand; dx <= rand; dx += 1) {
          if (Math.abs(Math.hypot(dx, dy) - r) < dicke) heizen(w.cx + dx, w.cy + dy, staerke);
        }
        return true;
      });

      // Pixel-Biene: kommt bei Stillstand, folgt danach dem Zeiger mit Verzögerung
      if (!biene.an && maus.imRaster && !ladung.an && jetzt - maus.zuletzt > 3200) {
        biene.an = true; biene.geht = false;
        biene.x = sx - 40; biene.y = maus.y - 60; biene.vx = 0; biene.vy = 0;
      }
      if (biene.an) {
        if (!maus.imRaster && !biene.geht && jetzt - maus.zuletzt > 1500) biene.geht = true;
        const zx = biene.geht ? sx + B + 80 : maus.x + Math.cos(bild / 24) * 46;
        const zy = biene.geht ? biene.y - 1 : maus.y - 34 + Math.sin(bild / 17) * 20;
        biene.vx += (zx - biene.x) * 0.006; biene.vy += (zy - biene.y) * 0.006;
        biene.vx *= 0.93; biene.vy *= 0.93;
        biene.x += biene.vx; biene.y += biene.vy + Math.sin(bild / 5) * 0.6;
        if (Math.abs(biene.vx) > 0.4) biene.blick = biene.vx > 0 ? 1 : -1;
        if (bild % 3 === 0) { const [cx, cy] = zelle(biene.x - biene.blick * 20, biene.y + 8); heizen(cx, cy, 0.4, "#FBF062"); }
        if (biene.geht && biene.x > sx + B + 60) biene.an = false;
      }

      const bx = beben > 0.05 ? (Math.random() - 0.5) * beben * 10 : 0, byy = beben > 0.05 ? (Math.random() - 0.5) * beben * 10 : 0;
      beben *= 0.88;
      ctx.clearRect(0, 0, B, H);
      for (const [k, g] of glut) {
        const n = g.w * 0.93;
        if (n < 0.03) { glut.delete(k); continue; }
        g.w = n;
        const [cx, cy] = k.split(",").map(Number);
        const x = cx * Z - sx + bx, y = cy * Z + oy - sy + byy;
        if (x < -Z || y < -Z || x > B || y > H) continue;
        ctx.globalAlpha = Math.min(1, n * 1.15);
        ctx.fillStyle = g.f || farbeVon(cx, cy);
        ctx.fillRect(x, y, Z - 1, Z - 1);
      }
      ctx.globalAlpha = 1;
      ctxB.clearRect(0, 0, B, H);
      if (biene.an) bieneMalen(sx, sy);
      // Weiterlaufen, solange etwas passiert. Im Raster wartet die Schleife auch auf den Stillstand (Biene).
      if (glut.size || wellen.length || ladung.an || biene.an || beben > 0.05 || maus.imRaster) raf = requestAnimationFrame(takt);
    };
    const anwerfen = () => { if (!raf) raf = requestAnimationFrame(takt); };

    const zeiger = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const p = seite(e);
      maus.x = p.x; maus.y = p.y; maus.zuletzt = performance.now();
      maus.imRaster = p.y >= oben && p.y <= unten;
      if (ladung.an) { ladung.x = p.x; ladung.y = p.y; }
      if (!maus.imRaster) { anwerfen(); return; }
      const [cx, cy] = zelle(p.x, p.y);
      for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
        const d = Math.hypot(dx, dy);
        if (d > 2.3) continue;
        // Mitte sicher, Rand zufällig: so franst die Spur aus wie verstreute Pixel
        if (d > 1 && Math.random() > 0.45) continue;
        heizen(cx + dx, cy + dy, d < 1 ? 0.55 : 0.3);
      }
      // Karte betreten: ihr Rand blitzt im Raster in der Formatfarbe auf
      const karte = e.target.closest ? e.target.closest("[data-typ]") : null;
      if (karte !== letzteKarte) {
        letzteKarte = karte;
        if (karte) {
          const r = karte.getBoundingClientRect(), f = TYPFARBE[karte.dataset.typ] || "#FBF062";
          const [x0, y0] = zelle((r.left + window.scrollX) / zoom - Z, (r.top + window.scrollY) / zoom - Z);
          const [x1, y1] = zelle((r.right + window.scrollX) / zoom + Z, (r.bottom + window.scrollY) / zoom + Z);
          for (let x = x0; x <= x1; x += 1) { heizen(x, y0, 1, f); heizen(x, y1, 1, f); }
          for (let y = y0; y <= y1; y += 1) { heizen(x0, y, 1, f); heizen(x1, y, 1, f); }
        }
      }
      anwerfen();
    };
    const runter = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (e.button !== 0 || (e.target.closest && e.target.closest("a,button,input,textarea,select"))) return;
      const p = seite(e);
      if (p.y < oben || p.y > unten) return;
      ladung.an = true; ladung.t0 = performance.now(); ladung.x = p.x; ladung.y = p.y;
      document.body.style.userSelect = "none"; // Halten soll keinen Text markieren
      anwerfen();
    };
    const hoch = () => {
      if (!ladung.an) return;
      ladung.an = false; document.body.style.userSelect = "";
      const ch = Math.min((performance.now() - ladung.t0) / 2200, 1); // kurzer Klick sanft, langes Halten kräftig
      const [cx, cy] = zelle(ladung.x, ladung.y);
      wellen.push({ cx, cy, t: performance.now(), kraft: ch, weite: 14 + ch * 34 });
      if (ch > 0.5) wellen.push({ cx, cy, t: performance.now() + 140, kraft: ch * 0.6, weite: 10 + ch * 24 });
      beben = 0.3 + ch * 1.6;
      anwerfen();
    };
    const raus = () => { maus.imRaster = false; maus.zuletzt = performance.now(); letzteKarte = null; anwerfen(); };

    messen();
    window.addEventListener("pointermove", zeiger, { passive: true });
    window.addEventListener("pointerdown", runter, { passive: true });
    window.addEventListener("pointerup", hoch, { passive: true });
    window.addEventListener("pointercancel", hoch, { passive: true });
    document.documentElement.addEventListener("mouseleave", raus);
    window.addEventListener("resize", messen);
    // Die Höhe des Rastergrunds ändert sich, wenn die Inserate geladen sind
    const ziel = ursprung ? document.querySelector(ursprung) : null;
    const ro = typeof ResizeObserver !== "undefined" && ziel ? new ResizeObserver(messen) : null;
    ro?.observe(ziel);
    window.addEventListener("scroll", anwerfen, { passive: true });
    return () => {
      cancelAnimationFrame(raf); ro?.disconnect(); document.body.style.userSelect = "";
      window.removeEventListener("pointermove", zeiger); window.removeEventListener("pointerdown", runter);
      window.removeEventListener("pointerup", hoch); window.removeEventListener("pointercancel", hoch);
      document.documentElement.removeEventListener("mouseleave", raus);
      window.removeEventListener("resize", messen); window.removeEventListener("scroll", anwerfen);
    };
  }, [ursprung]);

  return (
    <>
      <canvas ref={ref} className="wl-feld" aria-hidden="true" />
      <canvas ref={obenRef} className="wl-feld wl-feld-oben" aria-hidden="true" />
    </>
  );
}
