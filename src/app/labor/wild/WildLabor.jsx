"use client";
// Frontseite im Look von craft.wild.as mit dem Pixel-B (Denis 19.09.2026). Eigene Route NEBEN der echten
// Startseite, die unberührt bleibt. Liegt ausserhalb von (public) und bringt ihren eigenen Header mit.
// Übernommen sind Prinzipien, nicht Code: weisser Grund mit feinem Karoraster, fast schwarze Schrift, leichte
// Grotesk mit grossen Versal-Titeln, Mono-Labels, ein Pixelfeld (PixelFeld.jsx) mit Wolke, Zeiger-Fleck,
// Pfeil, Pixelbildern, Explosion und Laufschrift. Das Logo dient gedreht als Favoriten-Herz (BLogo herz).
// Aufbau von oben nach unten: Hero (fast leer), Suche mit echten Zahlen, Endet bald, Neu eingestellt,
// Kategorien, Fünf Formate, Gebühren, So funktioniert es, Gerade passiert, Laufschrift, Fuss.
// Alle Daten sind echt und öffentlich lesbar (Inserate, Kategorien, Gebote ohne Namen). Nichts ist erfunden:
// Gibt es zu einem Abschnitt keine Daten, erscheint er nicht.
// Styles: globals.css unter WILD-LABOR (wl-*).
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getCoverUrl, getDisplayPrice } from "@/lib/formatters";
import { DEFAULT_FEE_PERCENT, BEE_IMPACT_RATE } from "@/lib/constants";
import BLogo from "@/components/shared/BLogo";
import PixelFeld from "./PixelFeld";
import PixelBiene from "./PixelBiene";
import { FARBEN } from "./farben";

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
const SCHRITTE = [
  { nr: "01", label: "Inserieren", sub: "Fotos hochladen, Format wählen, Bee-Rate festlegen. Die KI schreibt den Text auf Wunsch mit." },
  { nr: "02", label: "Handeln", sub: "Verkaufen, versteigern, vermieten oder verschenken. Bezahlt wird direkt zwischen euch, per TWINT, Bank oder bar." },
  { nr: "03", label: "Gutes tun", sub: "Von jeder Gebühr gehen 20 % an den Bienenschutz. Das steht auf jeder Rechnung." },
];
// Fusszeile: dieselben Seiten wie im Fuss der echten Startseite
const FUSS = [
  { titel: "Marktplatz", links: [{ label: "Stöbern", href: "/search" }, { label: "Inserieren", href: "/listings/new" }, { label: "So funktioniert es", href: "/how-it-works" }] },
  { titel: "BEEDARO", links: [{ label: "Über uns", href: "/about" }, { label: "Bee-Impact", href: "/impact" }, { label: "Hilfe und FAQ", href: "/help" }, { label: "Kontakt", href: "/contact" }] },
  { titel: "Rechtliches", links: [{ label: "Impressum", href: "/imprint" }, { label: "Datenschutz", href: "/privacy" }, { label: "AGB", href: "/terms" }] },
];
const LISTE = "id, title, listing_type, price, start_price, rent_price, rent_period, city, created_at, auction_end, listing_images(url, sort_order)";

function preis(l) {
  if (l.listing_type === "free") return "Gratis";
  const p = getDisplayPrice(l);
  return `${p.prefix}${p.text}${p.suffix}`;
}
function vorhin(iso) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min`;
  if (min < 1440) return `vor ${Math.round(min / 60)} Std`;
  return `vor ${Math.round(min / 1440)} T`;
}
// Impuls ans Pixelfeld schicken (Bildschirmkoordinaten): Das Feld trägt dort Wärme auf
const impuls = (x, y, staerke) => window.dispatchEvent(new CustomEvent("wl-impuls", { detail: { x, y, staerke } }));

function Herz({ id }) {
  const [an, setAn] = useState(false);
  return (
    <button type="button" className={`wl-herz eckig kein-akzent${an ? " wl-herz-an" : ""}`} aria-pressed={an}
      aria-label={an ? "Aus den Favoriten entfernen" : "Zu den Favoriten"}
      onClick={() => setAn((v) => !v)} data-id={id}>
      <BLogo herz size={18} title="" />
    </button>
  );
}

// Restzeit einer Auktion mit Pixelbalken: 20 Kacheln, die sich mit der ablaufenden Zeit leeren
function Restzeit({ start, ende }) {
  const [jetzt, setJetzt] = useState(null);
  useEffect(() => { setJetzt(Date.now()); const t = setInterval(() => setJetzt(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (jetzt === null) return <span className="wl-rest" />;
  const e = new Date(ende).getTime(), s = new Date(start).getTime(), ms = Math.max(0, e - jetzt), sek = Math.floor(ms / 1000);
  const tage = Math.floor(sek / 86400), text = tage > 0
    ? `${tage} T ${String(Math.floor((sek % 86400) / 3600)).padStart(2, "0")} Std`
    : `${String(Math.floor(sek / 3600)).padStart(2, "0")}:${String(Math.floor((sek % 3600) / 60)).padStart(2, "0")}:${String(sek % 60).padStart(2, "0")}`;
  const voll = Math.max(0, Math.min(20, Math.ceil((ms / Math.max(1, e - s)) * 20)));
  return (
    <span className="wl-rest">
      <span className="wl-rest-zeit">Endet in {text}</span>
      <span className="wl-rest-balken" aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <i key={i} className={i < voll ? "an" : ""} />)}</span>
    </span>
  );
}

// Karte: Der Link umfasst Bild und Text, das Herz ist ein eigener Knopf daneben (ein Knopf IM Link wäre ungültiges
// HTML und für Tastatur und Screenreader verwirrend). Beide liegen in einem Rahmen, der den Inserattyp trägt.
function Karte({ l, mitRest }) {
  return (
    <div className="wl-karte wl-auf" data-typ={l.listing_type}>
      <Link href={`/listing/${l.id}`} className="wl-karte-link" aria-label={`${l.title}, ${FORMAT[l.listing_type]}, ${preis(l)}`}>
        <span className="wl-bild">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getCoverUrl(l)} alt="" loading="lazy" />
          <span className="wl-reiter" aria-hidden="true">Ansehen <ArrowUpRight size={13} strokeWidth={2} /></span>
        </span>
        <span className="wl-textblock">
          <span className={`wl-meta wl-typ-${l.listing_type}`}><span className="wl-pixelpunkt" />{FORMAT[l.listing_type]}{l.city ? ` · ${l.city}` : ""}</span>
          <span className="wl-titel">{l.title}</span>
          <span className="wl-preis">{preis(l)}</span>
          {mitRest && l.auction_end && <Restzeit start={l.created_at} ende={l.auction_end} />}
        </span>
      </Link>
      <Herz id={l.id} />
    </div>
  );
}

// Balken aus Kacheln, der sich beim Hereinscrollen füllt (einmal, danach steht er)
function PixelBalken({ anteil, farbe, n = 40 }) {
  const voll = Math.round(anteil * n);
  return (
    <span className="wl-balken" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => <i key={i} className={i < voll ? "an" : ""} style={i < voll ? { background: farbe, transitionDelay: `${i * 22}ms` } : undefined} />)}
    </span>
  );
}

export default function WildLabor() {
  const router = useRouter();
  const [inserate, setInserate] = useState([]);
  const [endend, setEndend] = useState([]);
  const [kategorien, setKategorien] = useState([]);
  const [zahlen, setZahlen] = useState(null);
  const [gebote, setGebote] = useState([]);
  const [q, setQ] = useState("");
  const wurzel = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = SCHRIFT; document.head.appendChild(link);
    const jetzt = new Date().toISOString();
    const aktiv = () => supabase.from("listings").select(LISTE).eq("status", "active").or(`expires_at.is.null,expires_at.gt.${jetzt}`);
    aktiv().order("created_at", { ascending: false }).limit(24).then(({ data }) => setInserate((data || []).filter((l) => getCoverUrl(l))));
    aktiv().eq("listing_type", "auction").gt("auction_end", jetzt).order("auction_end", { ascending: true }).limit(8)
      .then(({ data }) => setEndend((data || []).filter((l) => getCoverUrl(l)).slice(0, 4)));
    supabase.from("categories").select("id, name, slug, sort_order").is("parent_id", null).neq("is_active", false).order("sort_order")
      .then(({ data }) => setKategorien(data || []));
    Promise.all([
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active").eq("listing_type", "auction").gt("auction_end", jetzt),
    ]).then(([a, b]) => { if (typeof a.count === "number") setZahlen({ inserate: a.count, auktionen: b.count || 0 }); });
    // öffentliche Gebotsliste (View ohne Höchstgebot), hier ohne Namen verwendet
    supabase.from("public_bids").select("listing_id, amount, created_at").order("created_at", { ascending: false }).limit(6)
      .then(({ data }) => setGebote(data || []));
    return () => link.remove();
  }, []);

  // Alle Kartenraster exakt aufs Kachelraster setzen: Breite, Bildhöhe und Lage sind Vielfache von 10 px, gemessen
  // vom Ursprung des Karopapiers. CSS allein kann das nicht, weil die Spaltenbreite von der Fensterbreite abhängt.
  useEffect(() => {
    const grund = wurzel.current ? wurzel.current.querySelector(".wl-raster-grund") : null;
    if (!grund) return;
    const Z = 10;
    const setzen = () => {
      const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
      const spalten = window.innerWidth / zoom <= 900 ? 2 : 4, luecke = 2 * Z;
      grund.querySelectorAll(".wl-karten").forEach((el) => {
        el.style.setProperty("--schub-x", "0px"); el.style.setProperty("--schub-y", "0px");
        const breite = Math.floor((el.clientWidth - Z - (spalten - 1) * luecke) / spalten / Z) * Z;
        const r = el.getBoundingClientRect(), g = grund.getBoundingClientRect();
        const links = (r.left - g.left) / zoom, oben = (r.top - g.top) / zoom;
        el.style.setProperty("--kw", breite + "px");
        el.style.setProperty("--kh", Math.round((breite * 1.25) / Z) * Z + "px");
        el.style.setProperty("--schub-x", ((Z - (links % Z)) % Z) + "px");
        el.style.setProperty("--schub-y", ((Z - (oben % Z)) % Z) + "px");
      });
    };
    setzen();
    const ro = new ResizeObserver(setzen);
    ro.observe(grund);
    return () => ro.disconnect();
  }, [inserate, endend, kategorien]);

  // Einblenden beim Hereinscrollen, einmal. Danach steht der Abschnitt still.
  useEffect(() => {
    const el = wurzel.current;
    if (!el) return;
    const teile = [...el.querySelectorAll(".wl-auf:not(.wl-da)")];
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (ruhig || typeof IntersectionObserver === "undefined") { teile.forEach((t) => t.classList.add("wl-da")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("wl-da"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
    teile.forEach((t, i) => { t.style.transitionDelay = `${(i % 4) * 60}ms`; io.observe(t); });
    return () => io.disconnect();
  }, [inserate, endend, kategorien, gebote]);

  // Gerade passiert: neue Inserate und Gebote, nach Zeit gemischt. Ohne Namen.
  const protokoll = useMemo(() => {
    const titel = new Map([...inserate, ...endend].map((l) => [l.id, l.title]));
    const zeilen = [
      ...inserate.slice(0, 6).map((l) => ({ id: `n-${l.id}`, zeit: l.created_at, art: "Neu", text: l.title, ort: l.city, href: `/listing/${l.id}` })),
      ...gebote.filter((g) => titel.has(g.listing_id)).map((g, i) => ({ id: `g-${g.listing_id}-${i}`, zeit: g.created_at, art: "Gebot", text: `CHF ${Number(g.amount).toLocaleString("de-CH")} auf ${titel.get(g.listing_id)}`, href: `/listing/${g.listing_id}` })),
    ];
    return zeilen.sort((a, b) => new Date(b.zeit) - new Date(a.zeit)).slice(0, 7);
  }, [inserate, endend, gebote]);

  const suchen = (e) => {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    impuls(r.left + r.width / 2, r.top + r.height / 2, 1);
    const t = q.trim();
    setTimeout(() => router.push(t ? `/search?q=${encodeURIComponent(t)}` : "/search"), 220);
  };
  const tippen = (e) => {
    setQ(e.target.value);
    const r = e.target.getBoundingClientRect(); // jeder Tastendruck gibt dem Feld einen kleinen Stoss neben dem Suchfeld
    impuls(r.left + Math.random() * r.width, r.bottom + 14 + Math.random() * 30, 0.35);
  };

  const ueblich = 0.12, unser = DEFAULT_FEE_PERCENT / 100;
  const neu = inserate.slice(0, 8);

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

      {/* Das Karoraster beginnt direkt unter dem Header: Der Hero steht mitten im Raster, die Pixel-Wolke hängt
          darüber. Kein eigener Abschnitt. */}
      <div className="wl-raster-grund">
        <PixelFeld ursprung=".wl-raster-grund" />

        <section className="wl-hero">
          {/* data-entschluesseln: Das Pixelfeld zeigt den Satz beim Laden zuerst als Kacheln, dann kommt die echte Schrift */}
          <h1 className="wl-h1" data-entschluesseln="1">
            <span className="wl-zeile"><span>Was du suchst,</span></span>
            <span className="wl-zeile"><span>hat schon jemand.</span></span>
          </h1>
          {/* Fast leer wie bei wild (Denis 19.09.: die Karte rechts und die Aufteilung gefielen nicht): links die
              Aussage in Versalien, rechts das Pixel-B und ein kurzer Satz. Suche und Knöpfe stehen im Abschnitt darunter. */}
          <div className="wl-hero-unten">
            <p className="wl-gross">Ein Marktplatz<br />für zweite Hand in der Schweiz</p>
            <div className="wl-hero-rechts">
              {/* Die Biene steht hier und schlägt mit den Flügeln, sie fliegt nicht. Ihre Flügel sind das BEEDARO-B. */}
              <PixelBiene />
              <p className="wl-text">Kaufen, bieten, mieten, buchen oder verschenken. Fünf Formate an einem Ort. 20 % jeder Gebühr gehen an den Bienenschutz.</p>
            </div>
          </div>
        </section>

        <section className="wl-abschnitt wl-suchabschnitt">
          <form className="wl-suche wl-auf" onSubmit={suchen} role="search">
            <Search size={22} strokeWidth={1.7} aria-hidden="true" />
            <input className="pille-input" type="text" value={q} onChange={tippen} placeholder="Was suchst du? Velo, Kamera, Sofa …" aria-label="Suchbegriff" />
            <button type="submit" className="wl-knopf wl-knopf-ink eckig kein-akzent">Suchen</button>
          </form>
          <div className="wl-suchzeile wl-auf">
            {zahlen && (
              <p className="wl-label wl-zahlen">
                <span>{zahlen.inserate.toLocaleString("de-CH")} Inserate</span>
                <span>{zahlen.auktionen} Auktionen laufen</span>
                <span>{kategorien.length || 14} Kategorien</span>
              </p>
            )}
            <div className="wl-knoepfe">
              <Link href="/listings/new" className="wl-knopf wl-knopf-ink"><Plus size={15} strokeWidth={2.2} /> Inserieren</Link>
              <Link href="/search" className="wl-knopf wl-knopf-linie">Stöbern <ArrowUpRight size={15} strokeWidth={2} /></Link>
            </div>
          </div>
        </section>

        {endend.length > 0 && (
          <section className="wl-abschnitt">
            <div className="wl-abschnitt-kopf wl-auf">
              <span className="wl-label"><span className="wl-form" data-form="blitz">Endet bald</span></span>
              <h2 className="wl-h2" data-wort="HUI">Die Uhr läuft. Wer zuletzt bietet, gewinnt.</h2>
              <Link href="/search?type=auction" className="wl-mehr">Alle Auktionen <ArrowUpRight size={14} strokeWidth={2} /></Link>
            </div>
            <div className="wl-karten wl-karten-hoch">{endend.map((l) => <Karte key={l.id} l={l} mitRest />)}</div>
          </section>
        )}

        <section className="wl-abschnitt">
          <div className="wl-abschnitt-kopf wl-auf">
            <span className="wl-label"><span className="wl-form" data-form="stern">Neu eingestellt</span></span>
            <h2 className="wl-h2" data-wort="NEU">Frisch aus <span className="wl-form" data-form="haus">Kellern</span>, Estrichen und <span className="wl-form" data-form="smiley">Werkstätten</span>.</h2>
            <Link href="/search" className="wl-mehr">Alle ansehen <ArrowUpRight size={14} strokeWidth={2} /></Link>
          </div>
          <div className="wl-karten">{neu.map((l) => <Karte key={l.id} l={l} />)}</div>
        </section>

        {kategorien.length > 0 && (
          <section className="wl-abschnitt">
            <div className="wl-abschnitt-kopf wl-auf">
              <span className="wl-label">Kategorien</span>
              <h2 className="wl-h2">Vom Velo bis zur Spielkonsole.</h2>
            </div>
            <div className="wl-kategorien">
              {kategorien.map((k, i) => (
                <Link key={k.id} href={`/search?category=${k.id}`} className="wl-kategorie wl-auf">
                  <span className="wl-format-nr">{String(i + 1).padStart(2, "0")}</span>
                  <span className="wl-kategorie-name">{k.name}</span>
                  <ArrowUpRight size={16} strokeWidth={1.8} className="wl-format-pfeil" />
                </Link>
              ))}
            </div>
          </section>
        )}

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

        <section className="wl-abschnitt">
          <div className="wl-abschnitt-kopf wl-auf">
            <span className="wl-label">Gebühren</span>
            <h2 className="wl-h2">Weniger Gebühr. Ein Fünftel davon für die Bienen.</h2>
          </div>
          <div className="wl-gebuehren wl-auf">
            <div className="wl-gebuehr">
              <span className="wl-gebuehr-kopf"><span>Üblich bei Auktionsplattformen</span><strong>8 bis 12 %</strong></span>
              <PixelBalken anteil={ueblich / 0.12} farbe={FARBEN.ink} />
              <span className="wl-gebuehr-fuss">Erfolgsprovision, je nach Verkaufspreis</span>
            </div>
            <div className="wl-gebuehr">
              <span className="wl-gebuehr-kopf"><span>BEEDARO</span><strong>{DEFAULT_FEE_PERCENT} %</strong></span>
              <PixelBalken anteil={unser / 0.12} farbe={FARBEN.blau} />
              <span className="wl-gebuehr-fuss">Standard. Du wählst selbst zwischen 3, 5, 7 und 10 %.</span>
            </div>
            <div className="wl-gebuehr">
              <span className="wl-gebuehr-kopf"><span>davon für Bienenschutz</span><strong>{Math.round(BEE_IMPACT_RATE * 100)} %</strong></span>
              <PixelBalken anteil={(unser * BEE_IMPACT_RATE) / 0.12} farbe={FARBEN.honig} />
              <span className="wl-gebuehr-fuss">Ein Fünftel jeder Gebühr, ausgewiesen auf der Rechnung.</span>
            </div>
          </div>
        </section>

        <section className="wl-abschnitt">
          <div className="wl-abschnitt-kopf wl-auf">
            <span className="wl-label">So funktioniert es</span>
            <h2 className="wl-h2">Drei Schritte, kein Kleingedrucktes.</h2>
          </div>
          <div className="wl-formate">
            {SCHRITTE.map((f) => (
              <div key={f.nr} className="wl-format wl-schritt wl-auf">
                <span className="wl-format-nr">{f.nr}</span>
                <span className="wl-format-name">{f.label}</span>
                <span className="wl-format-sub">{f.sub}</span>
              </div>
            ))}
          </div>
        </section>

        {protokoll.length > 0 && (
          <section className="wl-abschnitt">
            <div className="wl-abschnitt-kopf wl-auf">
              <span className="wl-label">Gerade passiert</span>
              <h2 className="wl-h2">Was eben hereinkam.</h2>
            </div>
            <ul className="wl-protokoll">
              {protokoll.map((z) => (
                <li key={z.id} className="wl-auf">
                  <Link href={z.href}>
                    <span className="wl-protokoll-zeit">{vorhin(z.zeit)}</span>
                    <span className={`wl-protokoll-art wl-protokoll-${z.art === "Gebot" ? "gebot" : "neu"}`}>{z.art}</span>
                    <span className="wl-protokoll-text">{z.text}{z.ort ? `, ${z.ort}` : ""}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Laufschrift aus Pixeln: Das Pixelfeld stempelt den Text in dieses leere Band (siehe PixelFeld, lauf).
            Für Screenreader steht der Satz als versteckter Text da. */}
        <div className="wl-laufband" data-text="BEEDARO   KAUFEN.  VERKAUFEN.  GUTES TUN.   ">
          <span className="wl-nur-leser">Beedaro. Kaufen. Verkaufen. Gutes tun.</span>
        </div>
      </div>

      <footer className="wl-fuss">
        <div className="wl-fuss-kopf">
          <BLogo size={96} title="BEEDARO" />
          <p className="wl-fuss-satz">Kaufen. Verkaufen. Gutes tun.</p>
        </div>
        <nav className="wl-fuss-nav" aria-label="Fusszeile">
          {FUSS.map((g) => (
            <div key={g.titel}>
              <span className="wl-label">{g.titel}</span>
              {g.links.map((x) => <Link key={x.href} href={x.href}>{x.label}</Link>)}
            </div>
          ))}
        </nav>
        <p className="wl-label wl-fuss-label">© {new Date().getFullYear()} BEEDARO · Schweiz · 20 % jeder Gebühr für den Bienenschutz</p>
      </footer>
    </div>
  );
}
