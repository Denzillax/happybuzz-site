"use client";
// Stilseite (Denis 19.09.2026): BEEDARO in der Richtung der Framer-Vorlage "Ecomiz".
// Übernommen sind die Prinzipien, nicht der Code: vollflächiges Gelb #FFF55B, Ink als einzige
// zweite Farbe, Funnel Sans mit Versal-Titeln, feine Ink-Linien als Rahmen, Bilder mit 10 px
// Rundung, ruhige Bewegung (Einblenden beim Scrollen, Bildzoom, Laufband).
// Die Seite liegt bewusst ausserhalb von (public): Sie bringt ihren eigenen Header mit dem
// Bienen-Logo mit. Hier wird EINMAL über die Richtung entschieden, bevor etwas auf die echte
// Seite kommt. Styles: globals.css unter STIL-LABOR (Klassen sl-*).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, ArrowUpRight, Tag, Gavel, CalendarClock, Gift, Wrench, Search, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getCoverUrl, getDisplayPrice } from "@/lib/formatters";
import { TYP_FARBEN } from "@/lib/constants";
import BeeLogo from "@/components/shared/BeeLogo";

const SCHRIFT = "https://fonts.googleapis.com/css2?family=Funnel+Sans:wght@400;500;600;700;800&display=swap";
const FORMAT = { sell: "Festpreis", auction: "Auktion", rent: "Miete", free: "Gratis", service: "Service" };
const FORMATE = [
  { type: "sell", label: "Festpreis", sub: "Kaufen wie gewohnt", icon: Tag },
  { type: "auction", label: "Auktion", sub: "Bieten und gewinnen", icon: Gavel },
  { type: "rent", label: "Mieten", sub: "Nutzen statt besitzen", icon: CalendarClock },
  { type: "free", label: "Gratis", sub: "Verschenken, abholen", icon: Gift },
  { type: "service", label: "Service", sub: "Handwerk und Hilfe buchen", icon: Wrench },
];

function preis(l) {
  if (l.listing_type === "free") return "Gratis";
  const p = getDisplayPrice(l);
  return `${p.prefix}${p.text}${p.suffix}`; // formatPrice bringt CHF schon mit
}

function Karte({ l }) {
  const f = TYP_FARBEN[l.listing_type];
  return (
    <Link href={`/listing/${l.id}`} className="sl-karte sl-auf">
      <span className="sl-bild">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getCoverUrl(l)} alt="" loading="lazy" />
        {f && <span className="sl-chip" style={{ background: f.bg, color: f.fg }}>{FORMAT[l.listing_type]}</span>}
        <span className="sl-herz" aria-hidden="true"><Heart size={16} strokeWidth={2.2} /></span>
      </span>
      <span className="sl-preis">{preis(l)}</span>
      <span className="sl-titel">{l.title}</span>
    </Link>
  );
}

export default function StilLabor() {
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
      .limit(24)
      .then(({ data }) => setInserate((data || []).filter((l) => getCoverUrl(l))));
    return () => link.remove();
  }, []);

  // Einblenden beim Scrollen. Ohne IntersectionObserver oder mit "Bewegung reduzieren" ist alles sofort da.
  useEffect(() => {
    const el = wurzel.current;
    if (!el) return;
    const teile = [...el.querySelectorAll(".sl-auf")];
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (ruhig || typeof IntersectionObserver === "undefined") { teile.forEach((t) => t.classList.add("sl-da")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("sl-da"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    teile.forEach((t, i) => { t.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(t); });
    return () => io.disconnect();
  }, [inserate]);

  const mosaik = inserate.slice(0, 6), raster = inserate.slice(0, 8), zeilen = inserate.slice(8, 11);
  const band = ["Kaufen", "Bieten", "Mieten", "Buchen", "Verschenken", "20 % der Gebühr für Bienenschutz"];

  return (
    <div className="sl" ref={wurzel}>
      <div className="sl-rahmen">
        <header className="sl-kopf">
          <Link href="/labor/stil" className="sl-logo" aria-label="BEEDARO">
            <BeeLogo size={46} />
            <span className="sl-wort">BEE<i>DARO</i></span>
          </Link>
          <nav className="sl-nav" aria-label="Hauptnavigation">
            <Link href="/search">Stöbern</Link>
            <Link href="/how-it-works">So funktioniert es</Link>
            <Link href="/impact">Bienenschutz</Link>
          </nav>
          <div className="sl-kopf-rechts">
            <Link href="/search" className="sl-rund" aria-label="Suchen"><Search size={18} strokeWidth={2.2} /></Link>
            <Link href="/listings/new" className="sl-knopf sl-knopf-ink sl-kopf-cta" aria-label="Inserieren"><Plus size={16} strokeWidth={2.6} /> <span className="sl-nur-breit">Inserieren</span></Link>
          </div>
        </header>

        <section className="sl-hero">
          <div className="sl-mosaik" aria-hidden="true">
            {mosaik.map((l, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={l.id} src={getCoverUrl(l)} alt="" style={{ animationDelay: `${i * 0.6}s` }} />
            ))}
          </div>
          <div className="sl-hero-text">
            <h1 className="sl-h1">
              <span className="sl-zeile"><span>Was du suchst,</span></span>
              <span className="sl-zeile"><span>hat schon jemand.</span></span>
            </h1>
            <p className="sl-hero-unter">Kaufen, bieten, mieten, buchen oder verschenken. Ein Marktplatz, fünf Formate.</p>
            <div className="sl-hero-knoepfe">
              <Link href="/listings/new" className="sl-knopf sl-knopf-gelb"><Plus size={16} strokeWidth={2.6} /> Inserieren</Link>
              <Link href="/search" className="sl-knopf sl-knopf-hell">Stöbern <ArrowRight size={16} strokeWidth={2.4} /></Link>
            </div>
          </div>
        </section>

        <div className="sl-band" aria-hidden="true">
          <div className="sl-band-lauf">
            {[0, 1].map((k) => (
              <span key={k} className="sl-band-teil">
                {band.map((t) => <span key={t}>{t}<BeeLogo size={22} style={{ color: "#FFF55B", display: "inline-block", margin: "0 28px", verticalAlign: "-3px" }} title="" /></span>)}
              </span>
            ))}
          </div>
        </div>

        <section className="sl-abschnitt">
          <div className="sl-abschnitt-kopf sl-auf">
            <h2 className="sl-h2">Neu eingestellt</h2>
            <Link href="/search" className="sl-mehr">Alle ansehen <ArrowUpRight size={16} strokeWidth={2.4} /></Link>
          </div>
          <div className="sl-raster">{raster.map((l) => <Karte key={l.id} l={l} />)}</div>
        </section>

        <section className="sl-abschnitt">
          <div className="sl-abschnitt-kopf sl-auf">
            <h2 className="sl-h2">Fünf Formate, ein Marktplatz</h2>
          </div>
          <div className="sl-formate">
            {FORMATE.map((f) => {
              const Icon = f.icon, farbe = TYP_FARBEN[f.type];
              return (
                <Link key={f.type} href={`/search?type=${f.type}`} className="sl-format sl-auf">
                  <span className="sl-format-icon" style={{ background: farbe.bg, color: farbe.fg }}><Icon size={20} strokeWidth={2} /></span>
                  <span className="sl-format-name">{f.label}</span>
                  <span className="sl-format-sub">{f.sub}</span>
                  <ArrowUpRight size={18} strokeWidth={2.2} className="sl-format-pfeil" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="sl-abschnitt">
          <div className="sl-abschnitt-kopf sl-auf">
            <h2 className="sl-h2">Als Liste</h2>
          </div>
          <div className="sl-liste">
            {zeilen.map((l) => (
              <Link key={l.id} href={`/listing/${l.id}`} className="sl-reihe sl-auf">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getCoverUrl(l)} alt="" loading="lazy" />
                <span className="sl-reihe-text">
                  <span className="sl-reihe-titel">{l.title}</span>
                  <span className="sl-reihe-sub">{FORMAT[l.listing_type]}{l.city ? `, ${l.city}` : ""}</span>
                </span>
                <span className="sl-reihe-preis">{preis(l)}</span>
                <ArrowUpRight size={20} strokeWidth={2.2} className="sl-reihe-pfeil" />
              </Link>
            ))}
          </div>
        </section>

        <section className="sl-abschnitt">
          <div className="sl-abschnitt-kopf sl-auf">
            <h2 className="sl-h2">Knöpfe und Felder</h2>
          </div>
          <div className="sl-muster sl-auf">
            <button type="button" className="sl-knopf sl-knopf-ink eckig kein-akzent">Jetzt kaufen</button>
            <button type="button" className="sl-knopf sl-knopf-linie eckig kein-akzent">Preis vorschlagen</button>
            <button type="button" className="sl-knopf sl-knopf-weiss eckig kein-akzent">Merken</button>
            <span className="sl-link">Alle Auktionen <ArrowUpRight size={15} strokeWidth={2.4} /></span>
            <label className="sl-feld"><Search size={17} strokeWidth={2.2} /><input className="pille-input" type="text" placeholder="Was suchst du?" aria-label="Suchfeld Muster" /></label>
          </div>
        </section>

        <footer className="sl-fuss">
          <BeeLogo size={64} style={{ color: "#FFF55B" }} />
          <p className="sl-fuss-satz">20 % jeder Gebühr gehen an den Bienenschutz.</p>
          <p className="sl-fuss-klein">Stilseite zum Entscheiden. Noch nichts davon ist auf der echten Seite.</p>
        </footer>
      </div>
    </div>
  );
}
