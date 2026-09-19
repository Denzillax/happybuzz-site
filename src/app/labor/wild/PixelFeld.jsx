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
// Aufladen (Maustaste halten) und Loslassen, genau nach der Referenz: ein gefüllter weicher Fleck am Knallpunkt,
// EIN breiter Ring fegt schnell über das Bild, dahinter bleibt die Fläche rot stehen und löst sich Kachel für
// Kachel auf. Dazu schüttelt das Feld, die Inhalte beben leicht, die Landschaft bekommt eine Delle.
// Volle Ladung (gut zwei Sekunden halten): Die ganze Seite "explodiert". Das Feld darf dann für einen Moment
// über die ganze Seite, auch über Hero und Fuss, mehrere Explosionen zünden quer übers Bild, und die Inhalte
// werden vom Knall weggeschleudert und federn zurück (Klasse wl-spreng, Richtung pro Element als CSS-Variablen).
// Laufschrift: Im Element .wl-laufband läuft ein Text (data-text) als Pixelschrift durch das Feld. Er ist Wärme,
// flimmert also zwischen den heissen Farbbändern. Beim Scrollen wirft er einen Schatten in Scrollrichtung, der
// Zeiger schiebt die Buchstaben zur Seite, Explosionen drücken sie an der Wellenfront weg.
// Hinter Texten bleiben die Kacheln in voller Farbe sichtbar, die Schrift liegt darüber. Nur auf dem Karoraster, hinter dem Inhalt, fängt keine Klicks ab.
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
// Biene in Kacheln, Kopf rechts. Zweite Gestalt (Denis 19.09.: die erste war zu dünn): runder, dicker Körper
// mit breiten Doppelstreifen, Stachel hinten, Auge, zwei Beinen. Der Flügel darüber ist das BEEDARO-Herz im
// Kleinen: zwei Bögen oben, darunter die versetzten Quadrate als Spitze.
// Y Körper, K Streifen und Stachel, W Flügel, E Auge. Körper = Zeilen 6 bis 11, Mitte auf Zeile 9.
const BIENE = [
  "...WW.WW.....",
  "..WWWWWWW....",
  "..WWWWWWW....",
  "..W.W.W.W....",
  "...W.W.W.....",
  ".....W.......",
  "...YYKKYYKK..",
  "..YYYKKYYKKK.",
  "KYYYYKKYYKKEK",
  "KYYYYKKYYKKKK",
  "..YYYKKYYKKK.",
  "...YYKKYYKK..",
  "....K...K....",
];
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
    const nachglut = new Map(); // "cx,cy" -> Restdauer: Kacheln, die nach der Druckwelle rot stehen bleiben und sich dann auflösen
    let wellen = [], funken = [], loecher = [], titel = [];
    let raf = 0, B = 0, H = 0, zoom = 1, oy = 0, oben = 0, unten = 0, bild = 0, beben = 0, sichtbar = true, start = performance.now();
    const maus = { x: 0, y: 0, lx: null, ly: null, imRaster: false, zuletzt: 0 };
    const ladung = { an: false, t0: 0, x: 0, y: 0 };
    const biene = { an: false, x: 0, reihe: 0, richtung: 1, pollen: [] };
    let satz = []; // Hauptsatz zum Entschlüsseln: gerasterte Zeilen, die beim Laden zuerst als Kacheln erscheinen
    let schatten = 0, letztesSy = null; // Schatten der Laufschrift: folgt dem Scrolltempo und klingt aus
    let ueberallBis = 0, lauf = null, laufX = 0; // ueberallBis: bis wann das Feld die ganze Seite bedecken darf. lauf: Laufschrift
    let karte = null, karteDavor = null, karteSeit = 0, form = null, formDavor = null, kopfband = 190; // kopfband: Höhe des freien Bands oben, nur dort steht Landschaft

    const seitenRect = (el) => {
      const r = el.getBoundingClientRect();
      return { l: (r.left + window.scrollX) / zoom, t: (r.top + window.scrollY) / zoom, r: (r.right + window.scrollX) / zoom, b: (r.bottom + window.scrollY) / zoom };
    };
    // Die Überschriften, auf die der Pfeil zeigt, und das Band der Laufschrift. In Seitenkoordinaten.
    const vermessen = () => {
      if (!grund) return;
      titel = [...grund.querySelectorAll(".wl-h2")].map((el) => ({ ...seitenRect(el), wort: el.dataset.wort || "" }));
      // Hauptsatz entschlüsseln (data-entschluesseln): jede Zeile einmal in Kachelauflösung rastern
      const hs = grund.querySelector("[data-entschluesseln]");
      if (hs && !satz.length && performance.now() - start < 2200) {
        const stil = getComputedStyle(hs), gross = parseFloat(stil.fontSize) / Z;
        satz = [...hs.querySelectorAll(".wl-zeile")].map((el) => {
          const r = seitenRect(el), text = (el.textContent || "").toUpperCase();
          const b = Math.max(4, Math.ceil((r.r - r.l) / Z) + 2), h = Math.max(3, Math.ceil((r.b - r.t) / Z));
          const m = document.createElement("canvas"); m.width = b; m.height = h;
          const mx = m.getContext("2d");
          mx.font = `500 ${gross}px Geist, Arial, sans-serif`; mx.textBaseline = "middle"; mx.fillStyle = "#000";
          mx.fillText(text, 0, h / 2);
          return { x: r.l, y: r.t, b, h, daten: mx.getImageData(0, 0, b, h).data };
        });
      }
      const lb = grund.querySelector(".wl-laufband");
      if (lb) {
        const r = seitenRect(lb), text = lb.dataset.text || "";
        if (!lauf || lauf.text !== text) {
          // Text einmal klein rastern: ein Bildpunkt = eine Kachel, 15 Kacheln hoch
          const hoch = 15, m = document.createElement("canvas"), mx = m.getContext("2d");
          mx.font = `900 ${hoch + 2}px Arial, sans-serif`;
          const breit = Math.ceil(mx.measureText(text).width) + 2;
          m.width = breit; m.height = hoch;
          mx.font = `900 ${hoch + 2}px Arial, sans-serif`; mx.textBaseline = "middle"; mx.fillStyle = "#000";
          mx.fillText(text, 1, hoch / 2 + 1);
          lauf = { text, hoch, breit, daten: mx.getImageData(0, 0, breit, hoch).data, mitte: 0 };
        }
        lauf.mitte = (r.t + r.b) / 2;
      } else lauf = null;
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
      // Die Wolke hängt nur ÜBER dem Hero: vom Seitenanfang bis zur Oberkante des Hauptsatzes (Denis 19.09.: am
      // Desktop lag sie unter dem Hero). Der Hero lässt oben dafür Platz frei (padding-top in globals.css).
      const kb = grund ? grund.querySelector(".wl-h1") : null;
      if (kb) kopfband = Math.max(90, (kb.getBoundingClientRect().top - r.top) / zoom - 14);
      vermessen();
    };
    const streu = (a, b) => { const n = Math.sin(a * 127.1 + b * 311.7 + S1) * 43758.5453; return n - Math.floor(n); };

    // Landschaft: überlagerte Wellen mit leichter Verzerrung, Ergebnis etwa 0..1
    const wolken = (x, y, t) => {
      const nx = x + Math.sin(y * 4.6 + t * 0.4 + S2) * 0.05, ny = y + Math.cos(x * 4.2 - t * 0.33) * 0.05;
      const v = Math.sin(nx * 6.1 + t * 0.27 + S1) * Math.cos(ny * 5.3 - t * 0.21 + S2) + 0.9 * Math.sin((nx * 1.3 + ny * 1.9) * 4.4 + t * 0.15 - S3)
        + 0.45 * Math.sin(ny * 10.2 + nx * 2.7 + S3) + 0.25 * Math.sin(nx * 14.1 - S2);
      return 0.5 + 0.5 * (v / 2.6);
    };

    const seite = (e) => ({ x: (e.clientX + window.scrollX) / zoom, y: (e.clientY + window.scrollY) / zoom });
    const zelle = (x, y) => [Math.floor(x / Z), Math.floor((y - oy) / Z)];
    const imFeld = (cy) => { if (ueberallBis) return true; const y = cy * Z + oy; return y >= oben && y + Z <= unten; };
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
    // Pfeil vom Zeiger zur Überschrift, gestaltet wie in der Referenz: Der Schaft ist aufgetragene Wärme mit weicher
    // Kante (rund zwei bis drei Kacheln stark), kein harter Ein-Kachel-Strich. Ein heller Puls wandert weich zur
    // Spitze, die Widerhaken sind satt und etwas heisser als der Schaft. Der Pfeil zeigt in jedem Winkel.
    const pfeil = (x, y, zx, zy, wort, t) => {
      const w = Math.atan2(zy - y, zx - x), L = 9.5 * Z, ca = Math.cos(w), sa = Math.sin(w);
      const puls = (t * 0.9) % 1, schritte = Math.max(16, Math.round(L / (Z * 0.5)));
      for (let i = 0; i <= schritte; i += 1) {
        const f = i / schritte, hell = Math.exp(-Math.pow((f - puls) * 3, 2));
        auftragen(x + ca * L * f, y + sa * L * f, 0.5 + 0.46 * hell, 0.95);
      }
      const sx = x + ca * L, sy = y + sa * L, haken = 3.6 * Z;
      for (const seite2 of [-1, 1]) {
        const b = w + Math.PI + seite2 * 0.62, n = Math.max(8, Math.round(haken / (Z * 0.5)));
        for (let k = 0; k <= n; k += 1) auftragen(sx + Math.cos(b) * haken * (k / n), sy + Math.sin(b) * haken * (k / n), 0.72, 0.95);
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
            if (ziel) pfeil(maus.x, maus.y, ziel.x, ziel.y, ziel.wort, t);
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
        // Druckwelle wie in der Referenz: ein breiter, weicher RING, der in gut einer halben Sekunde über das ganze
        // Bild fegt (Radius wächst mit der Bilddiagonale). Breite und Stärke hängen von der Ladung ab, nach 1,5 s ist
        // die Welle vorbei. Wo die Front kräftig genug war, bleibt die Kachel danach rot stehen (nachglut).
        wellen = wellen.filter((w) => {
          const alter = (jetzt - w.t) / 1000;
          if (alter > 1.5) return false;
          // Die Grösse hängt an der LADUNG (Denis 19.09.: ein blosser Klick darf keine grosse Explosion sein):
          // Ein Klick gibt nur einen kleinen, langsamen Ring rund um den Zeiger, der nach kurzer Strecke ausläuft.
          // Erst mit dem Aufladen wächst die Reichweite, bei voller Ladung fegt der Ring schnell über das ganze Bild.
          const diag = Math.hypot(B, H), R = alter * (180 + w.ch * w.ch * diag * 1.7);
          const auslauf = Math.max(0, 1 - R / w.weite);
          if (auslauf <= 0) return false;
          const sig = Z * 5.5 * w.kraft, amp = Math.max(0, 1 - alter / 1.5) * 1.2 * w.kraft * Math.min(1, auslauf * 2.5), inv = 1 / (2 * sig * sig);
          w.r = R / Z; // Radius in Kacheln, die Laufschrift weicht der Front aus
          const ca = Math.floor(sx / Z) - 1, ce = Math.ceil((sx + B) / Z) + 1, ra = Math.floor((sy - oy) / Z) - 1, re = Math.ceil((sy + H - oy) / Z) + 1;
          for (let cy = ra; cy <= re; cy += 1) {
            if (!imFeld(cy)) continue;
            const dy = cy * Z + oy + Z / 2 - w.y;
            for (let cx = ca; cx <= ce; cx += 1) {
              const dx = cx * Z + Z / 2 - w.x, ab = Math.hypot(dx, dy) - R;
              if (ab > sig * 3 || ab < -sig * 3) continue;
              const g = amp * Math.exp(-(ab * ab) * inv);
              if (g <= 0.02) continue;
              const k = cx + "," + cy;
              if ((waerme.get(k) || 0) < g) waerme.set(k, Math.min(1, g));
              // rote Nachglut nur bei ordentlicher Ladung, je voller, desto länger. Jede Kachel hält unterschiedlich lang.
              if (w.ch >= 0.5 && g > 0.25 && !nachglut.has(k)) nachglut.set(k, (0.45 + streu(cx, cy) * 0.7) * (0.4 + w.ch * 0.6));
            }
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
          const maul = biene.x + (biene.richtung === 1 ? 6 : -6);
          biene.pollen = biene.pollen.filter((c) => (biene.richtung === 1 ? c > maul : c < maul));
          for (const c of biene.pollen) malFest(c, biene.reihe, "#F5C518");
          const schlag = Math.floor(bild / 5) % 2, wipp = Math.round(Math.sin(bild / 9));
          BIENE.forEach((zeile, r) => {
            if (schlag && (r === 0 || r === 5)) return; // Flügelschlag: das Herz zieht sich kurz zusammen
            for (let c = 0; c < zeile.length; c += 1) {
              const ch = zeile[biene.richtung === 1 ? c : zeile.length - 1 - c];
              if (ch !== ".") malFest(Math.round(biene.x) - 6 + c, biene.reihe - 9 + r + wipp, BFARBE[ch]); // Körpermitte (Zeile 9) auf der Pollenreihe
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

      // Hauptsatz entschlüsseln: In den ersten 1,1 s steht der Satz als Kacheln da (sie streuen herein), dann übernimmt
      // die echte Schrift (ihre Einblendung ist in globals.css entsprechend verzögert) und die Kacheln verglühen.
      const seitStart = (jetzt - start) / 1000;
      if (!ruhig && seitStart < 1.1 && satz.length) {
        const dichte = Math.min(1, seitStart / 0.45);
        for (const z of satz) {
          const [c0s, r0s] = zelle(z.x, z.y);
          for (let r = 0; r < z.h; r += 1) for (let c = 0; c < z.b; c += 1) {
            if (z.daten[(r * z.b + c) * 4 + 3] > 80 && streu(c * 1.9 + 3.3, r * 2.3 + 7.1) < dichte) heiss(c0s + c, r0s + r, 0.8 + 0.1 * Math.sin(c * 0.7 + r * 0.7 - t * 6));
          }
        }
      }

      // Laufschrift: der gerasterte Text wandert durch die Spalten und wird als Wärme gestempelt
      if (lauf && lauf.mitte > sy - 120 && lauf.mitte < sy + H + 120) {
        if (!ruhig) laufX += 0.35;
        // Schatten beim Scrollen: Er hängt dem Text in Scrollrichtung nach, je schneller, desto weiter, und klingt aus
        const tempo = letztesSy === null ? 0 : (sy - letztesSy) / Z;
        schatten += (Math.max(-9, Math.min(9, tempo * 0.9)) - schatten) * 0.18;
        const wurf = Math.abs(schatten) > 0.4 ? Math.round(schatten) : 0;
        const r0l = zelle(0, lauf.mitte)[1] - Math.floor(lauf.hoch / 2), so = Math.floor(laufX);
        const [mcx, mcy] = zelle(maus.x, maus.y), rest = ueberallBis ? Math.max(0, (ueberallBis - jetzt) / 1600) : 0;
        for (let c = Math.floor(sx / Z) - 8; c <= (sx + B) / Z + 8; c += 1) {
          const mc = (((so + c) % lauf.breit) + lauf.breit) % lauf.breit;
          for (let r = 0; r < lauf.hoch; r += 1) {
            if (lauf.daten[(r * lauf.breit + mc) * 4 + 3] <= 90) continue;
            const rr = r0l + r;
            let ox = 0, oy2 = 0;
            // Der Zeiger schiebt die Buchstaben zur Seite
            if (fein && maus.imRaster) {
              const dx = c - mcx, dy = rr - mcy, d = Math.hypot(dx, dy);
              if (d < 9 && d > 0.01) { const k = (1 - d / 9) * 5; ox += (dx / d) * k; oy2 += (dy / d) * k; }
            }
            // Jede Explosion drückt die Buchstaben an ihrer Wellenfront nach aussen
            for (const w of wellen) {
              if (!(w.r > 0)) continue;
              const dx = c - w.cx, dy = rr - w.cy, d = Math.hypot(dx, dy), ab = Math.abs(d - w.r);
              if (ab < 6 && d > 0.01) { const k = (1 - ab / 6) * (3 + w.kraft * 5); ox += (dx / d) * k; oy2 += (dy / d) * k; }
            }
            // Seitenexplosion: die Schrift zerstiebt und setzt sich wieder
            if (rest > 0) { ox += (streu(c + bild, rr) - 0.5) * rest * 14; oy2 += (streu(c, rr + bild) - 0.5) * rest * 14; }
            const zc = Math.round(c + ox), zr = Math.round(rr + oy2);
            heiss(zc, zr, 0.84 + 0.13 * Math.sin(c * 0.6 + r * 0.6 - t * 5));
            if (wurf) { heiss(zc + 1, zr + wurf, 0.36); if (Math.abs(wurf) > 2) heiss(zc + 1, zr + Math.round(wurf / 2), 0.5); }
          }
        }
      }

      letztesSy = sy;
      // Wärme verglüht schnell (kurze Spur), Löcher der Explosion wachsen zu
      // Nachglut: Die Kachel hält ihre Wärme bei 0.9 (das rote Band), bis ihre Restdauer fast abgelaufen ist, dann
      // verglüht sie rasch. Weil jede Kachel eine andere Dauer hat, löst sich die rote Fläche ausgefranst auf.
      for (const [k, d] of nachglut) {
        const n = d - 0.007;
        if (n <= 0) { nachglut.delete(k); waerme.delete(k); continue; }
        nachglut.set(k, n);
        const w = waerme.get(k) || 0;
        waerme.set(k, n < 0.3 ? w * 0.88 : Math.max(w * 0.95, 0.9));
      }
      for (const [k, w] of waerme) { if (nachglut.has(k)) continue; const n = w * 0.88; if (n < 0.01) waerme.delete(k); else waerme.set(k, n); }
      loecher = loecher.filter((l) => jetzt - l.t < l.dauer);
      if (ueberallBis && jetzt > ueberallBis && !wellen.length && !nachglut.size) ueberallBis = 0;

      // Zeichnen: für jede sichtbare Kachel des Rasters Landschaft + Wärme, in Farbbänder geschnitten
      const bx = beben > 0.05 ? (Math.random() - 0.5) * beben * 8 : 0, by = beben > 0.05 ? (Math.random() - 0.5) * beben * 8 : 0;
      beben *= 0.88;
      ctx.clearRect(0, 0, B, H);
      const c0 = Math.floor(sx / Z), c1 = Math.ceil((sx + B) / Z);
      const r0 = ueberallBis ? Math.floor((sy - oy) / Z) : Math.max(Math.floor((sy - oy) / Z), Math.ceil((oben - oy) / Z));
      const r1 = ueberallBis ? Math.ceil((sy + H - oy) / Z) : Math.min(Math.ceil((sy + H - oy) / Z), Math.floor((unten - oy) / Z) - 1);
      for (let cy = r0; cy <= r1; cy += 1) {
        const py = cy * Z + oy, tiefe = py - oben, ny = py / 900;
        // Oben hängt die Landschaft wie Wolken herab: Mit der Tiefe wird ein wachsender Betrag abgezogen, es bleiben
        // nur die Gipfel. Sie endet im freien Band über den Inseraten (Denis 19.09.: sie ging zu weit in die
        // Artikel hinein). Darunter gibt es keine Landschaft mehr, nur noch die Wärme des Zeigers.
        // Dynamisch: Die Wolke reicht über den ganzen Hero und zieht sich beim Scrollen nach oben zurück
        const abzug = tiefe / (kopfband * 1.15) + Math.min(0.5, sy / 1400), mitLand = tiefe < kopfband;
        for (let cx = c0; cx <= c1; cx += 1) {
          const px = cx * Z, k = cx + "," + cy;
          const f = fest.get(k);
          if (f) { ctx.globalAlpha = Math.min(1, f.w); ctx.fillStyle = f.f; ctx.fillRect(px - sx + bx, py - sy + by, Z - 1, Z - 1); ctx.globalAlpha = 1; continue; }
          // Hinter Texten stehen die Kacheln in voller Farbe (Denis 19.09.: abgedämpft wirkte es milchig). Die Schrift liegt darüber.
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
      ctx.globalAlpha = 1;
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
      // Referenz: Stärke 0.35 (Antippen) bis 2.45 (volle Ladung), dazu ein gefüllter weicher Fleck am Knallpunkt
      // weite = wie weit der Ring kommt: beim Klick rund 70 px, bei voller Ladung über das ganze Bild hinaus
      wellen.push({ x: ladung.x, y: ladung.y, cx, cy, t, ch, kraft: 0.35 + ch * 2.1, weite: 70 + ch * ch * Math.hypot(B, H) * 1.6, r: 0 });
      auftragen(ladung.x, ladung.y, 0.6 + ch * 0.4, (1.6 + ch * 19) * 1.1);
      // Die Explosion drückt eine Delle in die Landschaft, nur rund um den Knall, und sie wächst rasch wieder zu.
      // Die Fassung davor räumte bei voller Ladung alles ab (Denis: "verschwindet alles, das sollte nicht so sein").
      if (ch > 0.2) loecher.push({ x: ladung.x, y: ladung.y, r: 30 + ch * 210, t, dauer: 1400 + ch * 1400 });
      beben = 0.05 + ch * ch * 2.3; maus.zuletzt = t; // beim Klick praktisch kein Schütteln
      if (ch >= 0.97) seiteSprengen(t);
      if (grund) { // leichtes Beben der Inhalte, nur angedeutet (Klasse wl-beben, Stärke --beben)
        if (ch > 0.25) { // Inhalte beben erst ab spürbarer Ladung
          grund.style.setProperty("--beben", (ch * 2.8).toFixed(1) + "px");
          grund.classList.remove("wl-beben"); void grund.offsetWidth; grund.classList.add("wl-beben");
          setTimeout(() => grund.classList.remove("wl-beben"), 500);
        }
      }
    };
    // Volle Ladung: Der Ring fegt über die GANZE Seite (auch Hero und Fuss) und lässt sie rot zurück, die Inhalte
    // fliegen vom Knall weg und federn zurück. Kein Mehrfach-Knall, kein Flackern (Denis: "kein Feuerwerk").
    const seiteSprengen = (t) => {
      const sx = window.scrollX / zoom, sy = window.scrollY / zoom;
      ueberallBis = t + 1600; // der Ring braucht 1,5 s, danach hält die Nachglut das Feld offen, bis sie erloschen ist
      const wurzel = cv.closest(".wl");
      if (!wurzel) return;
      const kx = ladung.x - sx, ky = ladung.y - sy; // Knallpunkt im Bild (gezoomte CSS-Pixel)
      const teile = wurzel.querySelectorAll(".wl-zeile, .wl-gross, .wl-text, .wl-knoepfe, .wl-hero-b, .wl-label, .wl-h2, .wl-mehr, .wl-karte, .wl-format, .wl-fuss-satz, .wl-logo, .wl-kopf-rechts");
      teile.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return; // nur was im Bild ist
        const mx = (r.left + r.width / 2) / zoom - kx, my = (r.top + r.height / 2) / zoom - ky, d = Math.max(40, Math.hypot(mx, my));
        const wucht = 60 + 9000 / d; // nah am Knall fliegt es weiter
        el.style.setProperty("--sx", ((mx / d) * wucht).toFixed(0) + "px");
        el.style.setProperty("--sy", ((my / d) * wucht - 20).toFixed(0) + "px");
        // Hero-Zeilen ohne Drehung: Gedrehte dünne Schrift wird beim Bewegen dünn und gezackt gerendert
        el.style.setProperty("--sr", el.classList.contains("wl-zeile") ? "0deg" : ((Math.random() - 0.5) * 26).toFixed(1) + "deg");
        el.classList.remove("wl-spreng"); void el.offsetWidth; el.classList.add("wl-spreng");
        setTimeout(() => el.classList.remove("wl-spreng"), 1300);
      });
    };
    // Impuls von der Seite (Suchfeld im Hero): Wärme an einer Bildschirmposition auftragen
    const stoss = (e) => {
      if (ruhig) return;
      const x = (e.detail.x + window.scrollX) / zoom, y = (e.detail.y + window.scrollY) / zoom, k = e.detail.staerke || 0.4;
      auftragen(x, y, 0.5 + k * 0.5, 2 + k * 6);
      if (k >= 1) { const [cx, cy] = zelle(x, y); wellen.push({ x, y, cx, cy, t: performance.now(), ch: 0.45, kraft: 1.1, weite: 520, r: 0 }); }
    };
    window.addEventListener("wl-impuls", stoss);
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
      window.removeEventListener("resize", neu); window.removeEventListener("scroll", rollen); window.removeEventListener("wl-impuls", stoss);
    };
  }, [ursprung]);

  return <canvas ref={ref} className="wl-feld" aria-hidden="true" />;
}
