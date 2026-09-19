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

      {/* Das Karoraster beginnt direkt unter dem Header (Denis 19.09.): Der Hero steht mitten im Raster, die
          Pixel-Wolke hängt vom Seitenanfang herab und fliesst um die Hero-Schrift. Kein eigener Abschnitt mehr. */}
      <div className="wl-raster-grund">
        <PixelFeld ursprung=".wl-raster-grund" />
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

        {/* Laufschrift aus Pixeln: Das Pixelfeld stempelt den Text in dieses leere Band (siehe PixelFeld, lauf).
            Für Screenreader steht der Satz als versteckter Text da. */}
        <div className="wl-laufband" data-text="BEEDARO   KAUFEN.  VERKAUFEN.  GUTES TUN.   ">
          <span className="wl-nur-leser">Beedaro. Kaufen. Verkaufen. Gutes tun.</span>
        </div>
      </div>

      <footer className="wl-fuss">
        <BLogo size={120} title="" />
        <p className="wl-fuss-satz">Kaufen. Verkaufen. Gutes tun.</p>
        <p className="wl-label wl-fuss-label">Vorschau zum Entscheiden. Noch nichts davon ist auf der echten Seite.</p>
      </footer>
    </div>
  );
}
