"use client";
// Pixelfeld (Denis 19.09.2026). Fünfte Fassung: Das VERHALTEN ist dem Feld von craft.wild.as nachgebaut
// (dort studiert, hier eigener Code), weil die eigenen Fassungen davor nicht überzeugten:
//  - Blob: Unter dem Zeiger hängt ein weicher runder Fleck aus Kacheln. Er wird entlang des Wegs gestempelt,
//    damit eine schnelle Bewegung nicht abreisst, und hinterlässt nur eine kurze, schnell verglühende Spur.
//  - Farbbänder: Die Farbe einer Kachel kommt aus ihrer Wärme. Kern Zitrone, dann Blau, Violett, blasser Rand.
//    Rund 18 % der Kacheln flimmern in Akzentfarben, getaktet auf etwa 7 Bilder pro Sekunde.
//  - Inhalt bleibt frei: Um Texte herum wird mit ausgefranstem Rand ausgespart, das Feld füllt nur die Lücken.
//  - Pfeil: Nahe einer Überschrift wird der Fleck zu einem Pfeil, der auf sie zeigt, mit einem hellen Puls
//    zur Spitze und einem kurzen Wort in Klötzchenschrift darüber (data-wort an der Überschrift).
//  - Pixelbilder: Über Textstellen mit data-form füllt der Fleck ein Bild (Smiley, Stern, Blitz, Haus).
//    Das Herz ist das BEEDARO-Herz (gedrehtes Logo) und erscheint mit einem kleinen Funkenregen.
//  - Stillstand: Nach ein paar Sekunden ohne Bewegung fliegt die Pixel-Biene eine Rasterzeile entlang und
//    frisst eine Reihe Pollen-Punkte. Am Rand kehrt sie auf einer neuen Zeile zurück. Jede Bewegung beendet das.
//  - Inserate: Um die Karte unter dem Zeiger liegt eine ein Kachel breite Linie in der Formatfarbe, durch die
//    eine helle Welle läuft. Sie bleibt, solange man auf der Karte ist, und berührt die Nachbarkarte nicht.
//  - Aufladen: Maustaste auf freier Fläche halten, loslassen schickt eine Druckwelle (kurz = sanft, lang = gross).
//    Die Explosion fegt die Kacheln des Mosaiks oben weg (Ereignis wl-knall) und lässt die Seite leicht beben.
//  - Beim ersten Erscheinen streuen ein paar Kacheln ins Feld.
// Technik: nur auf dem Karoraster, hinter dem Inhalt, fängt keine Klicks ab, Wärme in Seitenkoordinaten
// (scrollt mit). Nur mit echter Maus, nichts bei Touch oder "Bewegung reduzieren". Die Schleife ruht, wenn nichts glüht.
import { useEffect, useRef } from "react";

const Z = 10;
const band = (h) => (h > 0.72 ? "#FBF062" : h > 0.5 ? "#3B5BD9" : h > 0.3 ? "#6C4CF1" : h > 0.12 ? "#CBD5F7" : null);
const AKZENT = ["#E0492A", "#D8FF00", "#1C2541"];
const TYPFARBE = { sell: "#F5C518", auction: "#3B5BD9", rent: "#6C4CF1", free: "#9BC400", service: "#E0492A" };
// BEEDARO-Herz: das Logo in Kacheln (drei Kacheln pro Logo-Quadrat), um 90 Grad gegen den Uhrzeiger gedreht.
// Links die sechs Quadrate des Logos, rechts der B-Körper mit seinen zwei Bögen. Gedreht liegen die Bögen oben.
const LOGO_LINKS = ["......XXX", "...XXX...", "XXX...XXX", "...XXX...", "......XXX"]; // je Logo-Reihe, wird dreifach gestapelt
const LOGO_B = ["XXXXX..", "XXXXXX.", "XXXXXXX", "XXXXXXX", "XXXXXXX", "XXXXXX.", "XXXXX..", "XXXXX..", "XXXXXX.", "XXXXXXX", "XXXXXXX", "XXXXXXX", "XXXXXXX", "XXXXXX.", "XXXXX.."];
const LOGO = LOGO_B.map((b, r) => LOGO_LINKS[Math.floor(r / 3)] + b);
const drehen = (bild) => Array.from({ length: bild[0].length }, (_, i) => Array.from({ length: bild.length }, (_, j) => bild[j][bild[0].length - 1 - i]).join(""));
// Bilder haben eine feste Farbe: So gelten sie nicht als Feld und werden über Texten nicht ausgespart.
const FORMEN = {
  herz: { mal: 1, f: "#E0492A", b: drehen(LOGO) }, // das BEEDARO-Herz (Denis 19.09.), mit Funkenregen
  smiley: { mal: 1, f: "#F5C518", b: ["...XXXXX...", ".XXXXXXXXX.", ".XXXXXXXXX.", "XXX.XXX.XXX", "XXX.XXX.XXX", "XXXXXXXXXXX", "XX.XXXXX.XX", "XXX.....XXX", ".XXXXXXXXX.", ".XXXXXXXXX.", "...XXXXX..."] },
  stern: { mal: 1, f: "#6C4CF1", b: ["....X....", "....X....", "...XXX...", "XXXXXXXXX", ".XXXXXXX.", "..XXXXX..", ".XXX.XXX.", ".XX...XX."] },
  blitz: { mal: 1, f: "#3B5BD9", b: ["....XXX", "...XXX.", "..XXX..", ".XXXXXX", "...XXX.", "..XXX..", ".XXX...", "XX....."] },
  haus: { mal: 1, f: "#1C2541", b: ["....X....", "...XXX...", "..XXXXX..", ".XXXXXXX.", "XXXXXXXXX", ".XX...XX.", ".XX.X.XX.", ".XX.X.XX."] },
};
// Klötzchenschrift 3 x 5 für die kurzen Wörter über dem Pfeil
const GLYPHE = {
  N: ["X.X", "XXX", "XXX", "X.X", "X.X"], E: ["XXX", "X..", "XX.", "X..", "XXX"], U: ["X.X", "X.X", "X.X", "X.X", "XXX"],
  W: ["X.X", "X.X", "XXX", "XXX", "X.X"], O: ["XXX", "X.X", "X.X", "X.X", "XXX"], H: ["X.X", "X.X", "XXX", "X.X", "X.X"],
  I: ["XXX", ".X.", ".X.", ".X.", "XXX"], A: [".X.", "X.X", "XXX", "X.X", "X.X"], "5": ["XXX", "X..", "XXX", "..X", "XXX"],
  X: ["X.X", "X.X", ".X.", "X.X", "X.X"], "!": [".X.", ".X.", ".X.", "...", ".X."],
};
// Biene in Kacheln, Kopf rechts. Y Körper, K Streifen, W Flügel, E Auge
const BIENE = ["..WW.WW..", "..WW.WW..", ".YKYKYKK.", "YYKYKYKEK", ".YKYKYKK."];
const BFARBE = { Y: "#F5C518", K: "#0A0A0A", W: "#B9C4CC", E: "#FFFFFF" };

const zufall = (a, b, c) => {
  let n = Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(c, 83492791);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};

export default function PixelFeld({ ursprung }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const fein = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fein || ruhig) return;
    const ctx = cv.getContext("2d");
    const grund = ursprung ? document.querySelector(ursprung) : null;
    const glut = new Map(); // "cx,cy" -> { w: Wärme 0..1, f: feste Farbe oder null }
    let wellen = [], funken = [], sperren = [], titel = [];
    let raf = 0, B = 0, H = 0, zoom = 1, oy = 0, oben = 0, unten = 0, bild = 0, beben = 0, streuen = 0, gestreut = false;
    const maus = { x: 0, y: 0, lx: null, ly: null, imRaster: false, zuletzt: 0 };
    const ladung = { an: false, t0: 0, x: 0, y: 0, cxBild: 0, cyBild: 0 };
    const biene = { an: false, x: 0, reihe: 0, richtung: 1, pollen: [] };
    let karte = null, form = null, formDavor = null, mosaik = 0; // mosaik: Höhe des Pixel-Mosaiks oben im Raster

    // Flächen, die frei bleiben (Texte), und die Überschriften, auf die der Pfeil zeigt. In Seitenkoordinaten.
    const seitenRect = (el) => {
      const r = el.getBoundingClientRect();
      return { l: (r.left + window.scrollX) / zoom, t: (r.top + window.scrollY) / zoom, r: (r.right + window.scrollX) / zoom, b: (r.bottom + window.scrollY) / zoom };
    };
    const vermessen = () => {
      if (!grund) return;
      sperren = [...grund.querySelectorAll(".wl-label, .wl-h2, .wl-mehr, .wl-format-name, .wl-format-sub, .wl-format-nr, .wl-probe, .wl-probe-pfeil")]
        .map((el, i) => ({ ...seitenRect(el), pad: 8 + (i % 4) * 5 }));
      titel = [...grund.querySelectorAll(".wl-h2")].map((el) => ({ ...seitenRect(el), wort: el.dataset.wort || "" }));
    };
    const messen = () => {
      // body trägt auf dem Desktop einen CSS-Zoom: Zeigerkoordinaten sind Bildschirm-Pixel,
      // die Zeichenfläche rechnet in gezoomten CSS-Pixeln
      zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
      B = Math.ceil(window.innerWidth / zoom); H = Math.ceil(window.innerHeight / zoom);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(B * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = B + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = grund ? grund.getBoundingClientRect() : null;
      oben = r ? (r.top + window.scrollY) / zoom : 0; unten = r ? (r.bottom + window.scrollY) / zoom : Infinity;
      oy = ((oben % Z) + Z) % Z; // Raster am Karopapier ausrichten
      const m = grund ? grund.querySelector(".wl-pixel") : null;
      mosaik = m ? Math.min(150, m.getBoundingClientRect().height / zoom) : 0; // die Fläche ist höher (Tropfen), das Mosaik selbst reicht etwa 150 px
      vermessen();
    };
    const gesperrt = (px, py, cx, cy) => {
      for (const s of sperren) {
        const p = s.pad + zufall(cx, cy, 7) * 14; // ausgefranster Rand statt sauberem Rechteck
        if (px > s.l - p && px < s.r + p && py > s.t - p && py < s.b + p) return true;
      }
      return false;
    };

    const seite = (e) => ({ x: (e.clientX + window.scrollX) / zoom, y: (e.clientY + window.scrollY) / zoom });
    const zelle = (x, y) => [Math.floor(x / Z), Math.floor((y - oy) / Z)];
    // Wärme setzen (nicht addieren): der Kern bleibt bei 1, nichts brennt aus
    const setzen = (cx, cy, wert, farbe) => {
      const y = cy * Z + oy;
      if (y < oben || y + Z > unten) return; // nur auf dem Karoraster
      const k = cx + "," + cy, alt = glut.get(k);
      if (alt) { if (wert > alt.w) alt.w = wert; alt.f = farbe || null; } else glut.set(k, { w: wert, f: farbe || null });
    };
    const fleck = (x, y, radius, staerke) => {
      const [cx, cy] = zelle(x, y), rand = Math.ceil(radius);
      for (let dy = -rand; dy <= rand; dy += 1) for (let dx = -rand; dx <= rand; dx += 1) {
        const d = Math.hypot(dx, dy) / radius;
        if (d < 1) setzen(cx + dx, cy + dy, (1 - d * d) * staerke);
      }
    };
    const bildStempeln = (F, x, y) => {
      const [mx, my] = zelle(x, y), m = F.mal, b = F.b;
      const x0 = mx - Math.floor((b[0].length * m) / 2), y0 = my - Math.floor((b.length * m) / 2);
      for (let r = 0; r < b.length * m; r += 1) for (let c = 0; c < b[0].length * m; c += 1) {
        if (b[Math.floor(r / m)][Math.floor(c / m)] === "X") setzen(x0 + c, y0 + r, 0.95, F.f);
      }
    };
    const wortStempeln = (wort, x, y) => {
      const [mx, my] = zelle(x, y), breite = wort.length * 4 - 1;
      [...wort].forEach((ch, i) => {
        const g = GLYPHE[ch];
        if (!g) return;
        g.forEach((zeile, r) => { for (let c = 0; c < 3; c += 1) if (zeile[c] === "X") setzen(mx - Math.floor(breite / 2) + i * 4 + c, my + r, 0.95, "#0A0A0A"); });
      });
    };
    // Pfeil vom Zeiger zur Überschrift: dünner Schaft, Widerhaken, heller Puls Richtung Spitze
    const pfeil = (x, y, zx, zy, wort) => {
      const w = Math.atan2(zy - y, zx - x), L = 9, puls = (bild * 0.35) % L;
      for (let i = 0; i <= L; i += 0.5) {
        const [cx, cy] = zelle(x + Math.cos(w) * i * Z, y + Math.sin(w) * i * Z);
        setzen(cx, cy, Math.abs(i - puls) < 1.2 ? 0.95 : 0.6);
      }
      const sx = x + Math.cos(w) * L * Z, sy = y + Math.sin(w) * L * Z;
      for (const seitlich of [-0.62, 0.62]) for (let i = 0; i <= 4; i += 0.5) {
        const [cx, cy] = zelle(sx - Math.cos(w + seitlich) * i * Z, sy - Math.sin(w + seitlich) * i * Z);
        setzen(cx, cy, 0.95);
      }
      // Wort auf der vom Ziel abgewandten Seite des Zeigers. Es hat eine feste Farbe (wird über Texten nicht
      // ausgespart) und bleibt unter dem Pixel-Mosaik am oberen Rand, das sonst die oberen Zeilen verdeckte.
      if (wort) wortStempeln(wort, Math.max(wort.length * 2 * Z + Z, x), Math.max(oben + mosaik + Z, zy < y ? y + 4 * Z : y - 9 * Z));
    };

    const takt = () => {
      raf = 0; bild += 1;
      const sx = window.scrollX / zoom, sy = window.scrollY / zoom, jetzt = performance.now();
      if (bild % 20 === 0) vermessen();

      // Beim ersten Erscheinen streuen ein paar Kacheln ins Feld
      if (streuen > 0) {
        for (let i = 0; i < streuen / 6; i += 1) {
          const [cx, cy] = zelle(sx + Math.random() * B, Math.max(oben, sy) + Math.random() * H);
          setzen(cx, cy, 0.25 + Math.random() * 0.6);
        }
        streuen -= 1;
      }

      const aktiv = maus.imRaster && !ladung.an && jetzt - maus.zuletzt < 5000;
      if (aktiv) {
        biene.an = false;
        if (form && FORMEN[form]) {
          bildStempeln(FORMEN[form], maus.x, maus.y);
          if (form === "herz" && formDavor !== "herz") { // Funkenregen beim ersten Auftauchen
            for (let i = 0; i < 22; i += 1) { const w = Math.random() * 6.28, t = 1.5 + Math.random() * 3; funken.push({ x: maus.x, y: maus.y, vx: Math.cos(w) * t, vy: Math.sin(w) * t - 1, leben: 1 }); }
          }
        } else if (!karte) {
          // Nächste Überschrift in Reichweite: Der Fleck wird zum Pfeil
          let ziel = null, nah = 170;
          for (const t of titel) {
            const nx = Math.max(t.l, Math.min(maus.x, t.r)), ny = Math.max(t.t, Math.min(maus.y, t.b));
            const d = Math.hypot(nx - maus.x, ny - maus.y);
            if (d > 24 && d < nah) { nah = d; ziel = { x: nx, y: ny, wort: t.wort }; }
          }
          if (ziel) pfeil(maus.x, maus.y, ziel.x, ziel.y, ziel.wort);
          else fleck(maus.x, maus.y, 3.4, 1);
        }
        formDavor = form;
      }

      // Inserat unter dem Zeiger: eine Kachel breite Linie rundherum, durch die eine helle Welle läuft
      if (karte && karte.isConnected && maus.imRaster) {
        const r = seitenRect(karte), f = TYPFARBE[karte.dataset.typ] || "#F5C518";
        const x0 = Math.round(r.l / Z) - 1, x1 = Math.round(r.r / Z), y0 = Math.round((r.t - oy) / Z) - 1, y1 = Math.round((r.b - oy) / Z);
        const rand = [];
        for (let x = x0; x <= x1; x += 1) rand.push([x, y0]);
        for (let y = y0 + 1; y <= y1; y += 1) rand.push([x1, y]);
        for (let x = x1 - 1; x >= x0; x -= 1) rand.push([x, y1]);
        for (let y = y1 - 1; y > y0; y -= 1) rand.push([x0, y]);
        const kopf = (bild * 0.8) % rand.length;
        rand.forEach(([x, y], i) => {
          const ab = Math.min(Math.abs(i - kopf), rand.length - Math.abs(i - kopf));
          setzen(x, y, 0.9, ab < 7 ? (ab < 3 ? "#0A0A0A" : "#FBF062") : f);
        });
      }

      // Aufladen: flackernder Fleck, der mit der Haltedauer wächst
      if (ladung.an) {
        const ch = Math.min((jetzt - ladung.t0) / 2200, 1);
        fleck(ladung.x + (Math.random() - 0.5) * ch * 8, ladung.y + (Math.random() - 0.5) * ch * 8, 3 + ch * 7, 1);
      }
      wellen = wellen.filter((w) => {
        const r = ((jetzt - w.t) / 1000) * (24 + w.kraft * 20), rand = Math.ceil(r) + 1;
        if (r < 0) return true;
        if (r > w.weite) return false;
        const staerke = 0.35 + (1 - r / w.weite) * 0.65, dicke = 0.7 + w.kraft * 1.1;
        for (let dy = -rand; dy <= rand; dy += 1) for (let dx = -rand; dx <= rand; dx += 1) {
          if (Math.abs(Math.hypot(dx, dy) - r) < dicke) setzen(w.cx + dx, w.cy + dy, staerke);
        }
        return true;
      });
      funken = funken.filter((f) => {
        f.x += f.vx * 3; f.y += f.vy * 3; f.vy += 0.12; f.leben -= 0.035;
        const [cx, cy] = zelle(f.x, f.y);
        setzen(cx, cy, Math.max(0.2, f.leben), "#E0492A");
        return f.leben > 0;
      });

      // Stillstand: Die Biene fliegt eine Rasterzeile entlang und frisst die Pollen-Punkte darauf
      if (maus.imRaster && !ladung.an && !karte && jetzt - maus.zuletzt >= 5000) {
        const pollenLegen = () => { biene.pollen = []; for (let c = Math.floor(sx / Z); c < (sx + B) / Z; c += 3) biene.pollen.push(c); };
        if (!biene.an) { biene.an = true; biene.richtung = 1; biene.reihe = zelle(maus.x, maus.y)[1]; biene.x = sx / Z - 10; pollenLegen(); }
        biene.x += 0.22 * biene.richtung;
        const maul = biene.x + (biene.richtung === 1 ? 4 : -4);
        biene.pollen = biene.pollen.filter((c) => (biene.richtung === 1 ? c > maul : c < maul));
        for (const c of biene.pollen) setzen(c, biene.reihe, 0.9, "#F5C518");
        const schlag = Math.floor(bild / 5) % 2, wipp = Math.round(Math.sin(bild / 9));
        BIENE.forEach((zeile, r) => {
          if (r === (schlag ? 0 : 1)) return;
          for (let c = 0; c < zeile.length; c += 1) {
            const ch = zeile[biene.richtung === 1 ? c : zeile.length - 1 - c];
            if (ch !== ".") setzen(Math.round(biene.x) - 4 + c, biene.reihe - 3 + r + wipp, 1, BFARBE[ch]);
          }
        });
        if (biene.x * Z > sx + B + 60 || biene.x * Z < sx - 120) { // am Rand: neue Zeile, zurück
          biene.richtung *= -1;
          const min = Math.max(oben, sy) + 60, max = Math.min(unten, sy + H) - 40;
          biene.reihe = zelle(0, min + Math.random() * Math.max(10, max - min))[1];
          pollenLegen();
        }
      } else biene.an = false;

      // Zeichnen: Farbe aus der Wärme, ein Teil der Kacheln flimmert, Texte bleiben frei
      const bx = beben > 0.05 ? (Math.random() - 0.5) * beben * 10 : 0, by = beben > 0.05 ? (Math.random() - 0.5) * beben * 10 : 0;
      beben *= 0.88;
      const tick = Math.floor(jetzt / 140);
      ctx.clearRect(0, 0, B, H);
      for (const [k, g] of glut) {
        g.w *= 0.86;
        if (g.w < 0.1) { glut.delete(k); continue; }
        const [cx, cy] = k.split(",").map(Number);
        const px = cx * Z, py = cy * Z + oy, x = px - sx + bx, y = py - sy + by;
        if (x < -Z || y < -Z || x > B || y > H) continue;
        if (!g.f && gesperrt(px + Z / 2, py + Z / 2, cx, cy)) continue;
        let farbe = g.f || band(g.w);
        if (!farbe) continue;
        if (!g.f && g.w > 0.3 && zufall(cx, cy, tick) < 0.18) farbe = AKZENT[Math.floor(zufall(cx, cy, tick + 9) * AKZENT.length)];
        ctx.fillStyle = farbe;
        ctx.fillRect(x, y, Z - 1, Z - 1);
      }
      if (glut.size || wellen.length || funken.length || ladung.an || streuen > 0 || beben > 0.05 || maus.imRaster) raf = requestAnimationFrame(takt);
    };
    const anwerfen = () => { if (!raf) raf = requestAnimationFrame(takt); };

    const zeiger = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const p = seite(e);
      maus.imRaster = p.y >= oben && p.y <= unten;
      // Fleck entlang des Wegs stempeln, damit eine schnelle Bewegung nicht abreisst
      if (maus.imRaster && maus.lx !== null && !karte && !form) {
        const d = Math.hypot(p.x - maus.lx, p.y - maus.ly), n = Math.min(12, Math.floor(d / 14));
        for (let i = 1; i < n; i += 1) fleck(maus.lx + ((p.x - maus.lx) * i) / n, maus.ly + ((p.y - maus.ly) * i) / n, 2.6, 0.7);
      }
      maus.x = p.x; maus.y = p.y; maus.lx = p.x; maus.ly = p.y; maus.zuletzt = performance.now();
      if (ladung.an) { ladung.x = p.x; ladung.y = p.y; ladung.cxBild = e.clientX; ladung.cyBild = e.clientY; }
      const stelle = maus.imRaster && e.target.closest ? e.target.closest("[data-form]") : null;
      form = stelle ? stelle.dataset.form : null;
      if (!form) formDavor = null;
      karte = maus.imRaster && e.target.closest ? e.target.closest("[data-typ]") : null;
      anwerfen();
    };
    const runter = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (e.button !== 0 || (e.target.closest && e.target.closest("a,button,input,textarea,select"))) return;
      const p = seite(e);
      if (p.y < oben || p.y > unten) return;
      ladung.an = true; ladung.t0 = performance.now(); ladung.x = p.x; ladung.y = p.y;
      ladung.cxBild = e.clientX; ladung.cyBild = e.clientY; // Bildschirmkoordinaten für das Mosaik
      document.body.style.userSelect = "none"; // Halten soll keinen Text markieren
      anwerfen();
    };
    const hoch = () => {
      if (!ladung.an) return;
      ladung.an = false; document.body.style.userSelect = "";
      const ch = Math.min((performance.now() - ladung.t0) / 2200, 1); // kurzer Klick sanft, langes Halten kräftig
      const [cx, cy] = zelle(ladung.x, ladung.y), t = performance.now();
      wellen.push({ cx, cy, t, kraft: ch, weite: 12 + ch * 46 });
      if (ch > 0.4) wellen.push({ cx, cy, t: t + 160, kraft: ch * 0.6, weite: 8 + ch * 30 });
      beben = 0.2 + ch * 1.8; maus.zuletzt = t;
      // Die Explosion meldet sich: Das Mosaik oben lässt seine Kacheln wegfliegen (PixelBand in WildLabor.jsx),
      // und die Seite deutet ein leichtes Beben an (Klasse wl-beben, Stärke als --beben in px).
      window.dispatchEvent(new CustomEvent("wl-knall", { detail: { x: ladung.cxBild, y: ladung.cyBild, kraft: ch } }));
      if (grund) {
        grund.style.setProperty("--beben", (0.6 + ch * 2.2).toFixed(1) + "px");
        grund.classList.remove("wl-beben"); void grund.offsetWidth; grund.classList.add("wl-beben");
        setTimeout(() => grund.classList.remove("wl-beben"), 500);
      }
      anwerfen();
    };
    const raus = () => { maus.imRaster = false; maus.lx = null; karte = null; form = null; anwerfen(); };

    messen();
    window.addEventListener("pointermove", zeiger, { passive: true });
    window.addEventListener("pointerdown", runter, { passive: true });
    window.addEventListener("pointerup", hoch, { passive: true });
    window.addEventListener("pointercancel", hoch, { passive: true });
    document.documentElement.addEventListener("mouseleave", raus);
    window.addEventListener("resize", messen);
    window.addEventListener("scroll", anwerfen, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" && grund ? new ResizeObserver(messen) : null;
    ro?.observe(grund);
    const io = typeof IntersectionObserver !== "undefined" && grund ? new IntersectionObserver((es) => {
      if (es[0].isIntersecting && !gestreut) { gestreut = true; streuen = 90; anwerfen(); }
    }) : null;
    io?.observe(grund);
    return () => {
      cancelAnimationFrame(raf); ro?.disconnect(); io?.disconnect(); document.body.style.userSelect = "";
      window.removeEventListener("pointermove", zeiger); window.removeEventListener("pointerdown", runter);
      window.removeEventListener("pointerup", hoch); window.removeEventListener("pointercancel", hoch);
      document.documentElement.removeEventListener("mouseleave", raus);
      window.removeEventListener("resize", messen); window.removeEventListener("scroll", anwerfen);
    };
  }, [ursprung]);

  return <canvas ref={ref} className="wl-feld" aria-hidden="true" />;
}
