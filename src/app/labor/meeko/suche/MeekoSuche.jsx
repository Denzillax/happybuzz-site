"use client";
// Suche im Meeko-Stil (Denis 20.09.2026): der Härtetest für diesen Stil. Die Vorlage ist ein Portfolio für eine Handvoll
// Projekte, eine Suche zeigt viele Treffer auf einmal. Darum gibt es hier dieselbe Formensprache in drei Dichten:
//   gross   = die Karte der Startseite (3 Spalten), für wenige Treffer und zum Stöbern
//   kompakt = kleinere Tafel, kleinere Schrift (4 bis 5 Spalten), Standard der Suche
//   liste   = eine Zeile pro Inserat, am dichtesten
// Alle Inserate sind echt (alle aktiven, bis 200). Gefiltert und sortiert wird in dieser Vorschau im Browser: Text,
// Format, Kategorie, Preis, Lieferart, Sortierung. Die echte Suche der Seite (/search) bleibt unberührt.
// Bausteine: ../MeekoTeile.jsx. Styles: globals.css unter MEEKO-LABOR (mk-s-*).
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Search, SlidersHorizontal, Square, X } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getCoverUrl } from "@/lib/formatters";
import { FORMAT, Fuss, Herz, Kopf, LISTE, PASTELL, Restzeit, Roll, preis, useEinblenden, useMeekoSchrift } from "../MeekoTeile";

const SORTIERUNG = [["neu", "Neueste zuerst"], ["billig", "Preis aufsteigend"], ["teuer", "Preis absteigend"], ["endet", "Endet bald"]];
const ANSICHTEN = [["gross", "Grosse Karten", Square], ["kompakt", "Kompakte Karten", LayoutGrid], ["liste", "Liste", List]];
const SEITE = 12;
const zahl = (l) => Number(l.listing_type === "auction" ? l.start_price : l.listing_type === "rent" ? l.rent_price : l.listing_type === "free" ? 0 : l.price) || 0;
const ziel = (l) => (l.listing_type === "auction" ? `/labor/meeko/inserat?id=${l.id}` : `/listing/${l.id}`);

function Treffer({ l, ansicht }) {
  const tafel = `mk-${PASTELL[l.listing_type] || "lavendel"}`;
  if (ansicht === "liste") {
    return (
      <article className="mk-s-zeile">
        <Link href={ziel(l)} className="mk-s-zeile-link" aria-label={`${l.title}, ${FORMAT[l.listing_type]}, ${preis(l)}`}>
          <span className={`mk-s-zeile-bild ${tafel}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getCoverUrl(l)} alt="" loading="lazy" />
          </span>
          <span className="mk-s-zeile-text">
            <span className="mk-tags">{FORMAT[l.listing_type]}{l.city ? `, ${l.city}` : ""}</span>
            <span className="mk-s-zeile-titel">{l.title}</span>
          </span>
          <span className="mk-s-zeile-rechts">
            <span className="mk-preis">{preis(l)}</span>
            {l.listing_type === "auction" && l.auction_end && <Restzeit ende={l.auction_end} />}
          </span>
        </Link>
        <Herz gross />
      </article>
    );
  }
  return (
    <article className={`mk-karte${ansicht === "kompakt" ? " mk-karte-kompakt" : ""}`}>
      <Link href={ziel(l)} className="mk-karte-link" aria-label={`${l.title}, ${FORMAT[l.listing_type]}, ${preis(l)}`}>
        <span className={`mk-tafel ${tafel}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getCoverUrl(l)} alt="" loading="lazy" />
        </span>
        <span className="mk-karte-text">
          <span className="mk-tags">{FORMAT[l.listing_type]}{l.city ? `, ${l.city}` : ""}</span>
          <span className="mk-karte-titel">{l.title}</span>
          <span className="mk-karte-unten">
            <span className="mk-preis">{preis(l)}</span>
            {l.listing_type === "auction" && l.auction_end && <Restzeit ende={l.auction_end} />}
          </span>
        </span>
      </Link>
      <Herz />
    </article>
  );
}

export default function MeekoSuche() {
  const [alle, setAlle] = useState(null);
  const [kategorien, setKategorien] = useState([]);
  const [oberste, setOberste] = useState(new Map()); // Kategorie -> ihre Hauptkategorie
  const [q, setQ] = useState("");
  const [typ, setTyp] = useState("");
  const [kat, setKat] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [lieferung, setLieferung] = useState("");
  const [sort, setSort] = useState("neu");
  const [ansicht, setAnsicht] = useState("kompakt");
  const [filterOffen, setFilterOffen] = useState(false);
  const [sichtbar, setSichtbar] = useState(SEITE);
  const wurzel = useRef(null);
  useMeekoSchrift();
  useEinblenden(wurzel, [alle]);

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get("q")) setQ(p.get("q"));
      if (FORMAT[p.get("type")]) setTyp(p.get("type"));
    } catch {}
    const jetzt = new Date().toISOString();
    supabase.from("listings").select(`${LISTE}, category_id, shipping_available, pickup_only`).eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${jetzt}`).order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setAlle((data || []).filter((l) => getCoverUrl(l))));
    supabase.from("categories").select("id, name, parent_id, sort_order").neq("is_active", false).order("sort_order").then(({ data }) => {
      const eltern = new Map((data || []).map((k) => [k.id, k.parent_id]));
      const haupt = new Map();
      for (const k of data || []) { let id = k.id, n = 0; while (eltern.get(id) && n < 6) { id = eltern.get(id); n += 1; } haupt.set(k.id, id); }
      setOberste(haupt);
      setKategorien((data || []).filter((k) => !k.parent_id));
    });
  }, []);

  const treffer = useMemo(() => {
    if (!alle) return [];
    const worte = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const lo = parseFloat(min), hi = parseFloat(max);
    const liste = alle.filter((l) => {
      if (typ && l.listing_type !== typ) return false;
      if (kat && oberste.get(l.category_id) !== kat) return false;
      if (worte.length && !worte.every((w) => `${l.title} ${l.city || ""}`.toLowerCase().includes(w))) return false;
      if (Number.isFinite(lo) && zahl(l) < lo) return false;
      if (Number.isFinite(hi) && zahl(l) > hi) return false;
      if (lieferung === "versand" && !l.shipping_available) return false;
      if (lieferung === "abholung" && !l.pickup_only) return false; // pickup_only bedeutet in der Datenbank "Abholung möglich"
      return true;
    });
    const nach = { neu: (a, b) => new Date(b.created_at) - new Date(a.created_at), billig: (a, b) => zahl(a) - zahl(b), teuer: (a, b) => zahl(b) - zahl(a),
      endet: (a, b) => (a.auction_end ? new Date(a.auction_end).getTime() : Infinity) - (b.auction_end ? new Date(b.auction_end).getTime() : Infinity) };
    return [...liste].sort(nach[sort]);
  }, [alle, q, typ, kat, min, max, lieferung, sort, oberste]);

  useEffect(() => { setSichtbar(SEITE); }, [q, typ, kat, min, max, lieferung, sort]);

  const aktiv = [typ && ["Format", FORMAT[typ], () => setTyp("")], kat && ["Kategorie", kategorien.find((k) => k.id === kat)?.name, () => setKat("")],
    (min || max) && ["Preis", `${min || "0"} bis ${max || "offen"}`, () => { setMin(""); setMax(""); }],
    lieferung && ["Lieferung", lieferung === "versand" ? "Versand" : "Abholung", () => setLieferung("")]].filter(Boolean);
  const zuruecksetzen = () => { setQ(""); setTyp(""); setKat(""); setMin(""); setMax(""); setLieferung(""); };
  const zeige = treffer.slice(0, sichtbar);

  return (
    <div className="mk" ref={wurzel}>
      <Kopf />

      <section className="mk-s-kopf mk-butter">
        <h1 className="mk-s-h1">{q.trim() ? `Treffer für «${q.trim()}»` : typ ? `${FORMAT[typ]}: alle Inserate` : "Alle Inserate"}</h1>
        <form className="mk-suche" onSubmit={(e) => e.preventDefault()} role="search">
          <Search size={20} strokeWidth={2} aria-hidden="true" />
          <input className="pille-input" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Velo, Kamera, Sofa …" aria-label="Suchbegriff" />
          {q && <button type="button" className="mk-s-leeren eckig kein-akzent" aria-label="Suchbegriff löschen" onClick={() => setQ("")}><X size={18} strokeWidth={2} /></button>}
        </form>
      </section>

      <main className="mk-s-seite">
        {/* Formate als Pillen: jede in ihrer Pastellfarbe, die aktive bekommt den eingedrückten Schatten */}
        <div className="mk-s-formate" role="group" aria-label="Format">
          <button type="button" className={`mk-s-pille mk-weiss eckig kein-akzent${typ === "" ? " mk-s-pille-an" : ""}`} aria-pressed={typ === ""} onClick={() => setTyp("")}>Alle</button>
          {Object.keys(FORMAT).map((t) => (
            <button key={t} type="button" className={`mk-s-pille eckig kein-akzent mk-${PASTELL[t]}${typ === t ? " mk-s-pille-an" : ""}`} aria-pressed={typ === t} onClick={() => setTyp(typ === t ? "" : t)}>{FORMAT[t]}</button>
          ))}
        </div>

        <div className="mk-s-leiste">
          <p className="mk-s-zahl" aria-live="polite">{alle === null ? "Inserate werden geladen." : `${treffer.length} ${treffer.length === 1 ? "Inserat" : "Inserate"}`}</p>
          <div className="mk-s-werkzeug">
            <button type="button" className="mk-knopf mk-s-filterknopf eckig kein-akzent" aria-expanded={filterOffen} aria-controls="mk-s-filter" onClick={() => setFilterOffen((v) => !v)}>
              <SlidersHorizontal size={17} strokeWidth={2} aria-hidden="true" /><Roll>Filter{aktiv.length ? ` (${aktiv.length})` : ""}</Roll>
            </button>
            <label className="mk-s-wahl"><span className="mk-nur-leser">Sortierung</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>{SORTIERUNG.map(([w, t]) => <option key={w} value={w}>{t}</option>)}</select>
            </label>
            <div className="mk-s-ansicht" role="group" aria-label="Ansicht">
              {ANSICHTEN.map(([w, t, Icon]) => (
                <button key={w} type="button" className="eckig kein-akzent" aria-label={t} title={t} aria-pressed={ansicht === w} onClick={() => setAnsicht(w)}><Icon size={18} strokeWidth={2} /></button>
              ))}
            </div>
          </div>
        </div>

        {filterOffen && (
          <div id="mk-s-filter" className="mk-s-filter">
            <label className="mk-s-feld"><span>Kategorie</span>
              <select value={kat} onChange={(e) => setKat(e.target.value)}><option value="">Alle Kategorien</option>{kategorien.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select>
            </label>
            <div className="mk-s-feld"><span>Preis in CHF</span>
              <div className="mk-s-preis">
                <input className="pille-input" type="number" min="0" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder="von" aria-label="Preis von" />
                <input className="pille-input" type="number" min="0" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder="bis" aria-label="Preis bis" />
              </div>
            </div>
            <label className="mk-s-feld"><span>Lieferung</span>
              <select value={lieferung} onChange={(e) => setLieferung(e.target.value)}><option value="">Egal</option><option value="versand">Mit Versand</option><option value="abholung">Mit Abholung</option></select>
            </label>
          </div>
        )}

        {aktiv.length > 0 && (
          <div className="mk-s-aktiv">
            {aktiv.map(([name, wert, weg]) => (
              <button key={name} type="button" className="mk-s-chip eckig kein-akzent" onClick={weg} aria-label={`${name} ${wert} entfernen`}>{name}: {wert} <X size={14} strokeWidth={2.4} aria-hidden="true" /></button>
            ))}
            <button type="button" className="mk-s-alle-weg eckig kein-akzent" onClick={zuruecksetzen}>Alle Filter entfernen</button>
          </div>
        )}

        {alle !== null && treffer.length === 0 ? (
          <div className="mk-s-leer">
            <h2 className="mk-h2">Dazu gibt es gerade nichts.</h2>
            <p>Versuch es mit weniger Wörtern oder nimm einen Filter heraus. Was heute fehlt, stellt morgen vielleicht jemand ein.</p>
            <div className="mk-s-leer-knoepfe">
              <button type="button" className="mk-knopf eckig kein-akzent" onClick={zuruecksetzen}><Roll>Suche zurücksetzen</Roll></button>
              <Link href="/listings/new" className="mk-knopf mk-knopf-dunkel"><Roll>Selbst inserieren</Roll></Link>
            </div>
          </div>
        ) : (
          <div className={`mk-s-treffer mk-s-${ansicht}`}>{zeige.map((l) => <Treffer key={l.id} l={l} ansicht={ansicht} />)}</div>
        )}

        {treffer.length > sichtbar && (
          <div className="mk-mehr">
            <span className="mk-s-stand">{zeige.length} von {treffer.length} angezeigt</span>
            <button type="button" className="mk-knopf eckig kein-akzent" onClick={() => setSichtbar((n) => n + SEITE)}><Roll>{treffer.length - sichtbar === 1 ? "Letztes Inserat laden" : `Weitere ${Math.min(SEITE, treffer.length - sichtbar)} laden`}</Roll></button>
          </div>
        )}
      </main>

      <Fuss hinweis="Vorschau der Suche. Die echte Suche der Seite ist unverändert." />
    </div>
  );
}
