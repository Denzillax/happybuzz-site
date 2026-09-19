"use client";
// Bänder-Hero (Prototyp, Denis 19.09.2026). Idee aus dem Konzept "beedaro-squareo":
// ein Rahmen aus echten Inseratfotos, in der Mitte Hauptsatz und die zwei Hauptknöpfe.
// Bewusst anders als das Konzept:
//  - Die Seite scrollt normal. Das Mausrad wird NICHT umgeleitet: es gibt den Bändern nur
//    Schwung, während die Seite weiterscrollt. Über einer Kachel laufen sie langsam.
//  - In der Mitte steht echter Text statt eines Canvas-Schriftzugs (lesbar für Suchmaschinen
//    und Screenreader). Die Suche sitzt im Header direkt darüber, ein zweites Feld im Hero
//    doppelte sich damit (siehe mitSuche).
//  - Ecken, Farben und Schreibweise folgen dem heutigen System (12 px, neutral, keine
//    Grossbuchstaben). Am Handy laufen nur das obere und das untere Band.
//  - Mit "Bewegung reduzieren" stehen die Bänder still.
// Die Styles stehen in globals.css unter BAENDER-HERO (keine Sonderzeichen-Falle im
// Inline-style-Block).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getCoverUrl, getDisplayPrice } from "@/lib/formatters";
import PunktSchriftzug from "@/components/home/PunktSchriftzug";

const FORMAT = { sell: "Festpreis", auction: "Auktion", rent: "Miete", free: "Gratis", service: "Service" };

function preisText(l) {
  const p = getDisplayPrice(l);
  if (l.listing_type === "free") return "Gratis";
  return `${p.prefix}${p.text}${p.suffix}`;
}

function Kachel({ l, kopie }) {
  const bild = getCoverUrl(l);
  return (
    <Link href={`/listing/${l.id}`} className="bh-k" tabIndex={kopie ? -1 : undefined} aria-label={`${l.title}, ${FORMAT[l.listing_type] || ""}, ${preisText(l)}`}>
      {bild ? <img src={bild} alt="" loading="lazy" draggable={false} /> : <span className="bh-leer" />}
      <span className="bh-deck">
        <span>{FORMAT[l.listing_type] || "Inserat"}</span>
        <span className="bh-preis">{preisText(l)}</span>
      </span>
    </Link>
  );
}

function TextKachel({ art, children }) {
  return <span className={`bh-k bh-text bh-${art}`}>{children}</span>;
}

function Band({ richtung, achse, inhalt }) {
  // Inhalt doppelt, damit die Schleife nahtlos schliesst (Animation läuft bis -50 %).
  // Die Kopie ist für Screenreader versteckt und nicht per Tab erreichbar, sonst wäre
  // jedes Inserat zweimal da.
  return (
    <div className={`bh-band bh-${achse}`}>
      <div className={`bh-lauf bh-${achse}-${richtung}`}>
        {inhalt(false)}
        <div aria-hidden="true" style={{ display: "contents" }}>{inhalt(true)}</div>
      </div>
    </div>
  );
}

// mitSuche: eigenes Suchfeld im Hero. Standard aus, weil der Header direkt darüber schon eines
// hat und sich die zwei Felder sonst doppeln. Für Seiten ohne Header-Suche einschaltbar.
export default function BandHero({ mitSuche = false }) {
  const router = useRouter();
  const [inserate, setInserate] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase
      .from("listings")
      .select("id, title, listing_type, price, start_price, rent_price, rent_period, listing_images(url, sort_order)")
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })
      .limit(32)
      .then(({ data }) => setInserate((data || []).filter((l) => getCoverUrl(l))));
  }, []);

  // Antrieb der Bänder (19.09.2026): Grundtempo plus Schwung. Scrollt man mit dem Mausrad über
  // dem Hero, laufen die Bänder schneller und klingen wieder aus (rückwärts scrollen dreht die
  // Richtung). Der Listener ist passiv: die Seite scrollt dabei ganz normal weiter, das Rad
  // wird nicht umgeleitet. Über einer Kachel läuft das Band langsam, damit man sie trifft.
  // Ausserhalb des Bildes ruht die Schleife. Ohne JavaScript oder vor dem Start übernimmt die
  // CSS-Animation, die Klasse bh-js schaltet sie ab.
  const heroRef = useRef(null);
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || !inserate.length) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const baender = [...hero.querySelectorAll(".bh-lauf")].map((el) => {
      const senk = el.parentElement.classList.contains("bh-senk");
      const rueck = el.classList.contains("bh-waag-rechts") || el.classList.contains("bh-senk-runter");
      return { el, senk, richtung: rueck ? -1 : 1, pos: 0 };
    });
    hero.classList.add("bh-js");
    let schwung = 0, ueber = false, sichtbar = true, raf = 0;
    const GRUND = 0.35, DAEMPFUNG = 0.94;
    const takt = () => {
      if (sichtbar) {
        const tempo = (ueber && Math.abs(schwung) < 0.05 ? GRUND * 0.25 : GRUND) + schwung;
        for (const b of baender) {
          const laenge = (b.senk ? b.el.scrollHeight : b.el.scrollWidth) / 2;
          if (laenge < 1) continue;
          b.pos -= tempo * b.richtung * (b.senk ? 0.8 : 1);
          if (b.pos <= -laenge) b.pos += laenge;
          if (b.pos > 0) b.pos -= laenge;
          b.el.style.transform = b.senk ? `translateY(${b.pos.toFixed(2)}px)` : `translateX(${b.pos.toFixed(2)}px)`;
        }
        schwung *= DAEMPFUNG;
        if (Math.abs(schwung) < 0.002) schwung = 0;
      }
      raf = requestAnimationFrame(takt);
    };
    const rad = (e) => { schwung = Math.max(-10, Math.min(10, schwung + e.deltaY * 0.014)); };
    const rein = (e) => { if (e.target.closest && e.target.closest(".bh-band")) ueber = true; };
    const raus = (e) => { if (e.target.closest && e.target.closest(".bh-band")) ueber = false; };
    hero.addEventListener("wheel", rad, { passive: true });
    hero.addEventListener("mouseover", rein);
    hero.addEventListener("mouseout", raus);
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((es) => { sichtbar = es[0].isIntersecting; }) : null;
    io?.observe(hero);
    raf = requestAnimationFrame(takt);
    return () => {
      cancelAnimationFrame(raf); io?.disconnect();
      hero.removeEventListener("wheel", rad); hero.removeEventListener("mouseover", rein); hero.removeEventListener("mouseout", raus);
      hero.classList.remove("bh-js");
      baender.forEach((b) => { b.el.style.transform = ""; });
    };
  }, [inserate]);

  // Auf vier Bänder verteilen. Zu wenige Inserate: Bänder werden aus dem Bestand aufgefüllt.
  const pool = inserate.length ? inserate : [];
  const nimm = (start, n) => Array.from({ length: Math.min(n, pool.length ? n : 0) }, (_, i) => pool[(start + i) % pool.length]);
  const oben = nimm(0, 9), unten = nimm(9, 9), links = nimm(18, 4), rechts = nimm(22, 4);

  const suchen = (e) => {
    e.preventDefault();
    const t = q.trim();
    router.push(t ? `/search?q=${encodeURIComponent(t)}` : "/search");
  };

  const kacheln = (liste, prefix, einschub) => (kopie) => {
    const out = liste.map((l, i) => <Kachel key={`${prefix}-${l.id}-${i}`} l={l} kopie={kopie} />);
    if (einschub && out.length > 3) out.splice(einschub.pos, 0, einschub.el);
    return out;
  };

  return (
    <section ref={heroRef} className="bh" aria-label="Schaufenster">
      <Band achse="waag" richtung="links" inhalt={kacheln(oben, "o", { pos: 4, el: <TextKachel key="o-text" art="honig">Kaufen.<br />Verkaufen.<br />Gutes tun.</TextKachel> })} />
      <div className="bh-mitte">
        <Band achse="senk" richtung="runter" inhalt={kacheln(links, "l")} />
        <div className="bh-feld">
          {/* Marke des Schaufensters: Punkt-Schriftzug, durch den eine Biene fliegt. Der Hauptsatz
              darunter bleibt echter Text (die Zeichenfläche ist für Suchmaschinen unsichtbar). */}
          <div className="bh-wort-rahmen"><PunktSchriftzug /></div>
          <h1 className="bh-satz">Was du suchst, hat schon jemand.</h1>
          <p className="bh-unter">Kaufen, bieten, mieten, buchen oder verschenken. Ein Marktplatz, fünf Formate.</p>
          {mitSuche && (
          <form className="bh-suche" onSubmit={suchen} role="search">
            <Search size={18} className="bh-lupe" aria-hidden="true" />
            <input className="pille-input" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Was suchst du?" aria-label="Suchbegriff" />
            <button type="submit" className="eckig bh-los">Suchen</button>
          </form>
          )}
          <div className="bh-knoepfe">
            <Link href="/listings/new" className="cta-pill bh-cta bh-cta-honig"><Plus size={16} strokeWidth={2.4} /> Inserieren</Link>
            <Link href="/search" className="cta-pill bh-cta bh-cta-hell">Stöbern <ArrowRight size={15} strokeWidth={2.4} /></Link>
          </div>
        </div>
        <Band achse="senk" richtung="hoch" inhalt={kacheln(rechts, "r")} />
      </div>
      <Band achse="waag" richtung="rechts" inhalt={kacheln(unten, "u", { pos: 3, el: <TextKachel key="u-text" art="teal">20 %<br />für<br />Bienen</TextKachel> })} />
    </section>
  );
}
