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

// Pixel-Mosaik: Spalten aus Quadraten wachsen von oben herab und ziehen sich wieder zurück.
// In den Farben von wild. Läuft nur im Bild, steht mit "Bewegung reduzieren" still.
function PixelBand() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const Z = 16, REIHEN = 9;
    let spalten = [], B = 0, raf = 0, sichtbar = true, zeit = 0;
    // Palette von wild: Blau und Gelb tragen, dazu Orangerot, Lime und Navy
    const farbe = () => { const r = Math.random(); return r < 0.3 ? "#3B5BD9" : r < 0.6 ? "#FBF062" : r < 0.75 ? "#E0492A" : r < 0.85 ? "#D8FF00" : "#1C2541"; };
    const bauen = () => {
      B = cv.parentElement.clientWidth;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(B * dpr); cv.height = Math.round(REIHEN * Z * dpr);
      cv.style.width = B + "px"; cv.style.height = REIHEN * Z + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.ceil(B / Z);
      spalten = Array.from({ length: n }, (_, i) => {
        // Hügelform: zwei breite Wellen über die Breite, dazu Zufall
        const welle = (Math.sin((i / n) * Math.PI * 2.2) + 1) / 2 * 0.6 + (Math.sin((i / n) * Math.PI * 7) + 1) / 2 * 0.25;
        return { ziel: welle * REIHEN, h: 0, phase: Math.random() * 6.28, farben: Array.from({ length: REIHEN }, farbe) };
      });
    };
    const malen = () => {
      ctx.clearRect(0, 0, B, REIHEN * Z);
      spalten.forEach((s, i) => {
        const hoehe = Math.max(0, Math.min(REIHEN, s.h + Math.sin(zeit / 50 + s.phase) * 0.9));
        const voll = Math.floor(hoehe);
        for (let r = 0; r < voll; r += 1) { ctx.fillStyle = s.farben[r]; ctx.fillRect(i * Z, r * Z, Z - 1, Z - 1); }
      });
    };
    const takt = () => {
      zeit += 1;
      for (const s of spalten) s.h += (s.ziel - s.h) * 0.04;
      malen();
      raf = sichtbar ? requestAnimationFrame(takt) : 0;
    };
    bauen();
    if (ruhig) { spalten.forEach((s) => { s.h = s.ziel; }); malen(); }
    const io = new IntersectionObserver((es) => { sichtbar = es[0].isIntersecting; if (sichtbar && !raf && !ruhig) raf = requestAnimationFrame(takt); });
    io.observe(cv);
    const ro = new ResizeObserver(() => { bauen(); if (ruhig) { spalten.forEach((s) => { s.h = s.ziel; }); malen(); } });
    ro.observe(cv.parentElement);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
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
    <Link href={`/listing/${l.id}`} className="wl-karte wl-auf">
      <span className="wl-bild">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getCoverUrl(l)} alt="" loading="lazy" />
        <Herz id={l.id} />
        <span className="wl-reiter">Ansehen <ArrowUpRight size={13} strokeWidth={2} /></span>
      </span>
      <span className={`wl-meta wl-typ-${l.listing_type}`}><span className="wl-pixelpunkt" />{FORMAT[l.listing_type]}{l.city ? ` · ${l.city}` : ""}</span>
      <span className="wl-titel">{l.title}</span>
      <span className="wl-preis">{preis(l)}</span>
    </Link>
  );
}

export default function WildLabor() {
  const [inserate, setInserate] = useState([]);
  const wurzel = useRef(null);

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
            <span className="wl-label">Neu eingestellt</span>
            <h2 className="wl-h2">Frisch aus Kellern, Estrichen und Werkstätten.</h2>
            <Link href="/search" className="wl-mehr">Alle ansehen <ArrowUpRight size={14} strokeWidth={2} /></Link>
          </div>
          <div className="wl-karten">{inserate.map((l) => <Karte key={l.id} l={l} />)}</div>
        </section>

        <section className="wl-abschnitt">
          <div className="wl-abschnitt-kopf wl-auf">
            <span className="wl-label">Fünf Formate</span>
            <h2 className="wl-h2">Ein Marktplatz, fünf Wege zum Handel.</h2>
          </div>
          <div className="wl-formate">
            {FORMATE.map((f) => (
              <Link key={f.type} href={`/search?type=${f.type}`} className={`wl-format wl-auf wl-typ-${f.type}`}>
                <span className="wl-format-nr"><span className="wl-pixelpunkt" />{f.nr}</span>
                <span className="wl-format-name">{f.label}</span>
                <span className="wl-format-sub">{f.sub}</span>
                <ArrowUpRight size={20} strokeWidth={1.6} className="wl-format-pfeil" />
              </Link>
            ))}
          </div>
        </section>

        <section className="wl-abschnitt wl-herzprobe wl-auf">
          <span className="wl-label">Das Logo als Herz</span>
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
