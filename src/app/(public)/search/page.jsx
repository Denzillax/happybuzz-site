"use client"
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { searchListings, getCategories } from "@/lib/listings";
import { colors, fonts, radius } from "@/lib/theme";
import { CONDITIONS, LISTING_TYPES } from "@/lib/constants";
import { ListingCard } from "@/components/shared/ListingCard";

const SORT_OPTS = [
  { value: "relevanz", label: "Relevanz" },
  { value: "newest", label: "Neueste" },
  { value: "price_asc", label: "Preis ↑" },
  { value: "price_desc", label: "Preis ↓" },
  { value: "endet_bald", label: "Endet bald" },
  { value: "meiste_gebote", label: "Meiste Gebote" },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState(null);

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [mainCatId, setMainCatId] = useState(searchParams.get("category") || "");
  const [subCatId, setSubCatId] = useState("");
  const [subSubCatId, setSubSubCatId] = useState("");
  const [type, setType] = useState("all");
  const [condition, setCondition] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [city, setCity] = useState("");
  const [umkreis, setUmkreis] = useState("");
  const [delivery, setDelivery] = useState("");
  const [sortBy, setSortBy] = useState("relevanz");
  const [page, setPage] = useState(1);

  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null)); }, []);
  useEffect(() => { getCategories().then(setCategories).catch(console.error); }, []);
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== query) setQuery(q);
    const cat = searchParams.get("category");
    if (cat && categories.length > 0) {
      const found = categories.find(c => c.id === cat || c.slug === cat);
      if (found) { setMainCatId(found.parent_id || found.id); if (found.parent_id) setSubCatId(found.id); }
    }
  }, [searchParams, categories]);

  useEffect(() => { doSearch(); }, [query, type, subCatId, subSubCatId, mainCatId, condition, sortBy, page, delivery]);

  const mainCats = categories.filter(c => !c.parent_id);
  const subCats = categories.filter(c => c.parent_id === mainCatId);
  const subSubCats = categories.filter(c => c.parent_id === subCatId);

  async function doSearch() {
    setLoading(true);
    try {
      const activeCat = subSubCatId || subCatId || undefined;
      const parentCat = (!activeCat && mainCatId) ? mainCatId : undefined;
      const res = await searchListings({
        query, category_id: activeCat,
        parent_category_id: parentCat,
        listing_type: type === "all" ? undefined : type,
        condition: condition || undefined,
        min_price: minPrice || undefined, max_price: maxPrice || undefined,
        city: city || undefined, sort: sortBy, page, per_page: 24,
        delivery: delivery || undefined,
      });
      setResults(res.listings);
      setTotal(res.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const tabs = [{ key: "all", label: "Alle" }, ...LISTING_TYPES.map(t => ({ key: t.value, label: t.label }))];
  const totalPages = Math.ceil(total / 24);
  const filterCount = [mainCatId, subCatId, condition, minPrice, maxPrice, city, delivery].filter(Boolean).length;

  const inputStyle = { width: "100%", padding: "10px 14px", background: colors.surface, border: `1.5px solid ${colors.border}`, borderRadius: radius.sm, fontSize: 14, fontFamily: fonts.body, color: colors.dark, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, fontFamily: fonts.body, color: colors.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6, display: "block" };

  return (
    <div style={{ minHeight: "100vh", fontFamily: fonts.body, background: colors.cream }}>
      {/* Type Tabs */}
      <div style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "16px 32px" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => { setType(t.key); setPage(1); }}
                style={{ padding: "8px 18px", fontSize: 14, fontWeight: type === t.key ? 700 : 500, fontFamily: fonts.body,
                  color: type === t.key ? colors.dark : colors.muted,
                  background: type === t.key ? colors.yellowSoft : "transparent",
                  border: type === t.key ? `1.5px solid ${colors.yellow}` : "1.5px solid transparent",
                  borderRadius: radius.sm, cursor: "pointer", transition: "all .15s" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 32px 48px" }}>

        {/* Category Breadcrumbs */}
        {mainCatId && (() => {
          const main = mainCats.find(c => c.id === mainCatId);
          const sub = subCats.find(c => c.id === subCatId);
          const subsub = subSubCats.find(c => c.id === subSubCatId);
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 13, fontFamily: fonts.body, flexWrap: "wrap" }}>
              <button onClick={() => { setMainCatId(""); setSubCatId(""); setSubSubCatId(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: colors.blue, fontFamily: fonts.body, fontSize: 13 }}>Alle Kategorien</button>
              {main && <>
                <span style={{ color: colors.mutedLt }}>/</span>
                <button onClick={() => { setSubCatId(""); setSubSubCatId(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: sub ? colors.blue : colors.dark, fontWeight: sub ? 400 : 700, fontFamily: fonts.body, fontSize: 13 }}>{main.name}</button>
              </>}
              {sub && <>
                <span style={{ color: colors.mutedLt }}>/</span>
                <button onClick={() => { setSubSubCatId(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: subsub ? colors.blue : colors.dark, fontWeight: subsub ? 400 : 700, fontFamily: fonts.body, fontSize: 13 }}>{sub.name}</button>
              </>}
              {subsub && <>
                <span style={{ color: colors.mutedLt }}>/</span>
                <span style={{ fontWeight: 700, color: colors.dark }}>{subsub.name}</span>
              </>}
            </div>
          );
        })()}

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontFamily: fonts.body, color: colors.muted }}><b style={{ color: colors.dark }}>{total}</b> Ergebnisse</span>
            {filterCount > 0 && (
              <button onClick={() => { setMainCatId(""); setSubCatId(""); setSubSubCatId(""); setCondition(""); setMinPrice(""); setMaxPrice(""); setCity(""); setUmkreis(""); setDelivery(""); setPage(1); }}
                style={{ fontSize: 13, fontWeight: 600, fontFamily: fonts.body, color: colors.yellow, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                <X size={13} /> Zurücksetzen
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setShowFilters(!showFilters)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: showFilters ? colors.yellowSoft : colors.surface, border: `1.5px solid ${showFilters ? colors.yellow : colors.border}`, borderRadius: radius.sm, fontSize: 13, fontWeight: 600, fontFamily: fonts.body, color: colors.dark, cursor: "pointer" }}>
              <SlidersHorizontal size={15} /> Filter
              {filterCount > 0 && <span style={{ width: 20, height: 20, borderRadius: 4, background: colors.yellow, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{filterCount}</span>}
            </button>
            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
              style={{ ...inputStyle, width: "auto", padding: "8px 36px 8px 12px", fontSize: 13, cursor: "pointer", appearance: "none" }}>
              {SORT_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {/* Filter Panel */}
          {showFilters && (
            <div className="search-filter-panel" style={{ width: 260, flexShrink: 0 }}>
              <div style={{ background: colors.surface, borderRadius: radius.md, border: `1px solid ${colors.border}`, padding: 20, position: "sticky", top: 90 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, fontFamily: fonts.head, color: colors.dark }}>Filter</span>
                  <button onClick={() => setShowFilters(false)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.muted, padding: 2 }}><X size={16} /></button>
                </div>
                <label style={labelStyle}>Kategorie</label>
                <select style={{ ...inputStyle, cursor: "pointer", appearance: "none" }} value={mainCatId} onChange={e => { setMainCatId(e.target.value); setSubCatId(""); setSubSubCatId(""); setPage(1); }}>
                  <option value="">Alle Kategorien</option>
                  {mainCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {subCats.length > 0 && (
                  <select style={{ ...inputStyle, marginTop: 8, cursor: "pointer", appearance: "none" }} value={subCatId} onChange={e => { setSubCatId(e.target.value); setSubSubCatId(""); setPage(1); }}>
                    <option value="">Alle Unterkategorien</option>
                    {subCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                {subSubCats.length > 0 && (
                  <select style={{ ...inputStyle, marginTop: 8, cursor: "pointer", appearance: "none" }} value={subSubCatId} onChange={e => { setSubSubCatId(e.target.value); setPage(1); }}>
                    <option value="">Alle</option>
                    {subSubCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                <div style={{ height: 1, background: colors.border, margin: "16px 0", opacity: .5 }} />
                <label style={labelStyle}>Zustand</label>
                <select style={{ ...inputStyle, cursor: "pointer", appearance: "none" }} value={condition} onChange={e => { setCondition(e.target.value); setPage(1); }}>
                  <option value="">Alle</option>
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <div style={{ height: 1, background: colors.border, margin: "16px 0", opacity: .5 }} />
                <label style={labelStyle}>Preis (CHF)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input style={inputStyle} type="number" placeholder="Von" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                  <input style={inputStyle} type="number" placeholder="Bis" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                </div>
                <div style={{ height: 1, background: colors.border, margin: "16px 0", opacity: .5 }} />
                <label style={labelStyle}>Ort + Umkreis</label>
                <input style={inputStyle} placeholder="z.B. Luzern" value={city} onChange={e => setCity(e.target.value)} />
                <select style={{ ...inputStyle, marginTop: 8, cursor: "pointer", appearance: "none" }} value={umkreis} onChange={e => setUmkreis(e.target.value)}>
                  <option value="">Ganze Schweiz</option>
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                  <option value="50">50 km</option>
                  <option value="100">100 km</option>
                </select>
                <div style={{ height: 1, background: colors.border, margin: "16px 0", opacity: .5 }} />
                <label style={labelStyle}>Lieferung</label>
                <select style={{ ...inputStyle, cursor: "pointer", appearance: "none" }} value={delivery} onChange={e => { setDelivery(e.target.value); setPage(1); }}>
                  <option value="">Alle</option>
                  <option value="shipping">Versand</option>
                  <option value="pickup">Abholung</option>
                </select>
                <div style={{ height: 1, background: colors.border, margin: "16px 0", opacity: .5 }} />
                <label style={labelStyle}>Angebotsart</label>
                <select style={{ ...inputStyle, cursor: "pointer", appearance: "none" }} value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
                  <option value="all">Alle</option>
                  <option value="sell">Festpreis</option>
                  <option value="auction">Auktion</option>
                  <option value="rent">Vermietung</option>
                  <option value="service">Service</option>
                  <option value="free">Gratis</option>
                </select>
                <button onClick={doSearch}
                  style={{ width: "100%", marginTop: 18, padding: "11px 20px", background: colors.teal, color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: fonts.body, border: "none", borderRadius: radius.sm, cursor: "pointer" }}>
                  Anwenden
                </button>
              </div>
            </div>
          )}

          {/* Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{ background: colors.surface, borderRadius: radius.md, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
                    <div style={{ aspectRatio: "4/3", background: colors.warm }} />
                    <div style={{ padding: 14 }}>
                      <div style={{ height: 14, background: colors.warm, borderRadius: 4, width: "75%", marginBottom: 8 }} />
                      <div style={{ height: 18, background: colors.warm, borderRadius: 4, width: "40%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                  {results.map(l => <ListingCard key={l.id} listing={l} userId={user?.id} />)}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 32 }}>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button key={i} onClick={() => setPage(i + 1)}
                        style={{ width: 36, height: 36, borderRadius: radius.sm, fontSize: 14, fontWeight: 600, fontFamily: fonts.body, border: "none", cursor: "pointer",
                          background: page === i + 1 ? colors.dark : "transparent", color: page === i + 1 ? "#fff" : colors.muted }}>
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
                <p style={{ fontSize: 14, fontFamily: fonts.body, color: colors.muted }}>Andere Suchbegriffe probieren. Oder einfach stöbern.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
