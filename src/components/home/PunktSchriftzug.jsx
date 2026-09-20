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
import { B_PFAD } from "@/components/shared/BLogo";

const TEAL = "#1D1D1D";
// Farben umgekehrt (Denis 19.09.): Figur in Honig, Streifen und Augen in Ink
const BIENENFARBE = { H: "#1D1D1D", K: "#F4C03F", W: "#F4C03F", w: "#F4C03F", E: "#1D1D1D", A: "#F4C03F" };
// Biene als Punktbild, von vorn (dritte Fassung, 17 x 13, nach Denis' Vorlage vom 19.09.2026):
// Ink-Silhouette mit runden Flügeln, Kugelfühlern, zwei Honigstreifen und Stachel.
// K Körper, H Streifen, W Flügel, w Flügelrand (verschwindet beim Flügelschlag), E Auge, A Fühler.
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
// maxBreite: grösste Breite der Zeichenfläche. zerfall: der eigentliche Lookbook-Effekt (19.09.2026):
// Das Wort setzt sich beim Hereinscrollen aus verstreuten Punkten zusammen, steht in der Bildmitte
// ganz und zerfällt beim Weiterscrollen wieder. Dafür bekommt die Fläche oben und unten Luft.
// biene: false = nur der Schriftzug, keine Biene fliegt hindurch.
// woerter: Liste von Wörtern, zwischen denen der Schriftzug wechselt (alle `wechsel` ms). Die Punkte
// ordnen sich dabei zum nächsten Wort um. Ohne Liste bleibt es bei `wort`.
// kachel: true = Quadrate statt Punkte (Denis 20.09.2026: "nicht rund, sondern kachelig"), passend zum kacheligen B.
// logo: true = vor dem Wort steht das B-Zeichen, aus denselben Kacheln. gewicht: Schriftgewicht beim Rastern.
// kachelRand: Farbe eines 1 px Rands um jede Kachel. Damit lassen sich die echten Pastellfarben auf Weiss zeigen
// (Pastellfläche mit Ink-Rand, wie alle Flächen der Seite). farben: eine Farbe je Wort aus `woerter` (gleiche Reihenfolge). Das Wort trägt dann die Farbe dessen, wofür es steht.
// zerfall "einlauf": für den Seitenfuss. Das Wort setzt sich zusammen, während es von unten ins Bild kommt, und steht
// ganz, sobald es vollständig sichtbar ist (die Bildmitte erreicht ein Fuss nie).
export default function PunktSchriftzug({ wort = "BEEDARO", pause = 7000, farbe = TEAL, schrift = "General Sans", maxBreite = 620, zerfall = false, biene: mitBiene = true, woerter = null, wechsel = 3400, kachel = false, logo = false, gewicht = 800, mausRadius = 6, mausKraft = 0.9, farben = null, kachelRand = null }) {
  const cvRef = useRef(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const liste = woerter && woerter.length ? woerter : [wort];
    let nr = 0;
    let punkte = [], B = 0, H = 0, WH = 0, raster = 6, raf = 0, sichtbar = true, laeuft = false, tot = false, streuung = 0;
    const biene = { an: false, x: 0, y: 0, t: 0, richtung: 1, pollen: null };
    const maus = { x: -9999, y: -9999 };

    // Ein Wort unsichtbar setzen und an den Rasterpunkten abtasten. Liefert die Punktpositionen.
    const abtasten = (text) => {
      const m = document.createElement("canvas"); m.width = B; m.height = H;
      const mx = m.getContext("2d");
      let grad = WH * 0.92;
      const satz = (g) => `${gewicht} ${g}px "${schrift}", "General Sans", "Manrope", Arial, sans-serif`;
      // Mit Logo: B-Zeichen links, dann eine Lücke, dann das Wort. Alles zusammen wird mittig gesetzt.
      const masse = (g) => { mx.font = satz(g); const tw = mx.measureText(text).width; const lh = logo ? g * 0.74 : 0, lw = lh * (911.7 / 885.5), luecke = logo ? g * 0.2 : 0; return { tw, lh, lw, luecke, ganz: tw + lw + luecke }; };
      let m0 = masse(grad);
      if (m0.ganz > B - raster * 2) { grad *= (B - raster * 2) / m0.ganz; m0 = masse(grad); }
      mx.font = satz(grad);
      const links = (B - m0.ganz) / 2;
      if (logo) {
        const s = m0.lh / 885.5;
        mx.save(); mx.translate(links, H / 2 - m0.lh / 2 + grad * 0.02); mx.scale(s, s); mx.fill(new Path2D(B_PFAD)); mx.restore();
      }
      mx.textAlign = "left"; mx.textBaseline = "middle";
      mx.fillText(text, links + m0.lw + m0.luecke, H / 2 + grad * 0.04);
      const d = mx.getImageData(0, 0, B, H).data;
      const out = [];
      for (let y = raster / 2; y < H; y += raster) {
        for (let x = raster / 2; x < B; x += raster) {
          if (d[(Math.floor(y) * B + Math.floor(x)) * 4 + 3] > 110) out.push({ x, y });
        }
      }
      return out;
    };

    // Wortwechsel: Die vorhandenen Punkte bekommen neue Plätze und federn dorthin. Braucht das neue
    // Wort mehr Punkte, teilen sich welche, braucht es weniger, fallen die überzähligen weg.
    const wechsle = () => {
      if (liste.length < 2 || !sichtbar || ruhig || document.hidden || streuung > 8 || !punkte.length) return;
      nr = (nr + 1) % liste.length;
      const ziele = abtasten(liste[nr]);
      const alt = punkte.slice().sort(() => Math.random() - 0.5);
      punkte = ziele.map((z, k) => {
        const q = k < alt.length ? alt[k] : { ...alt[Math.floor(Math.random() * alt.length)] };
        q.hx = z.x; q.hy = z.y; q.vx += (Math.random() - 0.5) * 5; q.vy += (Math.random() - 0.5) * 5;
        return q;
      });
      cv.setAttribute("aria-label", liste[nr]);
      anwerfen();
    };

    const aufbauen = () => {
      const breite = Math.min(maxBreite, cv.parentElement.clientWidth);
      if (breite < 60) return;
      if (breite === B && punkte.length) return; // ResizeObserver meldet auch ohne Breitenänderung
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      // WH = Höhe des Worts. Mit Zerfall kommt oben und unten Luft dazu, sonst würden die Punkte abgeschnitten.
      WH = Math.round(breite * 0.2);
      B = breite; H = WH + (zerfall ? Math.round(WH * (zerfall === "einlauf" ? 0.45 : 1.1)) : 0);
      raster = kachelRand ? (breite > 900 ? 11 : breite > 480 ? 8 : 6) : (breite > 900 ? 8 : breite > 480 ? 6 : 5);
      cv.width = Math.round(B * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = B + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      punkte = abtasten(liste[nr]).map((z) => {
        // zx/zy: fester Zufallsversatz pro Punkt, wohin er beim Zerfall treibt
        const w = Math.random() * 6.2832, weit = 0.35 + Math.random() * 0.65;
        return { hx: z.x, hy: z.y, x: z.x, y: z.y, vx: 0, vy: 0, zx: Math.cos(w) * weit, zy: Math.sin(w) * weit * 0.6 };
      });
      lage();
      // Gleich verstreut beginnen, sonst sähe man beim ersten Bild ein ganzes Wort auseinanderfliegen
      for (const p of punkte) { p.x = p.hx + p.zx * streuung; p.y = p.hy + p.zy * streuung; }
      malen();
    };

    // Zerfall: 0 in der Bildmitte, 1 am oberen und unteren Bildrand. Quadratisch, damit das Wort
    // in einem breiten Bereich um die Mitte ganz bleibt.
    const lage = () => {
      if (!zerfall || ruhig) { streuung = 0; return; }
      const b = cv.getBoundingClientRect(), vh = window.innerHeight || 1;
      if (zerfall === "einlauf") {
        const t = Math.max(0, Math.min(1, (b.bottom - vh) / (b.height * 0.9)));
        streuung = t * t * Math.min(B * 0.22, 260);
        return;
      }
      const ab = Math.abs(b.top + b.height / 2 - vh / 2) / (vh / 2);
      const t = Math.max(0, Math.min(1, (ab - 0.18) / 0.82));
      streuung = t * t * Math.min(B * 0.22, 260);
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
      ctx.fillStyle = (farben && farben[nr]) || farbe;
      if (kachelRand) { ctx.strokeStyle = kachelRand; ctx.lineWidth = 1; }
      const r = raster * 0.4;
      for (const p of punkte) {
        if (p.x < r || p.x > B - r || p.y < r || p.y > H - r) continue; // halbe Punkte an der Kante weglassen
        if (kachel) { const s = raster * 0.86; ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s); if (kachelRand) ctx.strokeRect(p.x - s / 2 + 0.5, p.y - s / 2 + 0.5, s - 1, s - 1); }
        else { ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill(); }
      }
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
        biene.y = H / 2 + Math.sin(biene.t / 16) * WH * 0.24 + Math.sin(biene.t / 5) * 1.2;
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
      if (maus.x > -9000) stoss(maus.x, maus.y, raster * mausRadius, mausKraft); // mausRadius: Grösse des Kreises, den der Zeiger freiräumt
      for (const p of punkte) {
        if (p === biene.pollen) continue;
        // Ziel in der Fläche halten, sonst schneidet der Rand der Zeichenfläche die Punkte ab
        const tx = Math.max(raster, Math.min(B - raster, p.hx + p.zx * streuung)), ty = Math.max(raster, Math.min(H - raster, p.hy + p.zy * streuung));
        p.vx += (tx - p.x) * 0.05; p.vy += (ty - p.y) * 0.05;
        p.vx *= 0.83; p.vy *= 0.83; p.x += p.vx; p.y += p.vy;
        if (Math.abs(p.vx) > 0.02 || Math.abs(p.vy) > 0.02 || Math.abs(tx - p.x) > 0.05 || Math.abs(ty - p.y) > 0.05) bewegt = true;
      }
      malen();
      if (bewegt && sichtbar) raf = requestAnimationFrame(takt); else laeuft = false;
    };
    const anwerfen = () => { if (!laeuft && sichtbar && !ruhig && !tot) { laeuft = true; raf = requestAnimationFrame(takt); } };

    const losfliegen = () => {
      if (!mitBiene || biene.an || !sichtbar || ruhig || document.hidden || streuung > 8) return;
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
    if (document.fonts && document.fonts.load) document.fonts.load(`${gewicht} 80px "${schrift}"`).then(start, start); else start();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => aufbauen()) : null;
    ro?.observe(cv.parentElement);
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((es) => { sichtbar = es[0].isIntersecting; if (sichtbar) anwerfen(); }) : null;
    io?.observe(cv);
    cv.addEventListener("mousemove", bewegung);
    cv.addEventListener("mouseleave", weg);
    const rollen = () => { lage(); anwerfen(); };
    if (zerfall) { window.addEventListener("scroll", rollen, { passive: true }); window.addEventListener("resize", rollen); }
    const erster = setTimeout(losfliegen, 1200);
    const takter = setInterval(losfliegen, pause);
    const wechsler = liste.length > 1 ? setInterval(wechsle, wechsel) : 0;

    return () => {
      tot = true; cancelAnimationFrame(raf); clearTimeout(erster); clearInterval(takter); clearInterval(wechsler);
      ro?.disconnect(); io?.disconnect();
      cv.removeEventListener("mousemove", bewegung); cv.removeEventListener("mouseleave", weg);
      window.removeEventListener("scroll", rollen); window.removeEventListener("resize", rollen);
    };
  }, [wort, pause, farbe, schrift, maxBreite, zerfall, mitBiene, wechsel, kachel, logo, gewicht, mausRadius, mausKraft, (woerter || []).join("|"), (farben || []).join("|"), kachelRand]);

  return <canvas ref={cvRef} className="bh-wort" role="img" aria-label="Beedaro" />;
}
