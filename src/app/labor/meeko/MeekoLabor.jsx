"use client";
// Frontseite im Stil der Framer-Vorlage "Meeko" (Denis 19.09.2026), mit deren Farben und dem kacheligen BEEDARO-B.
// Eigene Route neben der echten Startseite und neben /labor/wild, beide bleiben unberührt.
// Übernommen ist die Formensprache, nicht der Code: Pastellflächen (Lavendel, Himmel, Rosa, Mint, Rosé, Butter) auf
// Weiss, fast schwarze Schrift #1D1D1D, schwebender weisser Pillen-Header mit feinem Rand, stark gerundete weisse
// Karten mit 1-px-Rand, runde Pfeil-Pillen in Pastell, Knöpfe mit 10 px Rundung und eingedrücktem unterem Schatten,
// grosse zentrierte Titel mit enger Laufweite, Text der beim Hovern durchrollt, ruhiges Einblenden.
// Die Vorlage ist ein Portfolio. Hier trägt dieselbe Form einen Marktplatz: Wo dort Projekte stehen, stehen echte
// Inserate, die drei Einstiegskarten sind Kaufen, Verkaufen und Gutes tun, der Prozess ist "So funktioniert es".
// Der Hero ist Butter (Denis 19.09.): So bleibt das Bienengelb die Hauptfarbe, Lavendel gehört der Auktion.
// Alle Daten sind echt. Es gibt keine erfundenen Kundenstimmen: An der Stelle des Zitats steht eine Tatsache.
// Gemeinsame Bausteine: MeekoTeile.jsx. Styles: globals.css unter MEEKO-LABOR (mk-*).
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera, Flower2, Search, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getCoverUrl } from "@/lib/formatters";
import { DEFAULT_FEE_PERCENT, BEE_IMPACT_RATE } from "@/lib/constants";
import BLogo from "@/components/shared/BLogo";
import { FORMAT, Fuss, Karte, Kopf, LISTE, PASTELL, Roll, preis, useEinblenden, useMeekoSchrift } from "./MeekoTeile";

const FORMATE = [
  { type: "sell", label: "Festpreis", sub: "Kaufen wie gewohnt, zum festen Preis." },
  { type: "auction", label: "Auktion", sub: "Bieten, mitfiebern, gewinnen." },
  { type: "rent", label: "Mieten", sub: "Nutzen statt besitzen, tageweise." },
  { type: "free", label: "Gratis", sub: "Verschenken und abholen." },
  { type: "service", label: "Service", sub: "Handwerk und Hilfe buchen." },
];
const EINSTIEG = [
  { titel: "Kaufen", text: "Stöbere durch Inserate aus der ganzen Schweiz, vom Velo bis zur Spielkonsole.", href: "/labor/meeko/suche", icon: ShoppingBag, farbe: "mint" },
  { titel: "Verkaufen", text: "Fotos hochladen, Format wählen, fertig. Die KI schreibt den Text auf Wunsch mit.", href: "/listings/new", icon: Camera, farbe: "butter" },
  { titel: "Gutes tun", text: "Von jeder Gebühr gehen 20 % an den Bienenschutz. Das steht auf jeder Rechnung.", href: "/impact", icon: Flower2, farbe: "lavendel" },
];
const SCHRITTE = [
  { nr: "01", titel: "Inserieren", text: "Fotos hochladen, Format wählen, Bee-Rate festlegen. Du entscheidest selbst zwischen 3, 5, 7 und 10 %." },
  { nr: "02", titel: "Handeln", text: "Verkaufen, versteigern, vermieten oder verschenken. Bezahlt wird direkt zwischen euch, per TWINT, Bank oder bar." },
  { nr: "03", titel: "Gutes tun", text: "Ein Fünftel der Gebühr geht an den Bienenschutz. Der Betrag ist auf der Rechnung ausgewiesen." },
];

export default function MeekoLabor() {
  const router = useRouter();
  const [inserate, setInserate] = useState([]);
  const [endend, setEndend] = useState([]);
  const [q, setQ] = useState("");
  const wurzel = useRef(null);
  useMeekoSchrift();
  useEinblenden(wurzel, [inserate, endend]);

  useEffect(() => {
    const jetzt = new Date().toISOString();
    const aktiv = () => supabase.from("listings").select(LISTE).eq("status", "active").or(`expires_at.is.null,expires_at.gt.${jetzt}`);
    aktiv().order("created_at", { ascending: false }).limit(24).then(({ data }) => setInserate((data || []).filter((l) => getCoverUrl(l))));
    aktiv().eq("listing_type", "auction").gt("auction_end", jetzt).order("auction_end", { ascending: true }).limit(8)
      .then(({ data }) => setEndend((data || []).filter((l) => getCoverUrl(l)).slice(0, 3)));
  }, []);

  // Die schwebenden Inserate weichen dem Mauszeiger leicht aus: Der Hero bekommt die Zeigerposition als --mx/--my (-1 bis 1),
  // jede Kachel verschiebt sich um ihre eigene Tiefe (--p in globals.css). Nur mit Maus, nicht bei reduzierter Bewegung.
  const hero = useRef(null);
  useEffect(() => {
    const el = hero.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let bild = 0;
    const setzen = (x, y) => { el.style.setProperty("--mx", x.toFixed(3)); el.style.setProperty("--my", y.toFixed(3)); };
    const bewegt = (e) => {
      cancelAnimationFrame(bild);
      bild = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setzen(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
      });
    };
    const weg = () => { cancelAnimationFrame(bild); setzen(0, 0); };
    el.addEventListener("pointermove", bewegt);
    el.addEventListener("pointerleave", weg);
    return () => { cancelAnimationFrame(bild); el.removeEventListener("pointermove", bewegt); el.removeEventListener("pointerleave", weg); };
  }, []);

  const suchen = (e) => { e.preventDefault(); const t = q.trim(); router.push(t ? `/labor/meeko/suche?q=${encodeURIComponent(t)}` : "/labor/meeko/suche"); };
  const neu = inserate.slice(0, 6);
  // Schwebende Inserate im Hero: andere als unter Neu eingestellt, solange es genug gibt
  // Bei jedem Laden eine neue zufällige Auswahl (Denis 20.09.2026). Gemischt wird erst im Browser, wenn die Daten da sind,
  // darum gibt es keinen Unterschied zwischen Server und Browser.
  const schweb = useMemo(() => {
    const topf = inserate.length >= 12 ? inserate.slice(6) : [...inserate];
    for (let i = topf.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [topf[i], topf[j]] = [topf[j], topf[i]]; }
    return topf.slice(0, 6);
  }, [inserate]);

  return (
    <div className="mk" ref={wurzel}>
      <Kopf />

      <section className="mk-hero mk-butter" ref={hero}>
        {/* Echte Inserate schweben links und rechts vom Hauptsatz, jedes auf der Tafel seiner Formatfarbe */}
        <div className="mk-schweb-feld">
          {schweb.map((l, i) => (
            <Link key={l.id} href={`/listing/${l.id}`} className={`mk-schweb mk-schweb-${i + 1}`} aria-label={`${l.title}, ${FORMAT[l.listing_type]}, ${preis(l)}`}>
              <span className={`mk-schweb-tafel mk-${PASTELL[l.listing_type] || "lavendel"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getCoverUrl(l)} alt="" />
              </span>
              <span className="mk-schweb-preis">{preis(l)}</span>
            </Link>
          ))}
        </div>
        <h1 className="mk-h1">
          {/* fester Umbruch: einzeilig wäre der Satz so breit, dass er unter die schwebenden Inserate liefe */}
          Was du suchst,<br />hat schon jemand.
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
          <Link href="/labor/meeko/suche" className="mk-knopf"><Roll>Alle Inserate ansehen</Roll></Link>
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
          {/* führt in der Vorschau auf die Inseratseite im selben Stil */}
          <div className="mk-karten">{endend.map((l) => <Karte key={l.id} l={l} mitRest ziel={`/labor/meeko/inserat?id=${l.id}`} />)}</div>
        </section>
      )}

      <section className="mk-abschnitt">
        <div className="mk-abschnitt-kopf mk-auf">
          <h2 className="mk-h2">Fünf Formate, ein Marktplatz</h2>
          <p>Verkaufen, versteigern, vermieten, verschenken oder Hilfe buchen. Du wählst, was zu deinem Angebot passt.</p>
        </div>
        <div className="mk-formate">
          {FORMATE.map((f) => (
            <Link key={f.type} href={`/labor/meeko/suche?type=${f.type}`} className={`mk-format mk-${PASTELL[f.type]} mk-auf`}>
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

      <Fuss />
    </div>
  );
}
