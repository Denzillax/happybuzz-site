"use client";
// Gemeinsamer Kopf der Stilseiten (/labor/stil und /labor/stil/inserat): Variantenschalter,
// Header mit Bienen-Logo, Schrift Funnel Sans. useStil() hält die Variante und lädt die Schrift.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import BeeLogo from "@/components/shared/BeeLogo";

const SCHRIFT = "https://fonts.googleapis.com/css2?family=Funnel+Sans:wght@400;500;600;700;800&display=swap";

export function useStil() {
  // "weiss" = weisser Grund mit gelben Akzenten, "gelb" = vollflächig gelb. Steht auch in der Adresse (?grund=).
  const [grund, setGrund] = useState("weiss");
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = SCHRIFT; document.head.appendChild(link);
    try { const g = new URLSearchParams(window.location.search).get("grund"); if (g === "gelb" || g === "weiss") setGrund(g); } catch {}
    return () => link.remove();
  }, []);
  const waehle = (g) => { setGrund(g); try { window.history.replaceState(null, "", `${window.location.pathname}?grund=${g}`); } catch {} };
  return { grund, waehle };
}

export default function StilKopf({ grund, waehle }) {
  return (
    <>
      <div className="sl-schalter">
        <span>Variante</span>
        <button type="button" className="kein-akzent" aria-pressed={grund === "weiss"} onClick={() => waehle("weiss")}>Weiss mit Gelb</button>
        <button type="button" className="kein-akzent" aria-pressed={grund === "gelb"} onClick={() => waehle("gelb")}>Ganz gelb</button>
        <span className="sl-schalter-seiten">
          <Link href={`/labor/stil?grund=${grund}`}>Startseite</Link>
          <Link href={`/labor/stil/inserat?grund=${grund}`}>Inserat mit Geboten</Link>
        </span>
      </div>
      <header className="sl-kopf">
        <Link href={`/labor/stil?grund=${grund}`} className="sl-logo" aria-label="BEEDARO">
          <span className="sl-logo-marke"><BeeLogo size={46} /></span>
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
    </>
  );
}
