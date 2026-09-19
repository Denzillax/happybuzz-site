"use client";
// Pixelfeld (Denis 19.09.2026). Sechste Fassung: EIN gemeinsames Feld, so wie craft.wild.as es macht
// (dort das Prinzip studiert, hier eigener Code). Die Fassungen davor hatten oben ein eigenes Mosaik
// und darunter einen getrennten Zeiger-Effekt, das wirkte nie wie aus einem Guss.
//
// Prinzip: Jede Kachel des Karorasters hat einen Wert. Er setzt sich zusammen aus
//   - der LANDSCHAFT: langsam wandernde Wolken aus überlagerten Sinuswellen. Am oberen Rand des Rasters
//     hängt sie herab (das "Mosaik") und endet im freien Band über den Inseraten,
//   - der WÄRME des Zeigers: ein weicher Fleck, entlang des Wegs gestempelt, der schnell verglüht.
// Der Wert wird wie bei einer Höhenkarte in Farbbänder geschnitten: Navy, Blau, Zitrone, Orangerot, am
// heissesten Lime. Der Zeiger hebt also dieselbe Landschaft an, darum entstehen um ihn die Farbringe.
//
// Dazu, fest eingefärbt und über die Landschaft gelegt:
//   - Pfeil zur nächsten Überschrift mit hellem Puls und einem kurzen Klötzchenwort (data-wort),
//   - Pixelbilder über Textstellen mit data-form (Smiley, Stern, Blitz, Haus), das Herz ist das BEEDARO-Herz
//     (gedrehtes Logo) und kommt mit Funkenregen,
//   - bei Stillstand fliegt die Pixel-Biene eine Zeile entlang und frisst eine Reihe Pollen,
//   - unter dem Inserat, auf dem der Zeiger steht, eine Kachelreihe in der Formatfarbe, die sich von der Mitte her aufbaut.
// Aufladen (Maustaste halten) und Loslassen: Druckwelle, leichtes Beben der Inhalte, und die Explosion
// reisst ein Loch in die Landschaft, das langsam wieder zuwächst.
// Texte bleiben mit ausgefranstem Rand frei. Nur auf dem Karoraster, hinter dem Inhalt, fängt keine Klicks ab.
// Ohne echte Maus steht nur die Landschaft (ruhig animiert), mit "Bewegung reduzieren" steht sie still.
import { useEffect, useRef } from "react";

const Z = 10;
const BAENDER = [[0.3, "#1C2541"], [0.46, "#3B5BD9"], [0.62, "#FBF062"], [0.78, "#E0492A"]];
const band = (v) => {
  if (v < 0.3) return null;
  if (v >= 0.88) return "#D8FF00";
  let f = BAENDER[0][1];
  for (const [ab, farbe] of BAENDER) if (v >= ab) f = farbe;
  return f;
};
const TYPFARBE = { sell: "#F5C518", auction: "#3B5BD9", rent: "#6C4CF1", free: "#9BC400", service: "#E0492A" };
// BEEDARO-Herz: das Logo in Kacheln (drei Kacheln pro Logo-Quadrat), um 90 Grad gegen den Uhrzeiger gedreht
const LOGO_LINKS = ["......XXX", "...XXX...", "XXX...XXX", "...XXX...", "......XXX"];
const LOGO_B = ["XXXXX..", "XXXXXX.", "XXXXXXX", "XXXXXXX", "XXXXXXX", "XXXXXX.", "XXXXX..", "XXXXX..", "XXXXXX.", "XXXXXXX", "XXXXXXX", "XXXXXXX", "XXXXXXX", "XXXXXX.", "XXXXX.."];
const LOGO = LOGO_B.map((b, r) => LOGO_LINKS[Math.floor(r / 3)] + b);
const drehen = (bild) => Array.from({ length: bild[0].length }, (_, i) => Array.from({ length: bild.length }, (_, j) => bild[j][bild[0].length - 1 - i]).join(""));
const FORMEN = {
  herz: { f: "#E0492A", b: drehen(LOGO) },
  smiley: { f: "#F5C518", b: ["...XXXXX...", ".XXXXXXXXX.", ".XXXXXXXXX.", "XXX.XXX.XXX", "XXX.XXX.XXX", "XXXXXXXXXXX", "XX.XXXXX.XX", "XXX.....XXX", ".XXXXXXXXX.", ".XXXXXXXXX.", "...XXXXX..."] },
  stern: { f: "#6C4CF1", b: ["....X....", "....X....", "...XXX...", "XXXXXXXXX", ".XXXXXXX.", "..XXXXX..", ".XXX.XXX.", ".XX...XX."] },
  blitz: { f: "#3B5BD9", b: ["....XXX", "...XXX.", "..XXX..", ".XXXXXX", "...XXX.", "..XXX..", ".XXX...", "XX....."] },
  haus: { f: "#1C2541", b: ["....X....", "...XXX...", "..XXXXX..", ".XXXXXXX.", "XXXXXXXXX", ".XX...XX.", ".XX.X.XX.", ".XX.X.XX."] },
};
const GLYPHE = {
  N: ["X.X", "XXX", "XXX", "X.X", "X.X"], E: ["XXX", "X..", "XX.", "X..", "XXX"], U: ["X.X", "X.X", "X.X", "X.X", "XXX"],
  W: ["X.X", "X.X", "XXX", "XXX", "X.X"], O: ["XXX", "X.X", "X.X", "X.X", "XXX"], H: ["X.X", "X.X", "XXX", "X.X", "X.X"],
  I: ["XXX", ".X.", ".X.", ".X.", "XXX"], A: [".X.", "X.X", "XXX", "X.X", "X.X"], "5": ["XXX", "X..", "XXX", "..X", "XXX"],
  X: ["X.X", "X.X", ".X.", "X.X", "X.X"], "!": [".X.", ".X.", ".X.", "...", ".X."],
};
// Biene in Kacheln, Kopf rechts. Ihr Flügel ist das BEEDARO-Herz im Kleinen (Denis 19.09.): zwei Bögen oben,
// darunter die versetzten Quadrate als Spitze. Y Körper, K Streifen, W Flügel, E Auge. Körper = Zeilen 6 bis 8.
const BIENE = ["..WW.WW..", "..WWWWW..", "..WWWWW..", "..W.W.W..", "...W.W...", "....W....", ".YKYKYKK.", "YYKYKYKEK", ".YKYKYKK."];
const BFARBE = { Y: "#F5C518", K: "#0A0A0A", W: "#E0492A", E: "#FFFFFF" }; // Flügel im Rot des Favoriten-Herzens

export default function PixelFeld({ ursprung }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const fein = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = cv.getContext("2d");
    const grund = ursprung ? document.querySelector(ursprung) : null;
    const S1 = Math.random() * 40, S2 = Math.random() * 40, S3 = Math.random() * 40; // jede Sitzung eine andere Landschaft
    const waerme = new Map(); // "cx,cy" -> Wärme 0..1 (Zeiger, Wellen), wird in Bänder geschnitten
    const fest = new Map();   // "cx,cy" -> { w, f }: fest eingefärbte Kacheln (Bilder, Wort, Biene, Kartenrand)
    let wellen = [], funken = [], loecher = [], sperren = [], titel = [];
    let raf = 0, B = 0, H = 0, zoom = 1, oy = 0, oben = 0, unten = 0, bild = 0, beben = 0, sichtbar = true, start = performance.now();
    const maus = { x: 0, y: 0, lx: null, ly: null, imRaster: false, zuletzt: 0 };
    const ladung = { an: false, t0: 0, x: 0, y: 0 };
    const biene = { an: false, x: 0, reihe: 0, richtung: 1, pollen: [] };
    let karte = null, karteDavor = null, karteSeit = 0, form = null, formDavor = null, kopfband = 190; // kopfband: Höhe des freien Bands oben, nur dort steht Landschaft

    const seitenRect = (el) => {
      const r = el.getBoundingClientRect();
      return { l: (r.left + window.scrollX) / zoom, t: (r.top + window.scrollY) / zoom, r: (r.right + window.scrollX) / zoom, b: (r.bottom + window.scrollY) / zoom };
    };
    // Flächen, die frei bleiben (Texte), und die Überschriften, auf die der Pfeil zeigt. In Seitenkoordinaten.
    const vermessen = () => {
      if (!grund) return;
      sperren = [...grund.querySelectorAll(".wl-label, .wl-h2, .wl-mehr, .wl-format-name, .wl-format-sub, .wl-format-nr, .wl-probe, .wl-probe-pfeil")]
        .map((el, i) => ({ ...seitenRect(el), pad: 10 + (i % 4) * 6 }));
      titel = [...grund.querySelectorAll(".wl-h2")].map((el) => ({ ...seitenRect(el), wort: el.dataset.wort || "" }));
    };
    const messen = () => {
      // body trägt auf dem Desktop einen CSS-Zoom: Zeigerkoordinaten sind Bildschirm-Pixel, die Fläche rechnet in gezoomten CSS-Pixeln
      zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
      B = Math.ceil(window.innerWidth / zoom); H = Math.ceil(window.innerHeight / zoom);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(B * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = B + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = grund ? grund.getBoundingClientRect() : null;
      oben = r ? (r.top + window.scrollY) / zoom : 0; unten = r ? (r.bottom + window.scrollY) / zoom : Infinity;
      oy = ((oben % Z) + Z) % Z; // Raster am Karopapier ausrichten
      const kb = grund ? grund.querySelector(".wl-kopfband") : null;
      if (kb) kopfband = kb.getBoundingClientRect().height / zoom;
      vermessen();
    };
    const streu = (a, b) => { const n = Math.sin(a * 127.1 + b * 311.7 + S1) * 43758.5453; return n - Math.floor(n); };
    const gesperrt = (px, py, cx, cy) => {
      for (const s of sperren) {
        const p = s.pad + streu(cx, cy) * 16; // ausgefranster Rand statt sauberem Rechteck
        if (px > s.l - p && px < s.r + p && py > s.t - p && py < s.b + p) return true;
      }
      return false;
    };

    // Landschaft: überlagerte Wellen mit leichter Verzerrung, Ergebnis etwa 0..1
    const wolken = (x, y, t) => {
      const nx = x + Math.sin(y * 4.6 + t * 0.4 + S2) * 0.05, ny = y + Math.cos(x * 4.2 - t * 0.33) * 0.05;
      const v = Math.sin(nx * 6.1 + t * 0.27 + S1) * Math.cos(ny * 5.3 - t * 0.21 + S2) + 0.9 * Math.sin((nx * 1.3 + ny * 1.9) * 4.4 + t * 0.15 - S3)
        + 0.45 * Math.sin(ny * 10.2 + nx * 2.7 + S3) + 0.25 * Math.sin(nx * 14.1 - S2);
      return 0.5 + 0.5 * (v / 2.6);
    };

    const seite = (e) => ({ x: (e.clientX + window.scrollX) / zoom, y: (e.clientY + window.scrollY) / zoom });
    const zelle = (x, y) => [Math.floor(x / Z), Math.floor((y - oy) / Z)];
    const imFeld = (cy) => { const y = cy * Z + oy; return y >= oben && y + Z <= unten; };
    const malFest = (cx, cy, farbe, w = 1) => { if (imFeld(cy)) fest.set(cx + "," + cy, { w, f: farbe }); };
    // Wärme weich auftragen (Glockenform), gedeckelt bei 1
    const auftragen = (x, y, menge, sigma) => {
      const fx = x / Z, fy = (y - oy) / Z, rand = Math.ceil(sigma * 1.7), inv = 1 / (2 * sigma * sigma * 0.2);
      for (let dy = -rand; dy <= rand; dy += 1) for (let dx = -rand; dx <= rand; dx += 1) {
        const cx = Math.floor(fx) + dx, cy = Math.floor(fy) + dy;
        if (!imFeld(cy)) continue;
        const ax = cx + 0.5 - fx, ay = cy + 0.5 - fy, g = Math.exp(-(ax * ax + ay * ay) * inv);
        if (g < 0.02) continue;
        const k = cx + "," + cy;
        waerme.set(k, Math.min(1, (waerme.get(k) || 0) + menge * g));
      }
    };
    const heiss = (cx, cy, wert) => { if (imFeld(cy)) { const k = cx + "," + cy; if ((waerme.get(k) || 0) < wert) waerme.set(k, wert); } };

    const bildStempeln = (F, x, y) => {
      const [mx, my] = zelle(x, y), b = F.b;
      const x0 = mx - Math.floor(b[0].length / 2), y0 = my - Math.floor(b.length / 2);
      b.forEach((zeile, r) => { for (let c = 0; c < zeile.length; c += 1) if (zeile[c] === "X") malFest(x0 + c, y0 + r, F.f); });
    };
    const wortStempeln = (wort, x, y) => {
      const [mx, my] = zelle(x, y), breite = wort.length * 4 - 1;
      [...wort].forEach((ch, i) => {
        const g = GLYPHE[ch];
        if (g) g.forEach((zeile, r) => { for (let c = 0; c < 3; c += 1) if (zeile[c] === "X") malFest(mx - Math.floor(breite / 2) + i * 4 + c, my + r, "#0A0A0A"); });
      });
    };
    // Pfeil vom Zeiger zur Überschrift: dünner Schaft, Widerhaken, heller Puls Richtung Spitze. Er ist Wärme, also farbig gebändert.
    const pfeil = (x, y, zx, zy, wort) => {
      const w = Math.atan2(zy - y, zx - x), L = 9, puls = (bild * 0.35) % L;
      for (let i = 0; i <= L; i += 0.5) { const [cx, cy] = zelle(x + Math.cos(w) * i * Z, y + Math.sin(w) * i * Z); heiss(cx, cy, Math.abs(i - puls) < 1.2 ? 0.95 : 0.7); }
      const sx = x + Math.cos(w) * L * Z, sy = y + Math.sin(w) * L * Z;
      for (const seitlich of [-0.62, 0.62]) for (let i = 0; i <= 4; i += 0.5) {
        const [cx, cy] = zelle(sx - Math.cos(w + seitlich) * i * Z, sy - Math.sin(w + seitlich) * i * Z); heiss(cx, cy, 0.82);
      }
      if (wort) wortStempeln(wort, Math.max(wort.length * 2 * Z + Z, x), Math.max(oben + 3 * Z, zy < y ? y + 4 * Z : y - 9 * Z));
    };

    const takt = () => {
      raf = 0; bild += 1;
      const sx = window.scrollX / zoom, sy = window.scrollY / zoom, jetzt = performance.now();
      const t = ruhig ? 0 : jetzt / 1000, einblenden = ruhig ? 1 : Math.min(1, (jetzt - start) / 1600);
      if (bild % 20 === 0) vermessen();

      if (fein && !ruhig) {
        const aktiv = maus.imRaster && !ladung.an && jetzt - maus.zuletzt < 5000;
        if (aktiv) {
          biene.an = false;
          if (form && FORMEN[form]) {
            bildStempeln(FORMEN[form], maus.x, maus.y);
            if (form === "herz" && formDavor !== "herz") { // Funkenregen beim ersten Auftauchen
              for (let i = 0; i < 22; i += 1) { const w = Math.random() * 6.28, v = 1.5 + Math.random() * 3; funken.push({ x: maus.x, y: maus.y, vx: Math.cos(w) * v, vy: Math.sin(w) * v - 1, leben: 1 }); }
            }
          } else if (!karte) {
            let ziel = null, nah = 170; // nächste Überschrift in Reichweite: der Fleck wird zum Pfeil
            for (const ti of titel) {
              const nx = Math.max(ti.l, Math.min(maus.x, ti.r)), ny = Math.max(ti.t, Math.min(maus.y, ti.b));
              const d = Math.hypot(nx - maus.x, ny - maus.y);
              if (d > 24 && d < nah) { nah = d; ziel = { x: nx, y: ny, wort: ti.wort }; }
            }
            if (ziel) pfeil(maus.x, maus.y, ziel.x, ziel.y, ziel.wort);
            else auftragen(maus.x, maus.y, 0.16, 3.2);
          }
          formDavor = form;
        }

        // Inserat unter dem Zeiger: eine Kachelreihe NUR an der Unterkante, in der Formatfarbe. Sie baut sich von der
        // Mitte nach aussen auf und bleibt dann ruhig stehen (Denis 19.09.: kein Rand rundherum, kein blinkendes Gelb).
        if (karte !== karteDavor) { karteDavor = karte; karteSeit = jetzt; }
        if (karte && karte.isConnected && maus.imRaster) {
          const r = seitenRect(karte), f = TYPFARBE[karte.dataset.typ] || "#F5C518";
          const x0 = Math.round(r.l / Z), x1 = Math.round(r.r / Z) - 1, y = Math.round((r.b - oy) / Z);
          const mitte = (x0 + x1) / 2, halb = (x1 - x0) / 2 + 0.5, p = Math.min(1, (jetzt - karteSeit) / 380), weit = halb * (1 - (1 - p) * (1 - p));
          for (let x = x0; x <= x1; x += 1) if (Math.abs(x - mitte) <= weit) malFest(x, y, f);
        }

        if (ladung.an) { // Aufladen: die Wärme unter dem Zeiger wächst mit der Haltedauer
          const ch = Math.min((jetzt - ladung.t0) / 2200, 1);
          // grösserer Kreis beim Drücken (Denis 19.09.): startet sichtbar grösser als der Zeigerfleck und wächst bis etwa 150 px Radius
          auftragen(ladung.x + (Math.random() - 0.5) * ch * 10, ladung.y + (Math.random() - 0.5) * ch * 10, 0.3, 6 + ch * 17);
        }
        wellen = wellen.filter((w) => {
          const r = ((jetzt - w.t) / 1000) * (24 + w.kraft * 20), rand = Math.ceil(r) + 1;
          if (r < 0) return true;
          if (r > w.weite) return false;
          // Gefüllte Scheibe wie bei wild, kein leerer Ring (Denis 19.09.): innen am heissesten, nach aussen kühler.
          // So zeigt die Explosion alle Farbbänder als Ringe. Mit dem Wachsen kühlt sie insgesamt ab.
          const kuehl = 1 - (r / w.weite) * 0.55;
          for (let dy = -rand; dy <= rand; dy += 1) for (let dx = -rand; dx <= rand; dx += 1) {
            const d = Math.hypot(dx, dy);
            if (d <= r) heiss(w.cx + dx, w.cy + dy, (1 - (d / Math.max(1, r)) * 0.62) * kuehl);
          }
          return true;
        });
        funken = funken.filter((f) => {
          f.x += f.vx * 3; f.y += f.vy * 3; f.vy += 0.12; f.leben -= 0.035;
          const [cx, cy] = zelle(f.x, f.y); malFest(cx, cy, "#E0492A", Math.max(0.3, f.leben));
          return f.leben > 0;
        });

        // Stillstand: Die Biene fliegt eine Rasterzeile entlang und frisst die Pollen-Punkte darauf
        if (maus.imRaster && !ladung.an && !karte && jetzt - maus.zuletzt >= 5000) {
          const pollenLegen = () => { biene.pollen = []; for (let c = Math.floor(sx / Z); c < (sx + B) / Z; c += 3) biene.pollen.push(c); };
          if (!biene.an) { biene.an = true; biene.richtung = 1; biene.reihe = zelle(maus.x, maus.y)[1]; biene.x = sx / Z - 10; pollenLegen(); }
          biene.x += 0.22 * biene.richtung;
          const maul = biene.x + (biene.richtung === 1 ? 4 : -4);
          biene.pollen = biene.pollen.filter((c) => (biene.richtung === 1 ? c > maul : c < maul));
          for (const c of biene.pollen) malFest(c, biene.reihe, "#F5C518");
          const schlag = Math.floor(bild / 5) % 2, wipp = Math.round(Math.sin(bild / 9));
          BIENE.forEach((zeile, r) => {
            if (schlag && (r === 0 || r === 5)) return; // Flügelschlag: das Herz zieht sich kurz zusammen
            for (let c = 0; c < zeile.length; c += 1) {
              const ch = zeile[biene.richtung === 1 ? c : zeile.length - 1 - c];
              if (ch !== ".") malFest(Math.round(biene.x) - 4 + c, biene.reihe - 7 + r + wipp, BFARBE[ch]); // Körpermitte (Zeile 7) auf der Pollenreihe
            }
          });
          if (biene.x * Z > sx + B + 60 || biene.x * Z < sx - 120) { // am Rand: neue Zeile, zurück
            biene.richtung *= -1;
            const min = Math.max(oben, sy) + 60, max = Math.min(unten, sy + H) - 40;
            biene.reihe = zelle(0, min + Math.random() * Math.max(10, max - min))[1];
            pollenLegen();
          }
        } else biene.an = false;
      }

      // Wärme verglüht schnell (kurze Spur), Löcher der Explosion wachsen zu
      for (const [k, w] of waerme) { const n = w * 0.88; if (n < 0.01) waerme.delete(k); else waerme.set(k, n); }
      loecher = loecher.filter((l) => jetzt - l.t < l.dauer);

      // Zeichnen: für jede sichtbare Kachel des Rasters Landschaft + Wärme, in Farbbänder geschnitten
      const bx = beben > 0.05 ? (Math.random() - 0.5) * beben * 8 : 0, by = beben > 0.05 ? (Math.random() - 0.5) * beben * 8 : 0;
      beben *= 0.88;
      ctx.clearRect(0, 0, B, H);
      const c0 = Math.floor(sx / Z), c1 = Math.ceil((sx + B) / Z);
      const r0 = Math.max(Math.floor((sy - oy) / Z), Math.ceil((oben - oy) / Z)), r1 = Math.min(Math.ceil((sy + H - oy) / Z), Math.floor((unten - oy) / Z) - 1);
      for (let cy = r0; cy <= r1; cy += 1) {
        const py = cy * Z + oy, tiefe = py - oben, ny = py / 900;
        // Oben hängt die Landschaft wie Wolken herab: Mit der Tiefe wird ein wachsender Betrag abgezogen, es bleiben
        // nur die Gipfel. Sie endet im freien Band über den Inseraten (Denis 19.09.: sie ging zu weit in die
        // Artikel hinein). Darunter gibt es keine Landschaft mehr, nur noch die Wärme des Zeigers.
        const abzug = tiefe / 170, mitLand = tiefe < kopfband;
        for (let cx = c0; cx <= c1; cx += 1) {
          const px = cx * Z, k = cx + "," + cy;
          const f = fest.get(k);
          if (f) { ctx.globalAlpha = Math.min(1, f.w); ctx.fillStyle = f.f; ctx.fillRect(px - sx + bx, py - sy + by, Z - 1, Z - 1); ctx.globalAlpha = 1; continue; }
          if (gesperrt(px + Z / 2, py + Z / 2, cx, cy)) continue;
          let v = (waerme.get(k) || 0) * 0.9;
          const nx = px / 900;
          if (mitLand && streu(cx * 1.7 + 11.3, cy * 1.3 + 5.1) < einblenden) {
            let land = wolken(nx, ny, t) * 1.08 - abzug;
            if (land > 0) land += (streu(cx, cy) - 0.5) * 0.12 + Math.sin(cx * 0.6 + cy * 0.8 + t * 1.7) * 0.045;
            for (const l of loecher) { // Explosion reisst ein Loch, das wieder zuwächst
              const d = Math.hypot(px - l.x, py - l.y), alter = (jetzt - l.t) / l.dauer, radius = l.r * (1 - alter * alter);
              if (d < radius) land *= 0.25 + 0.75 * (d / radius); // Delle, kein Kahlschlag: Am Rand bleibt fast alles stehen
            }
            if (land > 0) v += land;
          }
          const farbe = band(v);
          if (!farbe) continue;
          ctx.fillStyle = farbe;
          ctx.fillRect(px - sx + bx, py - sy + by, Z - 1, Z - 1);
        }
      }
      // feste Kacheln verglühen ebenfalls, nur langsamer sichtbar, weil sie jedes Bild neu gesetzt werden
      for (const [k, f] of fest) { f.w *= 0.8; if (f.w < 0.12) fest.delete(k); }

      if (sichtbar && !ruhig) raf = requestAnimationFrame(takt);
    };
    const anwerfen = () => { if (!raf) raf = requestAnimationFrame(takt); };

    const zeiger = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const p = seite(e);
      maus.imRaster = p.y >= oben && p.y <= unten;
      // Wärme entlang des Wegs auftragen, damit eine schnelle Bewegung nicht abreisst
      if (maus.imRaster && maus.lx !== null && !karte && !form) {
        const d = Math.hypot(p.x - maus.lx, p.y - maus.ly), n = Math.max(1, Math.min(40, Math.round(d / (Z * 0.8))));
        for (let i = 1; i <= n; i += 1) auftragen(maus.lx + ((p.x - maus.lx) * i) / n, maus.ly + ((p.y - maus.ly) * i) / n, 0.16, 3.2);
      }
      maus.x = p.x; maus.y = p.y; maus.lx = p.x; maus.ly = p.y; maus.zuletzt = performance.now();
      if (ladung.an) { ladung.x = p.x; ladung.y = p.y; }
      const stelle = maus.imRaster && e.target.closest ? e.target.closest("[data-form]") : null;
      form = stelle ? stelle.dataset.form : null;
      if (!form) formDavor = null;
      karte = maus.imRaster && e.target.closest ? e.target.closest("[data-typ]") : null;
    };
    const runter = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (e.button !== 0 || (e.target.closest && e.target.closest("a,button,input,textarea,select"))) return;
      const p = seite(e);
      if (p.y < oben || p.y > unten) return;
      ladung.an = true; ladung.t0 = performance.now(); ladung.x = p.x; ladung.y = p.y;
      document.body.style.userSelect = "none"; // Halten soll keinen Text markieren
    };
    const hoch = () => {
      if (!ladung.an) return;
      ladung.an = false; document.body.style.userSelect = "";
      const t = performance.now(), ch = Math.min((t - ladung.t0) / 2200, 1); // kurzer Klick sanft, langes Halten kräftig
      const [cx, cy] = zelle(ladung.x, ladung.y);
      wellen.push({ cx, cy, t, kraft: ch, weite: 9 + ch * 30 }); // Reichweite in Kacheln: kurzer Klick klein, volle Ladung gross
      // Die Explosion drückt eine Delle in die Landschaft, nur rund um den Knall, und sie wächst rasch wieder zu.
      // Die Fassung davor räumte bei voller Ladung alles ab (Denis: "verschwindet alles, das sollte nicht so sein").
      loecher.push({ x: ladung.x, y: ladung.y, r: 70 + ch * 170, t, dauer: 1400 + ch * 1400 });
      beben = 0.2 + ch * 1.6; maus.zuletzt = t;
      if (grund) { // leichtes Beben der Inhalte, nur angedeutet (Klasse wl-beben, Stärke --beben)
        grund.style.setProperty("--beben", (0.6 + ch * 2.2).toFixed(1) + "px");
        grund.classList.remove("wl-beben"); void grund.offsetWidth; grund.classList.add("wl-beben");
        setTimeout(() => grund.classList.remove("wl-beben"), 500);
      }
    };
    const raus = () => { maus.imRaster = false; maus.lx = null; karte = null; form = null; };

    messen();
    if (fein && !ruhig) {
      window.addEventListener("pointermove", zeiger, { passive: true });
      window.addEventListener("pointerdown", runter, { passive: true });
      window.addEventListener("pointerup", hoch, { passive: true });
      window.addEventListener("pointercancel", hoch, { passive: true });
      document.documentElement.addEventListener("mouseleave", raus);
    }
    const neu = () => { messen(); if (ruhig) anwerfen(); };
    window.addEventListener("resize", neu);
    const rollen = () => { if (ruhig) anwerfen(); };
    window.addEventListener("scroll", rollen, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" && grund ? new ResizeObserver(neu) : null;
    ro?.observe(grund);
    // Die Landschaft bewegt sich ständig: Die Schleife läuft, solange der Rastergrund im Bild ist
    const io = typeof IntersectionObserver !== "undefined" && grund ? new IntersectionObserver((es) => { sichtbar = es[0].isIntersecting; if (sichtbar) anwerfen(); }) : null;
    io?.observe(grund);
    anwerfen();
    return () => {
      cancelAnimationFrame(raf); ro?.disconnect(); io?.disconnect(); document.body.style.userSelect = "";
      window.removeEventListener("pointermove", zeiger); window.removeEventListener("pointerdown", runter);
      window.removeEventListener("pointerup", hoch); window.removeEventListener("pointercancel", hoch);
      document.documentElement.removeEventListener("mouseleave", raus);
      window.removeEventListener("resize", neu); window.removeEventListener("scroll", rollen);
    };
  }, [ursprung]);

  return <canvas ref={ref} className="wl-feld" aria-hidden="true" />;
}
