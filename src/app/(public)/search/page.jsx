"use client"
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, ChevronDown, BadgeCheck } from "lucide-react";
import { searchListings, getCategories, saveSearch } from "@/lib/listings";
import { getFilterableAttributes, filterListingsByAttributes } from "@/lib/api/attributes";
import { colors, fonts, radius } from "@/lib/theme";
import { CONDITIONS, LISTING_TYPES } from "@/lib/constants";
import { ListingCard } from "@/components/shared/ListingCard";
import { getRecentSearches, recordSearch, clearRecentSearches } from "@/lib/recentSearches";
import { getActiveBoosts } from "@/lib/gamification";

// ── Katalog-Design-Tokens (Hero/ListingCard-konsistent) ──
const INK = "#14110D";
const PAPER = "#FFFFFF";
const PETROL = "#0B5E5C";
const MONO = "'Manrope', sans-serif";

const SORT_OPTS = [
  { value: "relevanz", label: "Relevanz" },
  { value: "newest", label: "Neueste" },
  { value: "price_asc", label: "Preis aufsteigend" },
  { value: "price_desc", label: "Preis absteigend" },
  { value: "endet_bald", label: "Endet bald" },
  { value: "meiste_gebote", label: "Meiste Gebote" },
];

// ── Filter Pill Dropdown ─────────────────────────────────────
function FilterPill({ label, value, options, onChange, active }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayLabel = active ? options.find(o => o.value === value)?.label || label : label;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 10,
          border: active ? "1.5px solid #0E9493" : "1.5px solid #d8d4cd",
          background: active ? "#E6F5F5" : "#fff",
          color: active ? "#0A7170" : INK,
          fontSize: 13, fontWeight: active ? 700 : 500,
          fontFamily: fonts.body, cursor: "pointer",
          transition: "all .15s", whiteSpace: "nowrap",
        }}
      >
        {displayLabel}
        {active ? (
          <X size={13} onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false); }} style={{ cursor: "pointer" }} />
        ) : (
          <ChevronDown size={13} style={{ opacity: 0.5 }} />
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
          background: "#fff", borderRadius: 10,
          boxShadow: "0 8px 30px rgba(20,17,13,.14)", border: "1px solid #E4E0D8",
          minWidth: 180, maxHeight: 280, overflowY: "auto",
          padding: "6px 0",
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: "block", width: "100%", padding: "9px 16px",
                background: value === opt.value ? "#F0FAFA" : "transparent",
                border: "none", cursor: "pointer", textAlign: "left",
                fontSize: 13, fontFamily: fonts.body, color: colors.dark,
                fontWeight: value === opt.value ? 700 : 400,
                transition: "background .1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8f6f3"}
              onMouseLeave={e => e.currentTarget.style.background = value === opt.value ? "#F0FAFA" : "transparent"}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [results, setResults] = useState([]);
  const [boosts, setBoosts] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);

  const [query, setQuery] = useState(searchParams.get("q") || "");
  // Draft fuer die mobile Suchzeile (Desktop sucht im Header)
  const [draft, setDraft] = useState(searchParams.get("q") || "");
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
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [city, setCity] = useState("");
  const [delivery, setDelivery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verified") === "1");
  const [sortBy, setSortBy] = useState("relevanz");
  const [page, setPage] = useState(1);
  const [categoryAttrs, setCategoryAttrs] = useState([]);
  const [attrFilters, setAttrFilters] = useState({});
  const [showPrice, setShowPrice] = useState(false);
  const [recents, setRecents] = useState([]);
  const [searchSaved, setSearchSaved] = useState(false);
  const priceRef = useRef(null);

  useEffect(() => { setRecents(getRecentSearches()); }, []);
  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null)); }, []);
  useEffect(() => { getCategories().then(setCategories).catch(console.error); }, []);
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== query) { setQuery(q); setDraft(q); }
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

  // Close price dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (priceRef.current && !priceRef.current.contains(e.target)) setShowPrice(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const mainCats = categories.filter(c => !c.parent_id);
  const subCats = categories.filter(c => c.parent_id === mainCatId);
  const subSubCats = categories.filter(c => c.parent_id === subCatId);

  async function doSearch() {
    setLoading(true);
    try {
      const activeCat = subSubCatId || subCatId || undefined;
      const parentCat = (!activeCat && mainCatId) ? mainCatId : undefined;
      const activeAttrFilters = Object.fromEntries(Object.entries(attrFilters).filter(([_, v]) => v));
      let attrListingIds = null;
      if (Object.keys(activeAttrFilters).length > 0) {
        attrListingIds = await filterListingsByAttributes(activeAttrFilters);
      }
      const res = await searchListings({
        query, category_id: activeCat, parent_category_id: parentCat,
        listing_type: type || undefined, condition: condition || undefined,
        min_price: minPrice || undefined, max_price: maxPrice || undefined,
        city: city || undefined, sort: sortBy, page, per_page: 24,
        delivery: delivery || undefined, listing_ids: attrListingIds,
        verified_only: verifiedOnly || undefined,
      });
      setResults(res.listings);
      setTotal(res.total);
      getActiveBoosts((res.listings || []).map(l => l.id)).then(setBoosts).catch(() => {});
      if (query.trim()) { recordSearch(query); setRecents(getRecentSearches()); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const totalPages = Math.ceil(total / 24);
  const activeFilterCount = [mainCatId, condition, type, minPrice || maxPrice, city, delivery, verifiedOnly, ...Object.values(attrFilters)].filter(Boolean).length;

  const categoryOpts = [{ value: "", label: "Alle Kategorien" }, ...mainCats.map(c => ({ value: c.id, label: c.name }))];
  const subCatOpts = subCats.length > 0 ? [{ value: "", label: "Alle" }, ...subCats.map(c => ({ value: c.id, label: c.name }))] : [];
  const conditionOpts = CONDITIONS.map(c => ({ value: c.value, label: c.label }));
  const typeOpts = LISTING_TYPES.map(t => ({ value: t.value, label: t.label }));
  const deliveryOpts = [{ value: "shipping", label: "Versand" }, { value: "pickup", label: "Abholung" }];

  return (
    <div style={{ minHeight: "100vh", fontFamily: fonts.body, background: "#FFFFFF" }}>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 24px 48px" }}>

        {/* ── Mobile Suchzeile (Desktop sucht im Header, Klasse blendet ein/aus) ── */}
        <div className="search-mobile-bar" style={{ background: "#F2EEE7", borderRadius: 999, padding: 4, alignItems: "center", marginBottom: 14 }}>
          <Search size={16} style={{ marginLeft: 12, color: "#999", flexShrink: 0, alignSelf: "center" }} />
          <input
            type="text" value={draft} autoFocus={!query}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setQuery(draft.trim()); setPage(1); e.target.blur(); } }}
            placeholder="Was suchst du?"
            style={{ flex: 1, minWidth: 0, padding: "10px 10px", border: "none", outline: "none", fontSize: 15, fontFamily: fonts.body, background: "transparent" }}
          />
          {draft && (
            <button onClick={() => { setDraft(""); setQuery(""); setPage(1); }} aria-label="Suche leeren"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", display: "flex", alignItems: "center" }}>
              <X size={16} color="#999" />
            </button>
          )}
          <button onClick={() => { setQuery(draft.trim()); setPage(1); }}
            style={{ padding: "9px 18px", background: "#F4C03F", border: "none", borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 14, color: INK, fontFamily: fonts.body, flexShrink: 0 }}>
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
                  padding: "6px 12px", borderRadius: 10, cursor: "pointer",
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

        {/* ── Page Title ── */}
        <h1 style={{ fontFamily: fonts.head, fontSize: "clamp(26px, 3.4vw, 32px)", fontWeight: 700, color: INK, margin: "0 0 20px", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
          {query ? `Ergebnisse für "${query}"` : mainCatId ? (mainCats.find(c => c.id === mainCatId)?.name || "Suche") : "Alle Inserate"}
        </h1>

        {/* ── Filter Pills Row ── */}
        <div style={{
          background: "#fff", borderRadius: 10, border: "1px solid #E4E0D8",
          padding: "16px 18px", marginBottom: 20,
        }}>
          {/* Row 1: Main filters */}
          <div className="filter-row" style={{ marginBottom: 8 }}>
            <FilterPill
              label="Kategorie"
              value={mainCatId}
              active={!!mainCatId}
              options={categoryOpts}
              onChange={v => { setMainCatId(v); setSubCatId(""); setSubSubCatId(""); setPage(1); }}
            />
            {subCatOpts.length > 0 && (
              <FilterPill
                label="Unterkategorie"
                value={subCatId}
                active={!!subCatId}
                options={subCatOpts}
                onChange={v => { setSubCatId(v); setSubSubCatId(""); setPage(1); }}
              />
            )}
            {subSubCats.length > 0 && (
              <FilterPill
                label="Weitere"
                value={subSubCatId}
                active={!!subSubCatId}
                options={[{ value: "", label: "Alle" }, ...subSubCats.map(c => ({ value: c.id, label: c.name }))]}
                onChange={v => { setSubSubCatId(v); setPage(1); }}
              />
            )}

            {/* Price dropdown */}
            <div ref={priceRef} style={{ position: "relative" }}>
              <button onClick={() => setShowPrice(!showPrice)} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                border: (minPrice || maxPrice) ? "1.5px solid #0E9493" : "1.5px solid #d8d4cd",
                background: (minPrice || maxPrice) ? "#E6F5F5" : "#fff",
                color: (minPrice || maxPrice) ? "#0A7170" : INK,
                fontSize: 13, fontWeight: (minPrice || maxPrice) ? 700 : 500,
                fontFamily: fonts.body, cursor: "pointer", whiteSpace: "nowrap",
              }}>
                {(minPrice || maxPrice) ? `CHF ${minPrice || "0"} – ${maxPrice || "∞"}` : "Preis"}
                {(minPrice || maxPrice) ? (
                  <X size={13} onClick={(e) => { e.stopPropagation(); setMinPrice(""); setMaxPrice(""); setShowPrice(false); setPage(1); }} />
                ) : <ChevronDown size={13} style={{ opacity: 0.5 }} />}
              </button>
              {showPrice && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
                  background: "#fff", borderRadius: 10, boxShadow: "0 8px 30px rgba(20,17,13,.14)",
                  border: "1px solid #E4E0D8", padding: 16, width: 220,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 8 }}>Preis (CHF)</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <input type="number" placeholder="Von" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                      style={{ flex: 1, padding: "8px 10px", border: "1.5px solid #e0ddd8", borderRadius: 10, fontSize: 13, fontFamily: fonts.body, outline: "none", width: "100%" }} />
                    <input type="number" placeholder="Bis" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                      style={{ flex: 1, padding: "8px 10px", border: "1.5px solid #e0ddd8", borderRadius: 10, fontSize: 13, fontFamily: fonts.body, outline: "none", width: "100%" }} />
                  </div>
                  <button onClick={() => { doSearch(); setShowPrice(false); }} style={{
                    width: "100%", padding: "8px", background: colors.teal, color: "#fff",
                    border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer",
                  }}>Anwenden</button>
                </div>
              )}
            </div>

            <FilterPill label="Zustand" value={condition} active={!!condition} options={conditionOpts} onChange={v => { setCondition(v); setPage(1); }} />
            <FilterPill label="Angebotsart" value={type} active={!!type} options={typeOpts} onChange={v => { setType(v); setPage(1); }} />
            <FilterPill label="Lieferung" value={delivery} active={!!delivery} options={deliveryOpts} onChange={v => { setDelivery(v); setPage(1); }} />
            <button
              onClick={() => { setVerifiedOnly(v => !v); setPage(1); }}
              title="Nur Verkäufer mit geprüftem Ausweis + E-Mail"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                fontFamily: "Manrope, sans-serif", fontSize: 13, fontWeight: 700,
                border: `1px solid ${verifiedOnly ? "#5B8C5A" : "#14110D"}`,
                background: verifiedOnly ? "#EEF4EC" : "#fff",
                color: verifiedOnly ? "#5B8C5A" : "#14110D",
              }}
            >
              <BadgeCheck size={15} color={verifiedOnly ? "#5B8C5A" : "#14110D"} strokeWidth={2.2} /> Verifiziert
            </button>
          </div>

          {/* Row 2: Dynamic category attributes */}
          {categoryAttrs.length > 0 && (
            <div className="filter-row">
              {categoryAttrs.map(attr => {
                if (attr.attribute_type !== "select" || !attr.options) return null;
                const opts = (Array.isArray(attr.options) ? attr.options : []).map(o => ({ value: o, label: o }));
                return (
                  <FilterPill
                    key={attr.id}
                    label={attr.name}
                    value={attrFilters[attr.attribute_key] || ""}
                    active={!!attrFilters[attr.attribute_key]}
                    options={opts}
                    onChange={v => {
                      setAttrFilters(prev => ({ ...prev, [attr.attribute_key]: v }));
                      setPage(1);
                      // Suche läuft via useEffect-Dependency auf attrFilters (frischer State)
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

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
                fontSize: 13, fontWeight: 700, color: searchSaved ? "#5B8C5A" : colors.teal,
                background: "none", border: `1.5px solid ${searchSaved ? "#5B8C5A" : colors.teal}`,
                padding: "5px 10px", borderRadius: 10, cursor: searchSaved ? "default" : "pointer",
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
                <div style={{ aspectRatio: "4/3", background: colors.warm }} />
                <div style={{ padding: 14 }}>
                  <div style={{ height: 14, background: colors.warm, borderRadius: 10, width: "75%", marginBottom: 8 }} />
                  <div style={{ height: 18, background: colors.warm, borderRadius: 10, width: "40%" }} />
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
                      width: 36, height: 36, borderRadius: 10, fontSize: 14, fontWeight: 600,
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
            <Search size={32} color="#ccc" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 22, fontFamily: fonts.head, fontWeight: 600, marginBottom: 4, color: colors.dark }}>Nichts gefunden</h3>
            <p style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>Andere Suchbegriffe probieren oder die Filter zurücksetzen.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/search" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 10, background: INK, color: PAPER, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Alle Inserate ansehen</a>
              <a href="/search" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 10, background: "#fff", border: "1px solid #E4E0D8", color: INK, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Filter zurücksetzen</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
