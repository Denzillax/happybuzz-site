"use client";
// Inseratseite im Meeko-Stil (Denis 19.09.2026): Auktion mit Galerie, Gebotsbox, Verkäufer, Gebotsverlauf.
// Zeigt ein ECHTES aktives Auktionsinserat: das aus der Adresse (?id=) oder sonst das mit dem höchsten Gebot.
// Die Gebote sind echt. Hat die Auktion weniger als fünf, wird der Verlauf NUR IN DER ANZEIGE mit deutlich
// gekennzeichneten Beispielgeboten aufgefüllt, damit man die Gestaltung beurteilen kann. Nichts davon wird
// gespeichert, und geboten wird hier nicht: Die Knöpfe führen zum echten Inserat.
// Bausteine: ../MeekoTeile.jsx. Styles: globals.css unter MEEKO-LABOR (mk-i-*).
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Gavel, MapPin, Share2, ShieldCheck, Truck, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getListingPublic, getBids } from "@/lib/listings";
import { chf, getCoverUrl } from "@/lib/formatters";
import { FORMAT, Fuss, Herz, Karte, Kopf, LISTE, PASTELL, Roll, useEinblenden, useMeekoSchrift } from "../MeekoTeile";

const ZUSTAND = { new: "Neu", like_new: "Wie neu", good: "Gut", fair: "Gebrauchsspuren", poor: "Defekt oder Bastler" };
const BEISPIEL_NAMEN = ["Lena M.", "Reto K.", "Sara B.", "Jonas W.", "Mira T."];
const AVATARFARBEN = ["lavendel", "mint", "rosa", "himmel", "rose"];
// chf() liefert nur die Zahl mit Rappen (1'000.00). Hier ganze Franken mit Währung davor.
const fr = (n) => `CHF ${chf(n).replace(/\.00$/, "")}`;
const initialen = (name) => (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((t) => t[0].toUpperCase()).join("");

function wann(iso) {
  const d = new Date(iso), zeit = d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
  const tage = Math.floor((new Date(new Date().toDateString()) - new Date(d.toDateString())) / 86400000);
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
  const s = Math.floor((ms || 0) / 1000);
  const teile = [["Tage", Math.floor(s / 86400)], ["Std", Math.floor((s % 86400) / 3600)], ["Min", Math.floor((s % 3600) / 60)], ["Sek", s % 60]];
  return (
    <div className="mk-i-uhr" role="timer" aria-label="Restzeit der Auktion">
      {teile.map(([name, wert]) => (
        <span key={name} className="mk-i-uhr-zelle">
          <span className="mk-i-uhr-zahl">{ms === null ? "00" : String(wert).padStart(2, "0")}</span>
          <span className="mk-i-uhr-name">{name}</span>
        </span>
      ))}
    </div>
  );
}

export default function MeekoInserat() {
  const [l, setL] = useState(null);
  const [gebote, setGebote] = useState([]);
  const [aehnlich, setAehnlich] = useState([]);
  const [bild, setBild] = useState(0);
  const [leer, setLeer] = useState(false);
  const wurzel = useRef(null);
  useMeekoSchrift();
  useEinblenden(wurzel, [l, aehnlich]);

  useEffect(() => {
    (async () => {
      const jetzt = new Date().toISOString();
      let id = null;
      try { id = new URLSearchParams(window.location.search).get("id"); } catch {}
      if (!id) {
        // Aktive Auktion mit dem höchsten Gebot, bei Gleichstand die mit mehr Bildern
        const { data } = await supabase.from("listings").select("id, listing_images(url)")
          .eq("listing_type", "auction").eq("status", "active").gt("auction_end", jetzt).order("created_at", { ascending: false }).limit(12);
        const kandidaten = (data || []).filter((x) => (x.listing_images || []).length > 0);
        if (!kandidaten.length) { setLeer(true); return; }
        const mit = await Promise.all(kandidaten.map(async (k) => ({ k, b: await getBids(k.id) })));
        const spitze = (x) => Math.max(0, ...x.b.map((g) => Number(g.amount) || 0));
        mit.sort((a, b) => spitze(b) - spitze(a) || b.k.listing_images.length - a.k.listing_images.length);
        id = mit[0].k.id;
      }
      try {
        const inserat = await getListingPublic(id);
        setL(inserat); setGebote(await getBids(id));
        const { data } = await supabase.from("listings").select(LISTE).eq("status", "active").neq("id", id).order("created_at", { ascending: false }).limit(12);
        setAehnlich((data || []).filter((x) => getCoverUrl(x)).slice(0, 3));
      } catch { setLeer(true); }
    })();
  }, []);

  // Verlauf für die Anzeige: echte Gebote, darüber Beispielgebote bis insgesamt fünf Zeilen. Die Beispiele steigen vom
  // höchsten echten Gebot aus an (in der Beta ist das meist nur das Startgebot) und bleiben unter dem Sofortpreis.
  const verlauf = useMemo(() => {
    if (!l) return [];
    const echt = gebote.map((g) => ({ id: g.id, name: g.bidder?.display_name || "Bieter", betrag: Number(g.amount), zeit: g.created_at, beispiel: false }));
    const zeilen = [...echt];
    let oben = echt.length ? Math.max(...echt.map((e) => e.betrag)) : Number(l.start_price || 1);
    const deckel = l.buy_now_price ? Number(l.buy_now_price) - 1 : Infinity, fehlen = Math.max(0, 5 - zeilen.length);
    const start = echt.length ? Math.max(...echt.map((e) => new Date(e.zeit).getTime())) : Date.now() - 48 * 3600000;
    for (let i = 0; i < fehlen; i += 1) {
      oben = Math.min(deckel, oben + Math.max(1, Math.round(oben * 0.18)));
      zeilen.push({ id: `beispiel-${i}`, name: BEISPIEL_NAMEN[i % BEISPIEL_NAMEN.length], betrag: oben, zeit: new Date(start + ((Date.now() - start) * (i + 1)) / (fehlen + 1)).toISOString(), beispiel: true });
    }
    return zeilen.sort((a, b) => b.betrag - a.betrag || new Date(b.zeit) - new Date(a.zeit));
  }, [l, gebote]);

  const bilder = l ? (l.images || l.listing_images || []).map((b) => b.url).filter(Boolean) : [];
  const hoechst = verlauf[0]?.betrag || Number(l?.start_price || 0), schritt = hoechst >= 100 ? 5 : 1;
  const tafel = `mk-${PASTELL[l?.listing_type] || "lavendel"}`;

  return (
    <div className="mk" ref={wurzel}>
      <Kopf />
      <main className="mk-i-seite">
        {leer && <p className="mk-i-hinweis">Gerade läuft keine Auktion mit Bildern. Sobald eine aktiv ist, erscheint sie hier.</p>}
        {!l && !leer && <p className="mk-i-hinweis">Inserat wird geladen.</p>}

        {l && (
          <>
            <nav className="mk-i-pfad" aria-label="Pfad">
              <Link href="/labor/meeko"><Roll>Start</Roll></Link><span aria-hidden="true">/</span>
              <span>{l.category?.name || "Auktionen"}</span><span aria-hidden="true">/</span>
              <span className="mk-i-pfad-hier">{l.title}</span>
            </nav>

            <div className="mk-i">
              <div className="mk-i-galerie mk-auf">
                <div className={`mk-i-haupt ${tafel}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {bilder[bild] && <img key={bilder[bild]} src={bilder[bild]} alt={l.title} />}
                  <span className="mk-i-zaehler">{bild + 1} / {bilder.length}</span>
                </div>
                {bilder.length > 1 && (
                  <div className="mk-i-daumen">
                    {bilder.slice(0, 6).map((u, i) => (
                      <button key={u} type="button" className="eckig kein-akzent" aria-label={`Bild ${i + 1} zeigen`} aria-pressed={i === bild} onClick={() => setBild(i)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <aside className="mk-i-rechts mk-auf">
                <span className="mk-tags">{FORMAT[l.listing_type]}{l.city ? `, ${l.city}` : ""}</span>
                <h1 className="mk-i-titel">{l.title}</h1>
                <p className="mk-i-meta">
                  {ZUSTAND[l.condition] && <span>{ZUSTAND[l.condition]}</span>}
                  {l.city && <span><MapPin size={15} strokeWidth={2} aria-hidden="true" /> {l.city}</span>}
                  <span><Truck size={15} strokeWidth={2} aria-hidden="true" /> {l.shipping_available ? (l.pickup_only ? "Versand oder Abholung" : "Versand") : "Nur Abholung"}</span>
                </p>

                <div className="mk-i-box">
                  <div className="mk-i-box-kopf">
                    <span>
                      <span className="mk-i-klein">Aktuelles Gebot</span>
                      <span className="mk-i-preis">{fr(hoechst)}</span>
                    </span>
                    <span className="mk-i-live"><span className="mk-i-punkt" aria-hidden="true" />läuft</span>
                  </div>
                  <span className="mk-i-klein">{verlauf.length} Gebote, Start bei {fr(l.start_price || 1)}</span>
                  <Countdown ende={l.auction_end} />
                  <div className="mk-i-bieten">
                    <span className="mk-i-eingabe">CHF <strong>{hoechst + schritt}</strong></span>
                    <Link href={`/listing/${l.id}`} className="mk-knopf mk-knopf-dunkel"><Gavel size={17} strokeWidth={2.2} aria-hidden="true" /><Roll>Bieten</Roll></Link>
                  </div>
                  <span className="mk-i-klein">Mindestens {fr(hoechst + schritt)}. Du zahlst nur so viel wie nötig, um vorne zu bleiben.</span>
                  {l.buy_now_price && (
                    <Link href={`/listing/${l.id}`} className="mk-knopf mk-i-sofort"><Zap size={17} strokeWidth={2.2} aria-hidden="true" /><Roll>Sofort kaufen für {fr(l.buy_now_price)}</Roll></Link>
                  )}
                </div>

                <div className="mk-i-aktionen">
                  <Herz gross />
                  <span>Merken</span>
                  <button type="button" className="mk-knopf mk-i-teilen eckig kein-akzent"><Share2 size={16} strokeWidth={2} aria-hidden="true" /><Roll>Teilen</Roll></button>
                </div>

                <div className="mk-i-verk">
                  <span className="mk-i-avatar mk-i-avatar-gross mk-butter">{initialen(l.seller?.display_name)}</span>
                  <span className="mk-i-verk-text">
                    <span className="mk-i-verk-name">{l.seller?.company_name || l.seller?.display_name || "Verkäufer"}</span>
                    <span className="mk-i-klein"><ShieldCheck size={15} strokeWidth={2} aria-hidden="true" /> Mitglied seit {l.seller?.created_at ? new Date(l.seller.created_at).getFullYear() : "2026"}</span>
                  </span>
                </div>
              </aside>
            </div>

            <div className="mk-i-unten">
              <section className="mk-i-karte mk-auf">
                <div className="mk-i-karte-kopf"><h2 className="mk-i-h2">Gebotsverlauf</h2><span className="mk-tags">{verlauf.length} Gebote</span></div>
                <ol className="mk-i-gebote">
                  {verlauf.map((g, i) => (
                    <li key={g.id} className={`mk-i-gebot${i === 0 ? " mk-i-gebot-vorn" : ""}`}>
                      {i === 0 && <span className="mk-i-vorn-marke">Höchstbietend</span>}
                      <span className={`mk-i-avatar mk-${AVATARFARBEN[i % AVATARFARBEN.length]}`}>{initialen(g.name)}</span>
                      <span className="mk-i-gebot-text">
                        <span className="mk-i-gebot-name">{g.name}{g.beispiel && <em>Beispiel</em>}</span>
                        <span className="mk-i-klein">{wann(g.zeit)}</span>
                      </span>
                      <span className="mk-i-gebot-betrag">{fr(g.betrag)}</span>
                    </li>
                  ))}
                </ol>
                <p className="mk-i-klein mk-i-fussnote">Zeilen mit «Beispiel» sind nur für diese Vorschau erfunden und stehen nicht in der Datenbank.</p>
              </section>
              <section className="mk-i-karte mk-auf">
                <div className="mk-i-karte-kopf"><h2 className="mk-i-h2">Beschreibung</h2></div>
                <p className="mk-i-text">{l.description || "Keine Beschreibung."}</p>
              </section>
            </div>

            {aehnlich.length > 0 && (
              <section className="mk-abschnitt mk-i-aehnlich">
                <div className="mk-abschnitt-kopf mk-auf"><h2 className="mk-h2">Das könnte dir auch gefallen</h2></div>
                <div className="mk-karten">{aehnlich.map((x) => <Karte key={x.id} l={x} mitRest={x.listing_type === "auction"} />)}</div>
              </section>
            )}
          </>
        )}
      </main>
      <Fuss hinweis="Vorschau. Geboten wird auf dem echten Inserat." />
    </div>
  );
}
