"use client"
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, Shuffle, Sparkles } from "lucide-react";
import { searchListings, getCategories, saveSearch, getRandomListingId } from "@/lib/listings";
import { getFilterableAttributes, filterListingsByAttributes } from "@/lib/api/attributes";
import { colors, fonts, radius } from "@/lib/theme";
import { CONDITIONS, LISTING_TYPES } from "@/lib/constants";
import { ListingCard } from "@/components/shared/ListingCard";
import { RasterUmschalter } from "@/components/shared/RasterUmschalter";
import { SuchFilter } from "@/components/search/SuchFilter";
import { getRecentSearches, recordSearch, clearRecentSearches } from "@/lib/recentSearches";
import { getActiveBoosts } from "@/lib/gamification";

// ── Katalog-Design-Tokens (Hero/ListingCard-konsistent) ──
const INK = "#1D1D1D";
const PETROL = "#1D1D1D";

const SORT_OPTS = [
  { value: "relevanz", label: "Relevanz" },
  { value: "newest", label: "Neueste" },
  { value: "price_asc", label: "Preis aufsteigend" },
  { value: "price_desc", label: "Preis absteigend" },
  { value: "endet_bald", label: "Endet bald" },
  { value: "meiste_gebote", label: "Meiste Gebote" },
];

// Die Filter (Pillen am Desktop, Seitenleiste am Handy) leben in components/search/SuchFilter.jsx.

// ── Main Search Page ─────────────────────────────────────────
// Suspense-Wrapper: useSearchParams braucht eine Boundary fürs Prerendering
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // KI-Einstieg aus dem Header: /search?ki=1&q=... - der q-Text gehoert dann
  // dem KI-Feld, NICHT der Stichwortsuche (sonst feuern beide).
  const kiEntry = searchParams.get("ki") === "1";
  const [zufallLaedt, setZufallLaedt] = useState(false);
  // "Überrasch mich": springt zu einem zufälligen aktiven Inserat
  const zeigeZufall = async () => {
    if (zufallLaedt) return;
    setZufallLaedt(true);
    try {
      const id = await getRandomListingId();
      if (id) router.push(`/listing/${id}`);
    } finally { setZufallLaedt(false); }
  };
  // KI-Suche (Beta-Feedback Tacocat 08.09.): Alltagsbeschreibung -> Filter
  const [kiOffen, setKiOffen] = useState(kiEntry);
  const [kiText, setKiText] = useState(kiEntry ? (searchParams.get("q") || "") : "");
  const [kiLaedt, setKiLaedt] = useState(false);
  const [kiFehler, setKiFehler] = useState("");
  const [kiHinweis, setKiHinweis] = useState("");
  const [results, setResults] = useState([]);
  const [boosts, setBoosts] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);

  const [query, setQuery] = useState(kiEntry ? "" : (searchParams.get("q") || ""));
  // Draft fuer die mobile Suchzeile (Desktop sucht im Header)
  const [draft, setDraft] = useState(kiEntry ? "" : (searchParams.get("q") || ""));
  // category-Param kann UUID ODER Slug sein; Slugs werden erst nach dem Laden
  // der Kategorien aufgeloest (Effect unten), sonst 400er gegen die UUID-Spalte
  const [mainCatId, setMainCatId] = useState(() => {
    const cat = searchParams.get("category") || "";
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cat) ? cat : "";
  });
  const [subCatId, setSubCatId] = useState("");
  const [subSubCatId, setSubSubCatId] = useState("");
  // type-Param: Direkteinstieg von den Format-Kacheln der Startseite
  const [type, setType] = useState(() => {
    const t = searchParams.get("type") || "";
    return ["sell", "auction", "rent", "free", "service"].includes(t) ? t : "";
  });
  const [condition, setCondition] = useState("");
  // Preis und Lieferung kommen auch aus der URL (Entdecken-Chips der Startseite: ?max=20)
  const zahlAusUrl = (k) => { const v = parseFloat(searchParams.get(k) || ""); return Number.isFinite(v) && v >= 0 ? String(v) : ""; };
  const [minPrice, setMinPrice] = useState(() => zahlAusUrl("min"));
  const [maxPrice, setMaxPrice] = useState(() => zahlAusUrl("max"));
  const [city, setCity] = useState("");
  const [delivery, setDelivery] = useState(() => (["shipping", "pickup"].includes(searchParams.get("delivery") || "") ? searchParams.get("delivery") : ""));
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verified") === "1");
  const [sortBy, setSortBy] = useState("relevanz");
  const [page, setPage] = useState(1);
  const [categoryAttrs, setCategoryAttrs] = useState([]);
  const [attrFilters, setAttrFilters] = useState({});
  const [recents, setRecents] = useState([]);
  const [searchSaved, setSearchSaved] = useState(false);

  useEffect(() => { setRecents(getRecentSearches()); }, []);
  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null)); }, []);
  useEffect(() => { getCategories().then(setCategories).catch(console.error); }, []);
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== query && !kiEntry) { setQuery(q); setDraft(q); }
    const cat = searchParams.get("category");
    if (cat && categories.length > 0) {
      const found = categories.find(c => c.id === cat || c.slug === cat);
      if (found) { setMainCatId(found.parent_id || found.id); if (found.parent_id) setSubCatId(found.id); }
    }
    const sort = searchParams.get("sort");
    if (sort) setSortBy(sort);
  }, [searchParams, categories]);

  useEffect(() => { doSearch(); }, [query, type, subCatId, subSubCatId, mainCatId, condition, sortBy, page, delivery, verifiedOnly, attrFilters]);

  // Load category-specific attributes
  useEffect(() => {
    const catId = subSubCatId || subCatId || mainCatId;
    if (catId) {
      getFilterableAttributes(catId).then(attrs => { setCategoryAttrs(attrs); setAttrFilters({}); });
    } else { setCategoryAttrs([]); setAttrFilters({}); }
  }, [mainCatId, subCatId, subSubCatId]);

  const mainCats = categories.filter(c => !c.parent_id);
  const subCats = categories.filter(c => c.parent_id === mainCatId);

  // KI-Suche ausführen: Beschreibung -> Suchbegriffe + Filter anwenden.
  // textOverride: direkter Text (mobile Suchzeile), sonst der kiText-State.
  // typeof-Check statt ??, weil onClick={kiSuchen} ein Event-Objekt uebergibt.
  async function kiSuchen(textOverride) {
    const frage = (typeof textOverride === "string" ? textOverride : kiText).trim();
    if (!frage || kiLaedt) return;
    setKiLaedt(true); setKiFehler(""); setKiHinweis("");
    if (frage !== kiFallbackRef.current) setKiAuto("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setKiFehler("Bitte melde dich an, um die KI-Suche zu nutzen."); return; }
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ query: frage, categories: mainCats.map(({ id, name }) => ({ id, name })) }),
      });
      if (!res.ok) { setKiFehler("Die KI-Suche ist gerade nicht erreichbar. Versuch es normal über das Suchfeld."); return; }
      const r = await res.json();
      if (r.hinweis) setKiHinweis(r.hinweis);
      // Frischer Suchkontext: alte Filter ersetzen, KI-Vorschläge anwenden
      setDraft(r.q || ""); setQuery(r.q || "");
      setMainCatId(r.category_id || ""); setSubCatId(""); setSubSubCatId("");
      setType(r.listing_type || ""); setCondition("");
      setMinPrice(r.min_price != null ? String(r.min_price) : "");
      setMaxPrice(r.max_price != null ? String(r.max_price) : "");
      setPage(1);
    } catch {
      setKiFehler("Die KI-Suche ist gerade nicht erreichbar. Versuch es normal über das Suchfeld.");
    } finally { setKiLaedt(false); }
  }

  // Auto-Start beim Header-Einstieg (?ki=1&q=...): einmalig, erst wenn die
  // Kategorien geladen sind (die KI bekommt sie als Auswahlliste mit).
  const kiAutoRef = useRef(false);
  // Automatischer KI-Einsprung bei 0 Treffern (Denis 16.09.): merkt sich den
  // Text, fuer den er schon lief, damit die KI nicht in Schleife sucht.
  // KI-Schalter (gleicher Speicher wie im Header)
  const [kiModus, setKiModus] = useState(false);
  const KI_FARBE = "#1D1D1D"; // helleres Teal fuer den KI-Modus
  useEffect(() => { try { setKiModus(localStorage.getItem("beedaro_ki_suche") === "1"); } catch {} }, []);
  const toggleKi = () => setKiModus(v => { const n = !v; try { localStorage.setItem("beedaro_ki_suche", n ? "1" : "0"); } catch {} return n; });
  const kiFallbackRef = useRef("");
  const gesuchtRef = useRef(null); // Suchtext, zu dem total/results gehoeren
  const [kiAuto, setKiAuto] = useState("");
  // "Mit KI suchen" aus dem Nichts-gefunden-Block: Wortsuche hat versagt,
  // die KI sucht nach der Bedeutung (Denis 16.09.: lieber Knopf als Automatik).
  const kiNachfassen = () => {
    const q = query.trim(); if (!q) return;
    kiFallbackRef.current = q;
    setKiAuto(q); setKiOffen(true); setKiText(q);
    kiSuchen(q);
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
  };
  useEffect(() => {
    if (kiEntry && kiText.trim() && mainCats.length > 0 && !kiAutoRef.current) {
      kiAutoRef.current = true;
      kiSuchen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);
  const subSubCats = categories.filter(c => c.parent_id === subCatId);

  // preis: optionale Übersteuerung { min, max }, wenn der Preis gerade erst gesetzt wurde und der State noch alt ist
  async function doSearch(preis = {}) {
    setLoading(true);
    try {
      const activeCat = subSubCatId || subCatId || undefined;
      const parentCat = (!activeCat && mainCatId) ? mainCatId : undefined;
      const activeAttrFilters = Object.fromEntries(Object.entries(attrFilters).filter(([_, v]) => v));
      let attrListingIds = null;
      if (Object.keys(activeAttrFilters).length > 0) {
        attrListingIds = await filterListingsByAttributes(activeAttrFilters);
      }
      const min = preis.min !== undefined ? preis.min : minPrice;
      const max = preis.max !== undefined ? preis.max : maxPrice;
      const res = await searchListings({
        query, category_id: activeCat, parent_category_id: parentCat,
        listing_type: type || undefined, condition: condition || undefined,
        min_price: min || undefined, max_price: max || undefined,
        city: city || undefined, sort: sortBy, page, per_page: 24,
        delivery: delivery || undefined, listing_ids: attrListingIds,
        verified_only: verifiedOnly || undefined,
      });
      setResults(res.listings);
      setTotal(res.total);
      gesuchtRef.current = query.trim();
      getActiveBoosts((res.listings || []).map(l => l.id)).then(setBoosts).catch(() => {});
      if (query.trim()) { recordSearch(query); setRecents(getRecentSearches()); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  // Enter/Suchen in der mobilen Zeile: je nach Schalter Wortsuche oder KI
  const suchenStarten = () => {
    if (kiModus) { setKiOffen(true); setKiFehler(""); setKiText(draft); setKiAuto(""); if (draft.trim()) kiSuchen(draft); return; }
    setQuery(draft.trim()); setPage(1);
  };
  const totalPages = Math.ceil(total / 24);
  const activeFilterCount = [mainCatId, condition, type, minPrice || maxPrice, city, delivery, verifiedOnly, ...Object.values(attrFilters)].filter(Boolean).length;

  const conditionOpts = CONDITIONS.map(c => ({ value: c.value, label: c.label }));
  const typeOpts = LISTING_TYPES.map(t => ({ value: t.value, label: t.label }));
  const deliveryOpts = [{ value: "shipping", label: "Versand" }, { value: "pickup", label: "Abholung" }];

  return (
    <div style={{ minHeight: "100vh", fontFamily: fonts.body, background: "var(--bd-grund)" }}>

      <div className="bd-seite-breit">

        {/* ── Mobile Suchzeile (Desktop sucht im Header, Klasse blendet ein/aus) ── */}
        {/* Meeko-Design (20.09.2026): weisses Feld mit Ink-Rand wie die Suche im Header, mit KI-Schalter an wird es Rosa */}
        <div className="search-mobile-bar" style={{ background: kiModus ? "#FFDFF9" : "#fff", border: "1px solid #1D1D1D", borderRadius: 999, padding: 4, alignItems: "center", marginBottom: 14 }}>
          <Search size={16} style={{ marginLeft: 12, color: "#5B626C", flexShrink: 0, alignSelf: "center" }} />
          {/* pille-input: das Feld sitzt in einer Pille, der globale gelbe Fokus-Schein waere innen ein Viereck */}
          <input
            className="pille-input"
            type="text" value={draft} autoFocus={!query}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { suchenStarten(); e.target.blur(); } }}
            placeholder={kiModus ? "Beschreib, was du suchst" : "Was suchst du?"}
            style={{ flex: 1, minWidth: 0, padding: "10px 10px", border: "none", outline: "none", fontSize: 15, fontFamily: fonts.body, background: "transparent" }}
          />
          {draft && (
            <button onClick={() => { setDraft(""); setQuery(""); setPage(1); }} aria-label="Suche leeren"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", display: "flex", alignItems: "center" }}>
              <X size={16} color="#5B626C" />
            </button>
          )}
          {/* KI-Schalter (wie im Header, gleicher Speicher) */}
          <button type="button" onClick={toggleKi} aria-pressed={kiModus} title={kiModus ? "KI-Suche an" : "KI-Suche aus"}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 30, padding: "0 9px", marginRight: 4, borderRadius: 999, border: `1.5px solid ${kiModus ? KI_FARBE : "#1D1D1D"}`, background: kiModus ? KI_FARBE : "#fff", color: kiModus ? "#fff" : "#5B626C", fontSize: 12, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer", flexShrink: 0 }}>
            <Sparkles size={13} /> KI
          </button>
          <button onClick={suchenStarten}
            style={{ padding: "8px 18px 10px", background: "#F4C03F", border: "1px solid #1D1D1D", boxShadow: "inset 0 -3px 0 rgba(29,29,29,.16)", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#1D1D1D", fontFamily: fonts.body, flexShrink: 0 }}>
            Suchen
          </button>
        </div>

        {/* ── Letzte Suchen (Chips) ── */}
        {recents.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: colors.muted }}>Letzte Suchen:</span>
            {recents.map((term) => (
              <button
                key={term}
                onClick={() => { setQuery(term); setPage(1); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                  border: `1.5px solid ${colors.border}`, background: "#fff",
                  fontSize: 13, fontFamily: fonts.body, color: colors.dark, whiteSpace: "nowrap",
                }}
              >
                <Search size={12} color={colors.muted} /> {term}
              </button>
            ))}
            <button
              onClick={() => { clearRecentSearches(); setRecents([]); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.muted, fontFamily: fonts.body, textDecoration: "underline" }}
            >
              löschen
            </button>
          </div>
        )}

        {/* ── Breadcrumbs ── */}
        {mainCatId && (() => {
          const main = mainCats.find(c => c.id === mainCatId);
          const sub = subCats.find(c => c.id === subCatId);
          const subsub = subSubCats.find(c => c.id === subSubCatId);
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 13, flexWrap: "wrap" }}>
              <button onClick={() => { setMainCatId(""); setSubCatId(""); setSubSubCatId(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: colors.teal, fontFamily: fonts.body, fontSize: 13 }}>Alle Kategorien</button>
              {main && <><span style={{ color: colors.mutedLt }}>/</span>
                <button onClick={() => { setSubCatId(""); setSubSubCatId(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: sub ? colors.teal : colors.dark, fontWeight: sub ? 400 : 700, fontFamily: fonts.body, fontSize: 13 }}>{main.name}</button></>}
              {sub && <><span style={{ color: colors.mutedLt }}>/</span>
                <button onClick={() => setSubSubCatId("")} style={{ background: "none", border: "none", cursor: "pointer", color: subsub ? colors.teal : colors.dark, fontWeight: subsub ? 400 : 700, fontFamily: fonts.body, fontSize: 13 }}>{sub.name}</button></>}
              {subsub && <><span style={{ color: colors.mutedLt }}>/</span>
                <span style={{ fontWeight: 700, color: colors.dark }}>{subsub.name}</span></>}
            </div>
          );
        })()}

        {/* ── Page Title + Überrasch-mich (Beta-Feedback Tacocat 08.09.) ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "0 0 20px" }}>
          <h1 className="bd-seitentitel" style={{ fontFamily: fonts.head, fontSize: "clamp(26px, 3.4vw, 32px)", fontWeight: 700, color: INK, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.05, flex: "1 1 auto", minWidth: 0 }}>
            {query ? `Ergebnisse für "${query}"` : mainCatId ? (mainCats.find(c => c.id === mainCatId)?.name || "Suche") : "Alle Inserate"}
          </h1>
          <button onClick={zeigeZufall} disabled={zufallLaedt} style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px",
            borderRadius: 999, border: "1px solid #1D1D1D", background: "#fff",
            fontSize: 13, fontWeight: 700, fontFamily: fonts.body, color: INK,
            cursor: zufallLaedt ? "default" : "pointer", opacity: zufallLaedt ? 0.6 : 1, whiteSpace: "nowrap",
          }}>
            <Shuffle size={14} color={PETROL} /> {zufallLaedt ? "Würfelt..." : "Überrasch mich"}
          </button>
          <RasterUmschalter />
        </div>

        {/* KI-Status (Denis 16.09.: Panel weg, der Schalter im Suchfeld ersetzt es).
            Nur sichtbar, wenn die KI gerade sucht oder etwas zu sagen hat. */}
        {(kiLaedt || kiFehler || kiHinweis || kiAuto) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: kiFehler ? "#FFE2DE" : "#CEF6E8", border: `1px solid ${kiFehler ? "#C62828" : "#1D1D1D33"}`, borderRadius: 20, padding: "10px 14px", marginBottom: 16, fontSize: 13, fontFamily: fonts.body, color: kiFehler ? "#C62828" : PETROL }}>
            <Sparkles size={14} />
            <span style={{ flex: 1 }}>
              {kiLaedt ? "Die KI sucht nach der Bedeutung…" : (kiFehler || kiHinweis || (kiAuto ? `Zu „${kiAuto}“ gab es keine wörtlichen Treffer. Die KI hat nach der Bedeutung gesucht.` : ""))}
            </span>
            {!kiLaedt && <button onClick={() => { setKiFehler(""); setKiHinweis(""); setKiAuto(""); }} aria-label="Schliessen" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}><X size={14} /></button>}
          </div>
        )}

        {/* ── Filter: Pillen am Desktop, Seitenleiste am Handy (components/search/SuchFilter.jsx) ── */}
        <SuchFilter f={{
          categories, mainCatId, subCatId, subSubCatId,
          setMainCat: v => { setMainCatId(v); setSubCatId(""); setSubSubCatId(""); setPage(1); },
          setSubCat: v => { setSubCatId(v); setSubSubCatId(""); setPage(1); },
          setSubSubCat: v => { setSubSubCatId(v); setPage(1); },
          type, setType: v => { setType(v); setPage(1); },
          condition, setCondition: v => { setCondition(v); setPage(1); },
          delivery, setDelivery: v => { setDelivery(v); setPage(1); },
          verifiedOnly, setVerifiedOnly: v => { setVerifiedOnly(v); setPage(1); },
          minPrice, maxPrice, setMinPrice, setMaxPrice,
          categoryAttrs, attrFilters, setAttr: (k, v) => { setAttrFilters(prev => ({ ...prev, [k]: v })); setPage(1); },
          typeOpts, conditionOpts, deliveryOpts,
          total, loading, activeFilterCount,
          apply: (preis) => { setPage(1); doSearch(preis && typeof preis === "object" ? preis : {}); },
          resetAll: () => {
            setMainCatId(""); setSubCatId(""); setSubSubCatId(""); setCondition(""); setType("");
            setMinPrice(""); setMaxPrice(""); setCity(""); setDelivery(""); setVerifiedOnly(false); setAttrFilters({}); setPage(1);
          },
        }} />

        {/* ── Toolbar: Results + Sort ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, color: colors.muted }}>
              <b style={{ color: colors.dark }}>{total}</b> Ergebnisse
            </span>
            {activeFilterCount > 0 && (
              <button onClick={() => {
                setMainCatId(""); setSubCatId(""); setSubSubCatId(""); setCondition(""); setType("");
                setMinPrice(""); setMaxPrice(""); setCity(""); setDelivery(""); setVerifiedOnly(false); setAttrFilters({}); setPage(1);
              }} style={{ fontSize: 13, fontWeight: 600, color: colors.teal, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                <X size={13} /> Alle Filter zurücksetzen
              </button>
            )}
            {/* Suche speichern: Begriff und/oder Kategorie merken, der stuendliche
                Matcher meldet neue Treffer (Schalter search_new_match) */}
            {user && (query.trim() || mainCatId) && (
              <button onClick={async () => {
                if (searchSaved) return;
                try {
                  await saveSearch(user.id, query, subSubCatId || subCatId || mainCatId || null);
                  setSearchSaved(true);
                  setTimeout(() => setSearchSaved(false), 4000);
                } catch (e) { console.error("saveSearch:", e); }
              }} style={{
                fontSize: 13, fontWeight: 700, color: searchSaved ? "#50804F" : colors.teal,
                background: "none", border: `1.5px solid ${searchSaved ? "#50804F" : colors.teal}`,
                padding: "5px 10px", borderRadius: 20, cursor: searchSaved ? "default" : "pointer",
                fontFamily: fonts.body, whiteSpace: "nowrap",
              }}>
                {searchSaved ? "Gespeichert. Wir melden neue Treffer." : "Suche speichern"}
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: colors.muted }}>Sortiert nach:</span>
            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
              style={{
                padding: "6px 28px 6px 10px", border: "none", background: "transparent",
                fontSize: 13, fontWeight: 700, color: colors.teal, fontFamily: fonts.body,
                cursor: "pointer", appearance: "none", outline: "none",
              }}>
              {SORT_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Offenlegung der Rangkriterien: die Bee-Rate beeinflusst die Reihenfolge,
            das gehoert sichtbar dorthin, wo sortiert wird. */}
        {sortBy === "relevanz" && (
          <p style={{ margin: "0 0 14px", fontSize: 11.5, color: colors.muted, fontFamily: fonts.body }}>
            Relevanz berücksichtigt Aktualität und die vom Verkäufer gewählte Bee-Rate.
            Eine höhere Bee-Rate schiebt ein Inserat so weit nach oben, als wäre es bis zu 14 Tage neuer.
          </p>
        )}

        {/* ── Results Grid ── */}
        {loading ? (
          <div className="search-results-grid" style={{ display: "grid", gap: 16 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: radius.md, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
                <div className="bd-fx-skel" style={{ aspectRatio: "1/1", background: colors.warm }} />
                <div style={{ padding: 14 }}>
                  <div className="bd-fx-skel" style={{ height: 14, background: colors.warm, borderRadius: 20, width: "75%", marginBottom: 8 }} />
                  <div className="bd-fx-skel" style={{ height: 18, background: colors.warm, borderRadius: 20, width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="search-results-grid" style={{ display: "grid", gap: 16 }}>
              {results.map(l => <ListingCard key={l.id} listing={l} userId={user?.id} boost={boosts[l.id]} />)}
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 32 }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    style={{
                      width: 36, height: 36, borderRadius: 20, fontSize: 14, fontWeight: 600,
                      fontFamily: fonts.body, border: "none", cursor: "pointer",
                      background: page === i + 1 ? colors.dark : "transparent",
                      color: page === i + 1 ? "#fff" : colors.muted,
                    }}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Search size={32} color="#1D1D1D" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 22, fontFamily: fonts.head, fontWeight: 600, marginBottom: 4, color: colors.dark }}>Nichts gefunden</h3>
            <p style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>{query.trim() ? "Zu diesem Wortlaut ist nichts inseriert. Die KI kann nach der Bedeutung suchen." : "Andere Suchbegriffe probieren oder die Filter zurücksetzen."}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {query.trim() && (
                <button onClick={kiNachfassen} disabled={kiLaedt} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 20, background: PETROL, color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: fonts.body }}>
                  <Sparkles size={15} /> {kiLaedt ? "KI sucht…" : "Mit KI suchen"}
                </button>
              )}
              <a href="/search" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 999, background: "#F4C03F", color: "#1D1D1D", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Alle Inserate ansehen</a>
              <a href="/search" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 999, background: "#fff", border: "1px solid #1D1D1D", color: INK, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Filter zurücksetzen</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
