"use client";
// Stilseite: Inserat mit Auktion und Gebotsverlauf in der Ecomiz-Richtung (Denis 19.09.2026).
// Zeigt ein ECHTES aktives Auktionsinserat mit seinen echten Geboten. Hat es weniger als fünf
// Gebote, wird der Verlauf NUR IN DER ANZEIGE mit gekennzeichneten Beispielgeboten aufgefüllt,
// damit man die Gestaltung beurteilen kann. Nichts davon wird gespeichert, geboten wird hier
// nicht: Die Knöpfe führen zum echten Inserat. Styles: globals.css unter STIL-LABOR (sl-i-*).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Gavel, Clock, MapPin, Truck, ShieldCheck, Heart, Share2, ArrowUpRight, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getListingPublic, getBids } from "@/lib/listings";
import { chf } from "@/lib/formatters";
import BeeLogo from "@/components/shared/BeeLogo";
import StilKopf, { useStil } from "../StilKopf";

const ZUSTAND = { new: "Neu", like_new: "Wie neu", good: "Gut", fair: "Gebrauchsspuren", poor: "Defekt oder Bastler" };
const BEISPIEL_NAMEN = ["Lena M.", "Reto K.", "Sara B.", "Jonas W.", "Mira T."];

// chf() liefert nur die Zahl mit Rappen (1'000.00). Hier ganze Franken mit Währung davor.
const fr = (n) => `CHF ${chf(n).replace(/\.00$/, "")}`;

function initialen(name) {
  return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((t) => t[0].toUpperCase()).join("");
}
function wann(iso) {
  const d = new Date(iso), jetzt = new Date();
  const zeit = d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
  const tage = Math.floor((new Date(jetzt.toDateString()) - new Date(d.toDateString())) / 86400000);
  if (tage === 0) return `heute, ${zeit}`;
  if (tage === 1) return `gestern, ${zeit}`;
  return `${d.toLocaleDateString("de-CH", { day: "numeric", month: "short" })}, ${zeit}`;
}

function Countdown({ ende }) {
  const [ms, setMs] = useState(null);
  useEffect(() => {
    const takt = () => setMs(Math.max(0, new Date(ende).getTime() - Date.now()));
    takt();
    const t = setInterval(takt, 1000);
    return () => clearInterval(t);
  }, [ende]);
  if (ms === null) return <div className="sl-i-uhr" aria-hidden="true" />;
  const s = Math.floor(ms / 1000);
  const teile = [["Tage", Math.floor(s / 86400)], ["Std", Math.floor((s % 86400) / 3600)], ["Min", Math.floor((s % 3600) / 60)], ["Sek", s % 60]];
  return (
    <div className="sl-i-uhr" role="timer" aria-label="Restzeit der Auktion">
      {teile.map(([name, wert]) => (
        <span key={name} className="sl-i-uhr-zelle">
          <span className="sl-i-uhr-zahl">{String(wert).padStart(2, "0")}</span>
          <span className="sl-i-uhr-name">{name}</span>
        </span>
      ))}
    </div>
  );
}

export default function StilInserat() {
  const stil = useStil();
  const { grund, gelb } = stil;
  const [l, setL] = useState(null);
  const [gebote, setGebote] = useState([]);
  const [bild, setBild] = useState(0);
  const [leer, setLeer] = useState(false);

  useEffect(() => {
    (async () => {
      // Aktive Auktion mit dem höchsten Gebot, bei Gleichstand die mit mehr Bildern
      const { data } = await supabase
        .from("listings")
        .select("id, auction_end, listing_images(url)")
        .eq("listing_type", "auction").eq("status", "active")
        .gt("auction_end", new Date().toISOString())
        .order("created_at", { ascending: false }).limit(12);
      const kandidaten = (data || []).filter((x) => (x.listing_images || []).length > 0);
      if (!kandidaten.length) { setLeer(true); return; }
      const mitGeboten = await Promise.all(kandidaten.map(async (k) => ({ k, b: await getBids(k.id) })));
      const spitze = (x) => Math.max(0, ...x.b.map((g) => Number(g.amount) || 0));
      mitGeboten.sort((a, b) => spitze(b) - spitze(a) || b.k.listing_images.length - a.k.listing_images.length);
      const wahl = mitGeboten[0];
      try { setL(await getListingPublic(wahl.k.id)); setGebote(wahl.b); } catch { setLeer(true); }
    })();
  }, []);

  // Verlauf für die Anzeige: echte Gebote, darüber Beispielgebote bis insgesamt fünf Zeilen.
  // Die Beispiele steigen vom höchsten echten Gebot aus an (in der Beta sind echte Gebote meist
  // nur das Startgebot, darunter liesse sich nichts zeigen) und bleiben unter dem Sofortpreis.
  const verlauf = useMemo(() => {
    if (!l) return [];
    const echt = gebote.map((g) => ({ id: g.id, name: g.bidder?.display_name || "Bieter", betrag: Number(g.amount), zeit: g.created_at, beispiel: false }));
    const zeilen = [...echt];
    let oben = echt.length ? Math.max(...echt.map((e) => e.betrag)) : Number(l.start_price || 1);
    const deckel = l.buy_now_price ? Number(l.buy_now_price) - 1 : Infinity;
    const fehlen = Math.max(0, 5 - zeilen.length);
    const start = echt.length ? Math.max(...echt.map((e) => new Date(e.zeit).getTime())) : Date.now() - 48 * 3600000;
    for (let i = 0; i < fehlen; i += 1) {
      oben = Math.min(deckel, oben + Math.max(1, Math.round(oben * 0.18)));
      const zeit = start + ((Date.now() - start) * (i + 1)) / (fehlen + 1);
      zeilen.push({ id: `beispiel-${i}`, name: BEISPIEL_NAMEN[i % BEISPIEL_NAMEN.length], betrag: oben, zeit: new Date(zeit).toISOString(), beispiel: true });
    }
    return zeilen.sort((a, b) => b.betrag - a.betrag || new Date(b.zeit) - new Date(a.zeit));
  }, [l, gebote]);

  const bilder = l ? (l.images || l.listing_images || []).map((b) => b.url).filter(Boolean) : [];
  const hoechst = verlauf[0]?.betrag || Number(l?.start_price || 0);
  const schritt = hoechst >= 100 ? 5 : 1;

  return (
    <div className="sl" data-grund={grund} data-gelb={gelb}>
      <div className="sl-rahmen">
        <StilKopf {...stil} />

        {leer && <p className="sl-i-hinweis">Gerade läuft keine Auktion mit Bildern. Sobald eine aktiv ist, erscheint sie hier.</p>}
        {!l && !leer && <p className="sl-i-hinweis">Inserat wird geladen.</p>}

        {l && (
          <>
            <nav className="sl-i-pfad" aria-label="Pfad">
              <Link href={`/labor/stil?grund=${grund}&gelb=${gelb}`}>Start</Link><span>/</span>
              <span>{l.category?.name || "Auktionen"}</span><span>/</span>
              <span className="sl-i-pfad-hier">{l.title}</span>
            </nav>

            <div className="sl-i">
              <div className="sl-i-galerie">
                <div className="sl-i-haupt">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {bilder[bild] && <img key={bilder[bild]} src={bilder[bild]} alt={l.title} />}
                  <span className="sl-chip">Auktion</span>
                  <span className="sl-i-zaehler">{bild + 1} / {bilder.length}</span>
                </div>
                {bilder.length > 1 && (
                  <div className="sl-i-daumen">
                    {bilder.slice(0, 8).map((u, i) => (
                      <button key={u} type="button" className="eckig kein-akzent" aria-label={`Bild ${i + 1}`} aria-pressed={i === bild} onClick={() => setBild(i)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <aside className="sl-i-seite">
                <h1 className="sl-i-titel">{l.title}</h1>
                <p className="sl-i-meta">
                  {ZUSTAND[l.condition] && <span>{ZUSTAND[l.condition]}</span>}
                  {l.city && <span><MapPin size={14} strokeWidth={2.2} /> {l.city}</span>}
                  <span><Truck size={14} strokeWidth={2.2} /> {l.shipping_available ? (l.pickup_only ? "Versand oder Abholung" : "Versand") : "Nur Abholung"}</span>
                </p>

                <div className="sl-i-box">
                  <div className="sl-i-box-kopf">
                    <div>
                      <span className="sl-i-klein">Aktuelles Gebot</span>
                      <span className="sl-i-preis">{fr(hoechst)}</span>
                      <span className="sl-i-klein">{verlauf.length} Gebote, Start bei {fr(l.start_price || 1)}</span>
                    </div>
                    <span className="sl-i-live"><span className="sl-i-punkt" /> läuft</span>
                  </div>
                  <span className="sl-i-klein sl-i-endet"><Clock size={14} strokeWidth={2.2} /> Endet in</span>
                  <Countdown ende={l.auction_end} />
                  <div className="sl-i-bieten">
                    <span className="sl-i-eingabe">CHF <strong>{hoechst + schritt}</strong></span>
                    <Link href={`/listing/${l.id}`} className="sl-knopf sl-knopf-ink"><Gavel size={16} strokeWidth={2.4} /> Bieten</Link>
                  </div>
                  <p className="sl-i-klein">Mindestens {fr(hoechst + schritt)}. Du zahlst nur so viel wie nötig, um vorne zu bleiben.</p>
                  {l.buy_now_price && (
                    <Link href={`/listing/${l.id}`} className="sl-knopf sl-knopf-linie sl-i-sofort"><Zap size={16} strokeWidth={2.4} /> Sofort kaufen für {fr(l.buy_now_price)}</Link>
                  )}
                </div>

                <div className="sl-i-aktionen">
                  <span className="sl-link"><Heart size={15} strokeWidth={2.4} /> Merken</span>
                  <span className="sl-link"><Share2 size={15} strokeWidth={2.4} /> Teilen</span>
                </div>

                <div className="sl-i-verk">
                  <span className="sl-i-avatar sl-i-avatar-gross">{initialen(l.seller?.display_name)}</span>
                  <span className="sl-i-verk-text">
                    <span className="sl-i-verk-name">{l.seller?.company_name || l.seller?.display_name || "Verkäufer"}</span>
                    <span className="sl-i-klein"><ShieldCheck size={14} strokeWidth={2.2} /> Mitglied seit {l.seller?.created_at ? new Date(l.seller.created_at).getFullYear() : "2026"}</span>
                  </span>
                  <ArrowUpRight size={20} strokeWidth={2.2} />
                </div>
              </aside>
            </div>

            <div className="sl-i-unten">
              <section>
                <div className="sl-abschnitt-kopf"><h2 className="sl-h2">Gebotsverlauf</h2><span className="sl-i-klein">{verlauf.length} Gebote</span></div>
                <ol className="sl-i-gebote">
                  {verlauf.map((g, i) => (
                    <li key={g.id} className={`sl-i-gebot${i === 0 ? " sl-i-gebot-vorn" : ""}`}>
                      <span className="sl-i-rang">{String(i + 1).padStart(2, "0")}</span>
                      <span className="sl-i-avatar">{initialen(g.name)}</span>
                      <span className="sl-i-gebot-text">
                        <span className="sl-i-gebot-name">{g.name}{g.beispiel && <em>Beispiel</em>}</span>
                        <span className="sl-i-klein">{wann(g.zeit)}</span>
                      </span>
                      <span className="sl-i-gebot-rechts">
                        {i === 0 && <span className="sl-i-vorn-marke">Höchstbietend</span>}
                        <span className="sl-i-gebot-betrag">{fr(g.betrag)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="sl-i-klein sl-i-fuss">Zeilen mit «Beispiel» sind nur für diese Stilseite erfunden und stehen nicht in der Datenbank.</p>
              </section>
              <section>
                <div className="sl-abschnitt-kopf"><h2 className="sl-h2">Beschreibung</h2></div>
                <p className="sl-i-text">{l.description || "Keine Beschreibung."}</p>
              </section>
            </div>
          </>
        )}

        <footer className="sl-fuss">
          <BeeLogo size={64} style={{ color: "var(--sl-gelb)" }} />
          <p className="sl-fuss-satz">20 % jeder Gebühr gehen an den Bienenschutz.</p>
          <p className="sl-fuss-klein">Stilseite zum Entscheiden. Geboten wird auf dem echten Inserat.</p>
        </footer>
      </div>
    </div>
  );
}
