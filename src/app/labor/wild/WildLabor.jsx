"use client";
// Vorschau (Denis 19.09.2026): BEEDARO in der Richtung von craft.wild.as mit dem neuen Pixel-B.
// Übernommen sind die Prinzipien, nicht der Code: weisser Grund mit feinem Karoraster, fast
// schwarze Schrift, leichte Grotesk mit grossen Versal-Titeln, kleine Mono-Labels, ein
// Pixel-Mosaik, das von oben ins Bild wächst. Farben von wild: Gelb, Blau, Violett, Lime, Orangerot, Navy.
// Das Logo dient um 90 Grad gedreht als Favoriten-Herz (BLogo herz).
// Eigene Route ausserhalb von (public) mit eigenem Header. Styles: globals.css unter WILD-LABOR (wl-*).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getCoverUrl, getDisplayPrice } from "@/lib/formatters";
import BLogo from "@/components/shared/BLogo";
import PixelFeld from "./PixelFeld";

const SCHRIFT = "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap";
const FORMAT = { sell: "Festpreis", auction: "Auktion", rent: "Miete", free: "Gratis", service: "Service" };
// Pixelbild, das unter dem Zeiger entsteht, wenn man auf dem Formatnamen steht
const FORMBILD = { sell: "stern", auction: "blitz", rent: "haus", free: "herz", service: "smiley" };
const FORMATE = [
  { type: "sell", nr: "01", label: "Festpreis", sub: "Kaufen wie gewohnt" },
  { type: "auction", nr: "02", label: "Auktion", sub: "Bieten und gewinnen" },
  { type: "rent", nr: "03", label: "Mieten", sub: "Nutzen statt besitzen" },
  { type: "free", nr: "04", label: "Gratis", sub: "Verschenken, abholen" },
  { type: "service", nr: "05", label: "Service", sub: "Handwerk und Hilfe buchen" },
];

function preis(l) {
  if (l.listing_type === "free") return "Gratis";
  const p = getDisplayPrice(l);
  return `${p.prefix}${p.text}${p.suffix}`;
}

// Pixel-Mosaik am oberen Rand des Rasters. Zweite, dynamischere Fassung (Denis 19.09.: "die Kacheln oben
// sollten dynamischer sein"):
//  - Zwei Wellen wandern gegeneinander durch die Spalten, die Kante ist ständig in Bewegung.
//  - Kacheln wechseln ab und zu die Farbe, und ein heller Farbstreifen zieht durch das Mosaik.
//  - Von der Unterkante lösen sich Tropfen, fallen ins Karoraster und verglühen.
//  - Scrollen gibt dem Ganzen einen Schub, der wieder ausklingt. Der Zeiger zieht die Spalten zu sich.
//  - Explosion im Pixelfeld (Ereignis wl-knall): Die Kacheln in Reichweite fliegen vom Knall weg, die Spalten
//    sind erst leer und wachsen dann langsam nach. Bei voller Ladung räumt es das ganze Mosaik ab.
// Läuft nur im Bild. Mit "Bewegung reduzieren" steht ein ruhiges Mosaik ohne Tropfen.
function PixelBand() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const Z = 10, REIHEN = 24, KANTE = 9; // Fläche 24 Reihen hoch, das Mosaik selbst pendelt um 9, darunter fallen die Tropfen
    const PALETTE = ["#3B5BD9", "#3B5BD9", "#FBF062", "#FBF062", "#E0492A", "#D8FF00", "#1C2541", "#6C4CF1"];
    const farbe = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];
    let spalten = [], tropfen = [], splitter = [], B = 0, raf = 0, sichtbar = true, zeit = 0, schub = 0, letztesY = window.scrollY;
    let mausSpalte = -99, mausNah = 0;

    const bauen = () => {
      B = cv.parentElement.clientWidth;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(B * dpr); cv.height = Math.round(REIHEN * Z * dpr);
      cv.style.width = B + "px"; cv.style.height = REIHEN * Z + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.ceil(B / Z);
      spalten = Array.from({ length: n }, () => ({ h: 0, traeg: 0, farben: Array.from({ length: REIHEN }, farbe) }));
    };
    const hoehe = (i, n, t) => {
      const breit = (Math.sin((i / n) * Math.PI * 2.2 + t * 0.35) + 1) / 2; // lange Dünung
      const kurz = Math.sin(i * 0.42 - t * 1.4) * (1.6 + schub * 3) + Math.sin(i * 0.17 + t * 0.8) * 1.2; // zwei Wellen gegeneinander
      const d = Math.abs(i - mausSpalte), zug = d < 10 ? (1 - d / 10) * 6 * mausNah : 0;
      return Math.max(1, Math.min(REIHEN - 6, 2 + breit * (KANTE - 2) + kurz + zug));
    };
    const malen = () => {
      ctx.clearRect(0, 0, B, REIHEN * Z);
      const n = spalten.length, streif = ((zeit * 0.6) % (n + 30)) - 15; // heller Streifen wandert durch
      spalten.forEach((s, i) => {
        const voll = Math.floor(s.h);
        for (let r = 0; r < voll; r += 1) {
          ctx.fillStyle = Math.abs(i - streif - r * 0.8) < 2 ? "#FBF062" : s.farben[r];
          ctx.fillRect(i * Z, r * Z, Z - 1, Z - 1);
        }
      });
      for (const t of tropfen) {
        ctx.globalAlpha = Math.max(0, Math.min(1, t.leben));
        ctx.fillStyle = t.farbe;
        ctx.fillRect(t.spalte * Z, Math.floor(t.y) * Z, Z - 1, Z - 1);
      }
      for (const k of splitter) {
        ctx.globalAlpha = Math.max(0, Math.min(1, k.leben));
        ctx.fillStyle = k.farbe;
        ctx.fillRect(Math.round(k.x / Z) * Z, Math.round(k.y / Z) * Z, Z - 1, Z - 1); // auch im Flug auf dem Raster
      }
      ctx.globalAlpha = 1;
    };
    const takt = () => {
      zeit += 1;
      const t = zeit / 60, n = spalten.length;
      spalten.forEach((s, i) => {
        // nach einer Explosion wächst die Spalte erst nach einer Pause und dann gemächlich nach
        if (s.traeg > 0) { s.traeg -= 1; if (s.traeg < 70) s.h += (hoehe(i, n, t) - s.h) * 0.02; } else s.h += (hoehe(i, n, t) - s.h) * 0.12;
        if (Math.random() < 0.004 + schub * 0.02) s.farben[Math.floor(Math.random() * REIHEN)] = farbe(); // Farbwechsel
        if (Math.random() < 0.0035 + schub * 0.03) tropfen.push({ spalte: i, y: Math.floor(s.h), v: 0.05, leben: 1.4, farbe: s.farben[Math.max(0, Math.floor(s.h) - 1)] });
      });
      tropfen = tropfen.filter((d) => { d.y += d.v; d.v += 0.012; d.leben -= 0.012; return d.leben > 0 && d.y < REIHEN; });
      splitter = splitter.filter((k) => { k.x += k.vx; k.y += k.vy; k.vy += 0.08; k.vx *= 0.985; k.leben -= 0.018; return k.leben > 0; });
      schub *= 0.94;
      malen();
      raf = sichtbar ? requestAnimationFrame(takt) : 0;
    };
    const zeiger = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const r = cv.getBoundingClientRect();
      const zoom = r.width ? r.width / B : 1; // body-Zoom herausrechnen
      mausSpalte = Math.floor((e.clientX - r.left) / zoom / Z);
      const ab = (e.clientY - (r.top + KANTE * Z * zoom)) / zoom; // Abstand unter der Mosaik-Kante
      mausNah = ab < -KANTE * Z ? 0 : Math.max(0, 1 - Math.max(0, ab) / 260);
    };
    const knall = (e) => {
      const r = cv.getBoundingClientRect(), zoom = r.width ? r.width / B : 1, kraft = e.detail.kraft;
      const kx = (e.detail.x - r.left) / zoom, ky = (e.detail.y - r.top) / zoom;
      const reichweite = 140 + kraft * 1600; // kurzer Klick: nur die Kacheln in der Nähe, volle Ladung: alles
      spalten.forEach((s, i) => {
        const voll = Math.floor(s.h);
        let bleibt = voll;
        for (let z = 0; z < voll; z += 1) {
          const x = i * Z + Z / 2, y = z * Z + Z / 2, d = Math.hypot(x - kx, y - ky);
          if (d > reichweite) continue;
          if (z < bleibt) bleibt = z;
          const w = Math.atan2(y - ky, x - kx), tempo = (1 - d / reichweite) * (5 + kraft * 9) + 1.5 + Math.random() * 2;
          splitter.push({ x: i * Z, y: z * Z, vx: Math.cos(w) * tempo, vy: Math.sin(w) * tempo - 1.5, leben: 1 + Math.random() * 0.5, farbe: s.farben[z] });
        }
        if (bleibt < voll) { s.h = bleibt; s.traeg = 110 + Math.floor(Math.random() * 40); }
      });
      schub = 1;
      if (!raf && sichtbar) raf = requestAnimationFrame(takt);
    };
    const rollen = () => { schub = Math.min(1, schub + Math.abs(window.scrollY - letztesY) / 400); letztesY = window.scrollY; };

    bauen();
    const stillstand = () => { const n = spalten.length; spalten.forEach((s, i) => { s.h = hoehe(i, n, 0); }); malen(); };
    if (ruhig) stillstand();
    else { window.addEventListener("pointermove", zeiger, { passive: true }); window.addEventListener("scroll", rollen, { passive: true }); window.addEventListener("wl-knall", knall); }
    const io = new IntersectionObserver((es) => { sichtbar = es[0].isIntersecting; if (sichtbar && !raf && !ruhig) raf = requestAnimationFrame(takt); });
    io.observe(cv);
    const ro = new ResizeObserver(() => { bauen(); if (ruhig) stillstand(); });
    ro.observe(cv.parentElement);
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      window.removeEventListener("pointermove", zeiger); window.removeEventListener("scroll", rollen); window.removeEventListener("wl-knall", knall);
    };
  }, []);
  return <canvas ref={ref} className="wl-pixel" aria-hidden="true" />;
}

function Herz({ id }) {
  const [an, setAn] = useState(false);
  return (
    <button type="button" className={`wl-herz eckig kein-akzent${an ? " wl-herz-an" : ""}`} aria-pressed={an}
      aria-label={an ? "Aus den Favoriten entfernen" : "Zu den Favoriten"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAn((v) => !v); }} data-id={id}>
      <BLogo herz size={18} title="" />
    </button>
  );
}

function Karte({ l }) {
  return (
    <Link href={`/listing/${l.id}`} className="wl-karte wl-auf" data-typ={l.listing_type}>
      <span className="wl-bild">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getCoverUrl(l)} alt="" loading="lazy" />
        <Herz id={l.id} />
        <span className="wl-reiter">Ansehen <ArrowUpRight size={13} strokeWidth={2} /></span>
      </span>
      <span className="wl-textblock">
        <span className={`wl-meta wl-typ-${l.listing_type}`}><span className="wl-pixelpunkt" />{FORMAT[l.listing_type]}{l.city ? ` · ${l.city}` : ""}</span>
        <span className="wl-titel">{l.title}</span>
        <span className="wl-preis">{preis(l)}</span>
      </span>
    </Link>
  );
}

export default function WildLabor() {
  const [inserate, setInserate] = useState([]);
  const wurzel = useRef(null);
  const kartenRef = useRef(null);

  // Karten exakt aufs Kachelraster setzen (Denis 19.09.): Breite, Bildhöhe und Lage sind Vielfache von 10 px,
  // gemessen vom Ursprung des Karopapiers. CSS allein kann das nicht, weil die Spaltenbreite von der
  // Fensterbreite abhängt. Die Werte gehen als CSS-Variablen an .wl-karten.
  useEffect(() => {
    const el = kartenRef.current, grund = el ? el.closest(".wl-raster-grund") : null;
    if (!el || !grund) return;
    const Z = 10;
    const setzen = () => {
      el.style.setProperty("--schub-x", "0px"); el.style.setProperty("--schub-y", "0px");
      const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
      const spalten = window.innerWidth / zoom <= 900 ? 2 : 4, luecke = 2 * Z;
      const breite = Math.floor((el.clientWidth - Z - (spalten - 1) * luecke) / spalten / Z) * Z;
      const r = el.getBoundingClientRect(), g = grund.getBoundingClientRect();
      const links = (r.left - g.left) / zoom, oben = (r.top - g.top) / zoom;
      el.style.setProperty("--kw", breite + "px");
      el.style.setProperty("--kh", Math.round((breite * 1.25) / Z) * Z + "px");
      el.style.setProperty("--schub-x", ((Z - (links % Z)) % Z) + "px");
      el.style.setProperty("--schub-y", ((Z - (oben % Z)) % Z) + "px");
    };
    setzen();
    const ro = new ResizeObserver(setzen);
    ro.observe(grund);
    return () => ro.disconnect();
  }, [inserate]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = SCHRIFT; document.head.appendChild(link);
    supabase
      .from("listings")
      .select("id, title, listing_type, price, start_price, rent_price, rent_period, city, listing_images(url, sort_order)")
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setInserate((data || []).filter((l) => getCoverUrl(l)).slice(0, 8)));
    return () => link.remove();
  }, []);

  useEffect(() => {
    const el = wurzel.current;
    if (!el) return;
    const teile = [...el.querySelectorAll(".wl-auf")];
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (ruhig || typeof IntersectionObserver === "undefined") { teile.forEach((t) => t.classList.add("wl-da")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("wl-da"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
    teile.forEach((t, i) => { t.style.transitionDelay = `${(i % 4) * 60}ms`; io.observe(t); });
    return () => io.disconnect();
  }, [inserate]);

  return (
    <div className="wl" ref={wurzel}>
      <header className="wl-kopf">
        <Link href="/labor/wild" className="wl-logo" aria-label="BEEDARO">
          <span className="wl-logo-marke"><BLogo size={36} title="" /></span>
          <span className="wl-wort">beedaro</span>
        </Link>
        <nav className="wl-nav" aria-label="Hauptnavigation">
          <Link href="/search">Stöbern</Link>
          <Link href="/how-it-works">So funktioniert es</Link>
          <Link href="/impact">Bienenschutz</Link>
        </nav>
        <div className="wl-kopf-rechts">
          <Link href="/search" className="wl-rund" aria-label="Suchen"><Search size={17} strokeWidth={1.8} /></Link>
          <Link href="/favorites" className="wl-rund" aria-label="Favoriten"><BLogo herz size={17} title="" /></Link>
          <Link href="/listings/new" className="wl-knopf wl-knopf-ink" aria-label="Inserieren"><Plus size={15} strokeWidth={2.2} /> <span className="wl-nur-breit">Inserieren</span></Link>
        </div>
      </header>

      <section className="wl-hero">
        <h1 className="wl-h1">
          <span className="wl-zeile"><span>Was du suchst,</span></span>
          <span className="wl-zeile"><span>hat schon jemand.</span></span>
        </h1>
        <div className="wl-hero-unten">
          <p className="wl-gross">Ein Marktplatz<br />für zweite Hand in der Schweiz</p>
          <div>
            <BLogo size={44} title="" className="wl-hero-b" />
            <p className="wl-text">Kaufen, bieten, mieten, buchen oder verschenken. Fünf Formate an einem Ort. 20 % jeder Gebühr gehen an den Bienenschutz.</p>
            <div className="wl-knoepfe">
              <Link href="/listings/new" className="wl-knopf wl-knopf-ink"><Plus size={15} strokeWidth={2.2} /> Inserieren</Link>
              <Link href="/search" className="wl-knopf wl-knopf-linie">Stöbern <ArrowUpRight size={15} strokeWidth={2} /></Link>
            </div>
          </div>
        </div>
      </section>

      <div className="wl-raster-grund">
        <PixelFeld ursprung=".wl-raster-grund" />
        <PixelBand />

        <section className="wl-abschnitt">
          <div className="wl-abschnitt-kopf wl-auf">
            <span className="wl-label"><span className="wl-form" data-form="stern">Neu eingestellt</span></span>
            <h2 className="wl-h2" data-wort="NEU!">Frisch aus <span className="wl-form" data-form="haus">Kellern</span>, Estrichen und <span className="wl-form" data-form="smiley">Werkstätten</span>.</h2>
            <Link href="/search" className="wl-mehr">Alle ansehen <ArrowUpRight size={14} strokeWidth={2} /></Link>
          </div>
          <div className="wl-karten" ref={kartenRef}>{inserate.map((l) => <Karte key={l.id} l={l} />)}</div>
        </section>

        <section className="wl-abschnitt">
          <div className="wl-abschnitt-kopf wl-auf">
            <span className="wl-label">Fünf Formate</span>
            <h2 className="wl-h2" data-wort="5X">Ein Marktplatz, fünf Wege zum <span className="wl-form" data-form="herz">Handel</span>.</h2>
          </div>
          <div className="wl-formate">
            {FORMATE.map((f) => (
              <Link key={f.type} href={`/search?type=${f.type}`} className={`wl-format wl-auf wl-typ-${f.type}`}>
                <span className="wl-format-nr"><span className="wl-pixelpunkt" />{f.nr}</span>
                <span className="wl-format-name" data-form={FORMBILD[f.type]}>{f.label}</span>
                <span className="wl-format-sub">{f.sub}</span>
                <ArrowUpRight size={20} strokeWidth={1.6} className="wl-format-pfeil" />
              </Link>
            ))}
          </div>
        </section>

        <section className="wl-abschnitt wl-herzprobe wl-auf">
          <span className="wl-label"><span className="wl-form" data-form="herz">Das Logo als Herz</span></span>
          <div className="wl-herzprobe-reihe">
            <span className="wl-probe"><BLogo size={96} title="" /><em>Logo</em></span>
            <span className="wl-probe-pfeil">90°</span>
            <span className="wl-probe"><BLogo herz size={96} title="" style={{ color: "#0A0A0A" }} /><em>Favorit aus</em></span>
            <span className="wl-probe wl-probe-an"><BLogo herz size={96} title="" /><em>Favorit an</em></span>
          </div>
        </section>
      </div>

      <footer className="wl-fuss">
        <BLogo size={120} title="" />
        <p className="wl-fuss-satz">Kaufen. Verkaufen. Gutes tun.</p>
        <p className="wl-label wl-fuss-label">Vorschau zum Entscheiden. Noch nichts davon ist auf der echten Seite.</p>
      </footer>
    </div>
  );
}
