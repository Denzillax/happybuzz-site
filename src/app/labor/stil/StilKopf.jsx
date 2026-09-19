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
  // Gelbton: "zitrone" = #FFF55B aus der Vorlage, "honig" = das bisherige BEEDARO-Gelb #F4C03F (?gelb=)
  const [gelb, setGelb] = useState("zitrone");
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = SCHRIFT; document.head.appendChild(link);
    try {
      const q = new URLSearchParams(window.location.search);
      const g = q.get("grund"); if (g === "gelb" || g === "weiss") setGrund(g);
      const y = q.get("gelb"); if (y === "honig" || y === "zitrone") setGelb(y);
    } catch {}
    return () => link.remove();
  }, []);
  const adresse = (g, y) => { try { window.history.replaceState(null, "", `${window.location.pathname}?grund=${g}&gelb=${y}`); } catch {} };
  const waehle = (g) => { setGrund(g); adresse(g, gelb); };
  const waehleGelb = (y) => { setGelb(y); adresse(grund, y); };
  return { grund, waehle, gelb, waehleGelb };
}

export default function StilKopf({ grund, waehle, gelb, waehleGelb }) {
  const q = `?grund=${grund}&gelb=${gelb}`;
  return (
    <>
      <div className="sl-schalter">
        <span>Variante</span>
        <button type="button" className="kein-akzent" aria-pressed={grund === "weiss"} onClick={() => waehle("weiss")}>Weiss mit Gelb</button>
        <button type="button" className="kein-akzent" aria-pressed={grund === "gelb"} onClick={() => waehle("gelb")}>Ganz gelb</button>
        <span className="sl-schalter-trenner" aria-hidden="true" />
        <span>Gelb</span>
        <button type="button" className="kein-akzent" aria-pressed={gelb === "zitrone"} onClick={() => waehleGelb("zitrone")}>Zitrone (Vorlage)</button>
        <button type="button" className="kein-akzent" aria-pressed={gelb === "honig"} onClick={() => waehleGelb("honig")}>Honig (deins)</button>
        <span className="sl-schalter-seiten">
          <Link href={`/labor/stil${q}`}>Startseite</Link>
          <Link href={`/labor/stil/inserat${q}`}>Inserat mit Geboten</Link>
        </span>
      </div>
      <header className="sl-kopf">
        <Link href={`/labor/stil${q}`} className="sl-logo" aria-label="BEEDARO">
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
