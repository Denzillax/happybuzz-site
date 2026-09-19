"use client";
// Frontseite im Stil der Framer-Vorlage "Meeko" (Denis 19.09.2026), mit deren Farben und dem kacheligen BEEDARO-B.
// Eigene Route neben der echten Startseite und neben /labor/wild, beide bleiben unberührt.
// Übernommen ist die Formensprache, nicht der Code: Pastellflächen (Lavendel, Himmel, Rosa, Mint, Rosé, Butter) auf
// Weiss, fast schwarze Schrift #1D1D1D, schwebender weisser Pillen-Header mit feinem Rand, stark gerundete weisse
// Karten mit 1-px-Rand, runde Pfeil-Pillen in Pastell, Knöpfe mit 10 px Rundung und eingedrücktem unterem Schatten,
// grosse zentrierte Titel mit enger Laufweite, Text der beim Hovern durchrollt, ruhiges Einblenden.
// Die Vorlage ist ein Portfolio. Hier trägt dieselbe Form einen Marktplatz: Wo dort Projekte stehen, stehen echte
// Inserate, die drei Einstiegskarten sind Kaufen, Verkaufen und Gutes tun, der Prozess ist "So funktioniert es".
// Alle Daten sind echt. Es gibt keine erfundenen Kundenstimmen: An der Stelle des Zitats steht eine Tatsache.
// Styles: globals.css unter MEEKO-LABOR (mk-*).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera, Flower2, Menu, Plus, Search, ShoppingBag, X } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getCoverUrl, getDisplayPrice } from "@/lib/formatters";
import { DEFAULT_FEE_PERCENT, BEE_IMPACT_RATE } from "@/lib/constants";
import BLogo from "@/components/shared/BLogo";

const SCHRIFT = "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap";
const FORMAT = { sell: "Festpreis", auction: "Auktion", rent: "Miete", free: "Gratis", service: "Service" };
// Jedes Format hat seine Pastellfarbe, dieselbe trägt die Fläche hinter dem Inseratbild
const PASTELL = { sell: "butter", auction: "lavendel", rent: "himmel", free: "mint", service: "rosa" };
const FORMATE = [
  { type: "sell", label: "Festpreis", sub: "Kaufen wie gewohnt, zum festen Preis." },
  { type: "auction", label: "Auktion", sub: "Bieten, mitfiebern, gewinnen." },
  { type: "rent", label: "Mieten", sub: "Nutzen statt besitzen, tageweise." },
  { type: "free", label: "Gratis", sub: "Verschenken und abholen." },
  { type: "service", label: "Service", sub: "Handwerk und Hilfe buchen." },
];
const EINSTIEG = [
  { titel: "Kaufen", text: "Stöbere durch Inserate aus der ganzen Schweiz, vom Velo bis zur Spielkonsole.", href: "/search", icon: ShoppingBag, farbe: "mint" },
  { titel: "Verkaufen", text: "Fotos hochladen, Format wählen, fertig. Die KI schreibt den Text auf Wunsch mit.", href: "/listings/new", icon: Camera, farbe: "butter" },
  { titel: "Gutes tun", text: "Von jeder Gebühr gehen 20 % an den Bienenschutz. Das steht auf jeder Rechnung.", href: "/impact", icon: Flower2, farbe: "lavendel" },
];
const SCHRITTE = [
  { nr: "01", titel: "Inserieren", text: "Fotos hochladen, Format wählen, Bee-Rate festlegen. Du entscheidest selbst zwischen 3, 5, 7 und 10 %." },
  { nr: "02", titel: "Handeln", text: "Verkaufen, versteigern, vermieten oder verschenken. Bezahlt wird direkt zwischen euch, per TWINT, Bank oder bar." },
  { nr: "03", titel: "Gutes tun", text: "Ein Fünftel der Gebühr geht an den Bienenschutz. Der Betrag ist auf der Rechnung ausgewiesen." },
];
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

// Text, der beim Hovern durchrollt (zwei gleiche Zeilen übereinander, die obere fährt hinaus, die untere herein)
function Roll({ children }) {
  return <span className="mk-roll"><span>{children}</span><span aria-hidden="true">{children}</span></span>;
}

function Herz() {
  const [an, setAn] = useState(false);
  return (
    <button type="button" className={`mk-herz eckig kein-akzent${an ? " mk-herz-an" : ""}`} aria-pressed={an}
      aria-label={an ? "Aus den Favoriten entfernen" : "Zu den Favoriten"} onClick={() => setAn((v) => !v)}>
      <BLogo herz size={17} title="" />
    </button>
  );
}

function Restzeit({ ende }) {
  const [jetzt, setJetzt] = useState(null);
  useEffect(() => { setJetzt(Date.now()); const t = setInterval(() => setJetzt(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (jetzt === null) return null;
  const sek = Math.max(0, Math.floor((new Date(ende).getTime() - jetzt) / 1000)), tage = Math.floor(sek / 86400);
  const text = tage > 0 ? `${tage} T ${Math.floor((sek % 86400) / 3600)} Std` : `${String(Math.floor(sek / 3600)).padStart(2, "0")}:${String(Math.floor((sek % 3600) / 60)).padStart(2, "0")}:${String(sek % 60).padStart(2, "0")}`;
  return <span className="mk-rest">Noch {text}</span>;
}

function Karte({ l, mitRest }) {
  return (
    <article className="mk-karte mk-auf">
      <Link href={`/listing/${l.id}`} className="mk-karte-link" aria-label={`${l.title}, ${FORMAT[l.listing_type]}, ${preis(l)}`}>
        <span className={`mk-tafel mk-${PASTELL[l.listing_type] || "lavendel"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getCoverUrl(l)} alt="" loading="lazy" />
        </span>
        <span className="mk-karte-text">
          <span className="mk-tags">{FORMAT[l.listing_type]}{l.city ? `, ${l.city}` : ""}</span>
          <span className="mk-karte-titel">{l.title}</span>
          <span className="mk-karte-unten">
            <span className="mk-preis">{preis(l)}</span>
            {mitRest && l.auction_end && <Restzeit ende={l.auction_end} />}
          </span>
        </span>
      </Link>
      <Herz />
    </article>
  );
}

export default function MeekoLabor() {
  const router = useRouter();
  const [inserate, setInserate] = useState([]);
  const [endend, setEndend] = useState([]);
  const [q, setQ] = useState("");
  const [menue, setMenue] = useState(false);
  const [bildNr, setBildNr] = useState(0);
  const wurzel = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = SCHRIFT; document.head.appendChild(link);
    const jetzt = new Date().toISOString();
    const aktiv = () => supabase.from("listings").select(LISTE).eq("status", "active").or(`expires_at.is.null,expires_at.gt.${jetzt}`);
    aktiv().order("created_at", { ascending: false }).limit(24).then(({ data }) => setInserate((data || []).filter((l) => getCoverUrl(l))));
    aktiv().eq("listing_type", "auction").gt("auction_end", jetzt).order("auction_end", { ascending: true }).limit(8)
      .then(({ data }) => setEndend((data || []).filter((l) => getCoverUrl(l)).slice(0, 3)));
    return () => link.remove();
  }, []);

  // Das runde Bild im Hauptsatz zeigt echte Inserate und wechselt alle paar Sekunden
  useEffect(() => {
    if (inserate.length < 2) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setBildNr((n) => (n + 1) % Math.min(6, inserate.length)), 3200);
    return () => clearInterval(t);
  }, [inserate]);

  // Einblenden beim Hereinscrollen, einmal
  useEffect(() => {
    const el = wurzel.current;
    if (!el) return;
    const teile = [...el.querySelectorAll(".mk-auf:not(.mk-da)")];
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (ruhig || typeof IntersectionObserver === "undefined") { teile.forEach((t) => t.classList.add("mk-da")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("mk-da"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
    teile.forEach((t, i) => { t.style.transitionDelay = `${(i % 3) * 70}ms`; io.observe(t); });
    return () => io.disconnect();
  }, [inserate, endend]);

  const suchen = (e) => { e.preventDefault(); const t = q.trim(); router.push(t ? `/search?q=${encodeURIComponent(t)}` : "/search"); };
  const held = inserate[bildNr % Math.max(1, Math.min(6, inserate.length))];
  const neu = inserate.slice(0, 6);

  return (
    <div className="mk" ref={wurzel}>
      <header className="mk-kopf">
        <div className="mk-kopf-pille">
          <Link href="/labor/meeko" className="mk-logo" aria-label="BEEDARO">
            <BLogo size={30} title="" />
            <span>beedaro</span>
          </Link>
          <nav className="mk-nav" aria-label="Hauptnavigation">
            <Link href="/search"><Roll>Stöbern</Roll></Link>
            <Link href="/how-it-works"><Roll>So funktioniert es</Roll></Link>
            <Link href="/impact"><Roll>Bienenschutz</Roll></Link>
            <Link href="/favorites"><Roll>Favoriten</Roll></Link>
          </nav>
          <div className="mk-kopf-rechts">
            <Link href="/listings/new" className="mk-knopf mk-knopf-dunkel"><Plus size={16} strokeWidth={2.4} aria-hidden="true" /><Roll>Inserieren</Roll></Link>
            <button type="button" className="mk-knopf mk-menue-knopf eckig kein-akzent" aria-label={menue ? "Menü schliessen" : "Menü öffnen"} aria-expanded={menue} aria-controls="mk-menue" onClick={() => setMenue((v) => !v)}>
              {menue ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
            </button>
          </div>
        </div>
        {menue && (
          <nav id="mk-menue" className="mk-menue" aria-label="Menü">
            {[["Stöbern", "/search"], ["Inserieren", "/listings/new"], ["Favoriten", "/favorites"], ["So funktioniert es", "/how-it-works"], ["Bienenschutz", "/impact"]].map(([t, h]) => (
              <Link key={h} href={h} onClick={() => setMenue(false)}>{t}</Link>
            ))}
          </nav>
        )}
      </header>

      <section className="mk-hero">
        <h1 className="mk-h1">
          Was du suchst,{" "}
          <span className="mk-held" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {held && <img key={held.id} src={getCoverUrl(held)} alt="" />}
          </span>{" "}
          hat schon jemand.
        </h1>
        <p className="mk-hero-text">Der Schweizer Marktplatz für zweite Hand. <strong>Kaufen</strong>, <strong>bieten</strong>, <strong>mieten</strong>, <strong>buchen</strong> oder <strong>verschenken</strong>, alles an einem Ort.</p>
        <form className="mk-suche" onSubmit={suchen} role="search">
          <Search size={20} strokeWidth={2} aria-hidden="true" />
          <input className="pille-input" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Velo, Kamera, Sofa …" aria-label="Suchbegriff" />
          <button type="submit" className="mk-knopf mk-knopf-dunkel eckig kein-akzent"><Roll>Suchen</Roll></button>
        </form>
      </section>

      <section className="mk-einstieg">
        {EINSTIEG.map((k) => {
          const Icon = k.icon;
          return (
            <Link key={k.titel} href={k.href} className="mk-box mk-auf">
              <Icon size={58} strokeWidth={1.15} aria-hidden="true" />
              <span className="mk-box-titel">{k.titel}</span>
              <span className="mk-box-text">{k.text}</span>
              <span className={`mk-pfeil mk-${k.farbe}`} aria-hidden="true"><ArrowRight size={20} strokeWidth={1.8} /></span>
            </Link>
          );
        })}
      </section>

      <section className="mk-abschnitt">
        <div className="mk-abschnitt-kopf mk-auf">
          <h2 className="mk-h2">Neu eingestellt</h2>
          <p>Frisch aus Kellern, Estrichen und Werkstätten. Jedes Inserat ist ein echtes Angebot von jemandem aus der Schweiz.</p>
        </div>
        <div className="mk-karten">{neu.map((l) => <Karte key={l.id} l={l} />)}</div>
        <div className="mk-mehr mk-auf">
          <span className="mk-mehr-frage">Lust auf mehr?</span>
          <Link href="/search" className="mk-knopf"><Roll>Alle Inserate ansehen</Roll></Link>
        </div>
      </section>

      {/* An der Stelle, an der die Vorlage eine Kundenstimme zeigt, steht hier eine Tatsache. Erfundene Zitate gibt es nicht. */}
      <section className="mk-aussage mk-auf">
        <BLogo size={54} title="" />
        <p>Von jeder Gebühr gehen {Math.round(BEE_IMPACT_RATE * 100)} % an den Bienenschutz. Du wählst deine Gebühr selbst, üblich sind {DEFAULT_FEE_PERCENT} %.</p>
        <Link href="/impact" className="mk-knopf"><Roll>So funktioniert der Bee-Impact</Roll></Link>
      </section>

      {endend.length > 0 && (
        <section className="mk-abschnitt">
          <div className="mk-abschnitt-kopf mk-auf">
            <h2 className="mk-h2">Endet bald</h2>
            <p>Diese Auktionen laufen als Nächste aus. Wer zuletzt bietet, gewinnt.</p>
          </div>
          <div className="mk-karten">{endend.map((l) => <Karte key={l.id} l={l} mitRest />)}</div>
        </section>
      )}

      <section className="mk-abschnitt">
        <div className="mk-abschnitt-kopf mk-auf">
          <h2 className="mk-h2">Fünf Formate, ein Marktplatz</h2>
          <p>Verkaufen, versteigern, vermieten, verschenken oder Hilfe buchen. Du wählst, was zu deinem Angebot passt.</p>
        </div>
        <div className="mk-formate">
          {FORMATE.map((f) => (
            <Link key={f.type} href={`/search?type=${f.type}`} className={`mk-format mk-${PASTELL[f.type]} mk-auf`}>
              <span className="mk-format-name">{f.label}</span>
              <span className="mk-format-sub">{f.sub}</span>
              <span className="mk-pfeil mk-weiss" aria-hidden="true"><ArrowRight size={20} strokeWidth={1.8} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mk-abschnitt mk-prozess">
        <div className="mk-prozess-links mk-auf">
          <h2 className="mk-h2">Drei Schritte, kein Kleingedrucktes.</h2>
          <p>Inserieren kostet nichts. Eine Gebühr fällt erst an, wenn du verkauft hast, und du legst sie selbst fest.</p>
          <Link href="/how-it-works" className="mk-knopf"><Roll>Mehr erfahren</Roll></Link>
        </div>
        <ol className="mk-schritte">
          {SCHRITTE.map((s) => (
            <li key={s.nr} className="mk-schritt mk-auf">
              <span className="mk-schritt-nr">({s.nr})</span>
              <span className="mk-schritt-titel">{s.titel}</span>
              <span className="mk-schritt-text">{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mk-fuss">
        <div className="mk-fuss-tafel">
          <div className="mk-fuss-kopf">
            <BLogo size={72} title="BEEDARO" />
            <p className="mk-fuss-satz">Kaufen. Verkaufen. Gutes tun.</p>
            <Link href="/listings/new" className="mk-knopf"><Roll>Jetzt inserieren</Roll></Link>
          </div>
          <nav className="mk-fuss-nav" aria-label="Fusszeile">
            {FUSS.map((g) => (
              <div key={g.titel}>
                <span className="mk-tags">{g.titel}</span>
                {g.links.map((x) => <Link key={x.href} href={x.href}><Roll>{x.label}</Roll></Link>)}
              </div>
            ))}
          </nav>
          <p className="mk-fuss-schluss">© {new Date().getFullYear()} BEEDARO, Schweiz. Vorschau neben der echten Startseite.</p>
        </div>
      </footer>
    </div>
  );
}
