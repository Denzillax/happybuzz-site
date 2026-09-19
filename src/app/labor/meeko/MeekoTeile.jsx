"use client";
// Gemeinsame Bausteine der Meeko-Seiten (/labor/meeko und /labor/meeko/inserat): Schrift, durchrollender Text,
// Header-Pille mit Menü, Fuss, Favoriten-Herz, Restzeit, Inseratkarte, Einblenden beim Scrollen.
// Farbregel: Butter ist die Hauptfarbe (Hero), jedes Format hat seine eigene Pastellfarbe (PASTELL).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Plus, Search, User, X } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getCoverUrl, getDisplayPrice } from "@/lib/formatters";
import BLogo from "@/components/shared/BLogo";

const SCHRIFT = "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap";
export const FORMAT = { sell: "Festpreis", auction: "Auktion", rent: "Miete", free: "Gratis", service: "Service" };
// Butter gehört dem Hero, darum trägt Festpreis Rosé
export const PASTELL = { sell: "rose", auction: "lavendel", rent: "himmel", free: "mint", service: "rosa" };
export const LISTE = "id, title, listing_type, price, start_price, rent_price, rent_period, city, created_at, auction_end, listing_images(url, sort_order)";
const NAV = [["Stöbern", "/labor/meeko/suche"], ["So funktioniert es", "/how-it-works"], ["Bienenschutz", "/impact"]];
const FUSS = [
  { titel: "Marktplatz", links: [{ label: "Stöbern", href: "/search" }, { label: "Inserieren", href: "/listings/new" }, { label: "So funktioniert es", href: "/how-it-works" }] },
  { titel: "BEEDARO", links: [{ label: "Über uns", href: "/about" }, { label: "Bee-Impact", href: "/impact" }, { label: "Hilfe und FAQ", href: "/help" }, { label: "Kontakt", href: "/contact" }] },
  { titel: "Rechtliches", links: [{ label: "Impressum", href: "/imprint" }, { label: "Datenschutz", href: "/privacy" }, { label: "AGB", href: "/terms" }] },
];

export function preis(l) {
  if (l.listing_type === "free") return "Gratis";
  const p = getDisplayPrice(l);
  return `${p.prefix}${p.text}${p.suffix}`;
}

// Schrift laden, solange eine Meeko-Seite offen ist
export function useMeekoSchrift() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = SCHRIFT; document.head.appendChild(link);
    return () => link.remove();
  }, []);
}

// Einblenden beim Hereinscrollen, einmal. abhaengig: Werte, nach deren Änderung neue Elemente dazukommen.
export function useEinblenden(wurzel, abhaengig) {
  useEffect(() => {
    const el = wurzel.current;
    if (!el) return;
    const teile = [...el.querySelectorAll(".mk-auf:not(.mk-da)")];
    const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (ruhig || typeof IntersectionObserver === "undefined") { teile.forEach((t) => t.classList.add("mk-da")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("mk-da"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
    teile.forEach((t, i) => { t.style.transitionDelay = `${(i % 3) * 70}ms`; io.observe(t); });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, abhaengig);
}

// Text, der beim Hovern durchrollt (zwei gleiche Zeilen übereinander, die obere fährt hinaus, die untere herein)
export function Roll({ children }) {
  return <span className="mk-roll"><span>{children}</span><span aria-hidden="true">{children}</span></span>;
}

export function Herz({ gross }) {
  const [an, setAn] = useState(false);
  return (
    <button type="button" className={`mk-herz eckig kein-akzent${gross ? " mk-herz-frei" : ""}${an ? " mk-herz-an" : ""}`} aria-pressed={an}
      aria-label={an ? "Aus den Favoriten entfernen" : "Zu den Favoriten"} onClick={() => setAn((v) => !v)}>
      <BLogo herz size={17} title="" />
    </button>
  );
}

export function Restzeit({ ende }) {
  const [jetzt, setJetzt] = useState(null);
  useEffect(() => { setJetzt(Date.now()); const t = setInterval(() => setJetzt(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (jetzt === null) return null;
  const sek = Math.max(0, Math.floor((new Date(ende).getTime() - jetzt) / 1000)), tage = Math.floor(sek / 86400);
  const text = tage > 0 ? `${tage} T ${Math.floor((sek % 86400) / 3600)} Std` : `${String(Math.floor(sek / 3600)).padStart(2, "0")}:${String(Math.floor((sek % 3600) / 60)).padStart(2, "0")}:${String(sek % 60).padStart(2, "0")}`;
  return <span className="mk-rest">Noch {text}</span>;
}

// Inseratkarte: Link mit Bild auf der Pastelltafel des Formats, daneben das Herz als eigener Knopf
export function Karte({ l, mitRest, ziel }) {
  return (
    <article className="mk-karte mk-auf">
      <Link href={ziel || `/listing/${l.id}`} className="mk-karte-link" aria-label={`${l.title}, ${FORMAT[l.listing_type]}, ${preis(l)}`}>
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

// Kopf (Denis 20.09.2026: "sieht noch leer aus"): Logo, Navigation mit der echten Zahl aktiver Inserate bei Stöbern,
// in der Mitte ein Suchfeld, rechts Favoriten, Konto und Inserieren. Auf Seiten mit grossem Suchfeld (Frontseite, Suche)
// erscheint das Feld im Kopf erst, wenn das grosse aus dem Bild gescrollt ist. Sonst stünden zwei Suchfelder übereinander.
export function Kopf() {
  const [menue, setMenue] = useState(false);
  const [zahl, setZahl] = useState(null);
  const [sucheDa, setSucheDa] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  useEffect(() => {
    const jetzt = new Date().toISOString();
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active").or(`expires_at.is.null,expires_at.gt.${jetzt}`)
      .then(({ count }) => { if (typeof count === "number") setZahl(count); });
    const gross = document.querySelector(".mk-hero .mk-suche, .mk-s-kopf .mk-suche");
    if (!gross) { setSucheDa(true); return; }
    // Scroll statt IntersectionObserver: der Beobachter meldet in verdeckten Fenstern nichts
    const pruefen = () => setSucheDa(gross.getBoundingClientRect().bottom < 90);
    pruefen();
    window.addEventListener("scroll", pruefen, { passive: true });
    return () => window.removeEventListener("scroll", pruefen);
  }, []);

  const suchen = (e) => { e.preventDefault(); const s = q.trim(); setMenue(false); router.push(s ? `/labor/meeko/suche?q=${encodeURIComponent(s)}` : "/labor/meeko/suche"); };

  return (
    <header className="mk-kopf">
      <div className="mk-kopf-pille">
        <Link href="/labor/meeko" className="mk-logo" aria-label="BEEDARO">
          <BLogo size={30} title="" />
          <span>beedaro</span>
        </Link>
        <nav className="mk-nav" aria-label="Hauptnavigation">
          {NAV.map(([t, h]) => (
            <Link key={h} href={h}><Roll>{t}</Roll>{h === "/labor/meeko/suche" && zahl !== null && <sup className="mk-nav-zahl" aria-label={`${zahl} Inserate`}>{zahl}</sup>}</Link>
          ))}
        </nav>
        <form className={`mk-kopf-suche${sucheDa ? " mk-kopf-suche-da" : ""}`} onSubmit={suchen} role="search" aria-hidden={!sucheDa}>
          <Search size={17} strokeWidth={2.2} aria-hidden="true" />
          <input className="pille-input" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Inserate durchsuchen" aria-label="Inserate durchsuchen" tabIndex={sucheDa ? 0 : -1} />
        </form>
        <div className="mk-kopf-rechts">
          <Link href="/favorites" className="mk-knopf mk-kopf-icon" aria-label="Favoriten" title="Favoriten"><BLogo size={17} herz title="" /></Link>
          <Link href="/settings" className="mk-knopf mk-kopf-icon" aria-label="Konto" title="Konto"><User size={19} strokeWidth={2} aria-hidden="true" /></Link>
          <Link href="/labor/meeko/inserieren" className="mk-knopf mk-knopf-dunkel" aria-label="Inserieren"><Plus size={16} strokeWidth={2.4} aria-hidden="true" /><Roll>Inserieren</Roll></Link>
          <button type="button" className="mk-knopf mk-menue-knopf eckig kein-akzent" aria-label={menue ? "Menü schliessen" : "Menü öffnen"} aria-expanded={menue} aria-controls="mk-menue" onClick={() => setMenue((v) => !v)}>
            {menue ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>
      </div>
      {menue && (
        <nav id="mk-menue" className="mk-menue" aria-label="Menü">
          <form className="mk-menue-suche" onSubmit={suchen} role="search">
            <Search size={18} strokeWidth={2.2} aria-hidden="true" />
            <input className="pille-input" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Inserate durchsuchen" aria-label="Inserate durchsuchen" />
          </form>
          {[[zahl !== null ? `Stöbern (${zahl})` : "Stöbern", "/labor/meeko/suche"], ["Inserieren", "/labor/meeko/inserieren"], ["Favoriten", "/favorites"], ["Konto", "/settings"], ["So funktioniert es", "/how-it-works"], ["Bienenschutz", "/impact"]].map(([t, h]) => (
            <Link key={h} href={h} onClick={() => setMenue(false)}>{t}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function Fuss({ hinweis }) {
  return (
    <footer className="mk-fuss">
      <div className="mk-fuss-tafel">
        <div className="mk-fuss-kopf">
          <BLogo size={72} title="BEEDARO" />
          <p className="mk-fuss-satz">Kaufen. Verkaufen. Gutes tun.</p>
          <Link href="/listings/new" className="mk-knopf mk-knopf-dunkel"><Roll>Jetzt inserieren</Roll></Link>
        </div>
        <nav className="mk-fuss-nav" aria-label="Fusszeile">
          {FUSS.map((g) => (
            <div key={g.titel}>
              <span className="mk-tags">{g.titel}</span>
              {g.links.map((x) => <Link key={x.href} href={x.href}><Roll>{x.label}</Roll></Link>)}
            </div>
          ))}
        </nav>
        <p className="mk-fuss-schluss">© {new Date().getFullYear()} BEEDARO, Schweiz. {hinweis || "Vorschau neben der echten Startseite."}</p>
      </div>
    </footer>
  );
}
