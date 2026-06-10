"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { getUserListings, deleteListing } from "@/lib/listings";
import Link from "next/link";
import { Package, Plus, Eye, Clock, CheckCircle, XCircle, Pencil, ArchiveRestore, Heart, Trash2, Gavel, Pause, Play, ChevronDown, ArrowUpDown, Copy } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { TypeBadge } from "@/components/shared/Badge";

const STATUS_CONFIG = {
  active:   { label: "Aktiv", color: colors.green, icon: CheckCircle },
  draft:    { label: "Entwurf", color: colors.muted, icon: Clock },
  paused:   { label: "Pausiert", color: "#E5A100", icon: Pause },
  sold:     { label: "Verkauft", color: colors.blue, icon: CheckCircle },
  rented:   { label: "Vermietet", color: colors.blue, icon: CheckCircle },
  inactive: { label: "Inaktiv", color: colors.muted, icon: XCircle },
  archived: { label: "Archiviert", color: colors.muted, icon: ArchiveRestore },
};

const PAGE_SIZE = 25;

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [deleteId, setDeleteId] = useState(null);
  const [bidCounts, setBidCounts] = useState({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState(new Set());
  const [batchAction, setBatchAction] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "/login"; return; }
        const items = await getUserListings(user.id);
        setListings(items);
        const auctionIds = items.filter(l => l.listing_type === "auction").map(l => l.id);
        if (auctionIds.length > 0) {
          const { data: historyBids } = await supabase.from("bid_history").select("listing_id").in("listing_id", auctionIds);
          const countMap = {};
          auctionIds.forEach(id => { countMap[id] = { count: 0, topBid: 0 }; });
          (historyBids || []).forEach(b => { countMap[b.listing_id].count++; });
          if (historyBids?.length === 0) {
            const { data: bidsAlt } = await supabase.from("bids").select("listing_id").in("listing_id", auctionIds);
            (bidsAlt || []).forEach(b => { countMap[b.listing_id].count++; });
          }
          const { data: topBids } = await supabase.from("bids").select("listing_id, amount").in("listing_id", auctionIds).order("amount", { ascending: false });
          (topBids || []).forEach(b => { if (countMap[b.listing_id] && !countMap[b.listing_id].topBid) countMap[b.listing_id].topBid = b.amount; });
          setBidCounts(countMap);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const fmtPrice = (p) => (parseFloat(p) || 0).toLocaleString("de-CH", { minimumFractionDigits: 2 });
  const fmtDate = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" });

  // Filter
  let filtered = listings.filter((l) => filter === "all" || l.status === filter);
  if (typeFilter !== "all") filtered = filtered.filter(l => l.listing_type === typeFilter);

  // Sort — status priority first (active/paused on top, sold/archived bottom)
  const statusPriority = { active: 0, paused: 1, draft: 2, rented: 3, sold: 4, expired: 5, archived: 6, inactive: 7 };
  filtered = [...filtered].sort((a, b) => {
    const sp = (statusPriority[a.status] ?? 9) - (statusPriority[b.status] ?? 9);
    if (sp !== 0) return sp;
    if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === "views") return (b.view_count || 0) - (a.view_count || 0);
    if (sortBy === "bids") return ((bidCounts[b.id]?.count || 0) - (bidCounts[a.id]?.count || 0));
    if (sortBy === "price_high") return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    if (sortBy === "price_low") return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
    return 0;
  });

  const totalFiltered = filtered.length;
  const paginated = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < totalFiltered;

  const counts = {
    all: listings.length,
    active: listings.filter(l => l.status === "active").length,
    sold: listings.filter(l => l.status === "sold").length,
    paused: listings.filter(l => l.status === "paused").length,
    draft: listings.filter(l => l.status === "draft").length,
  };

  const FILTERS = [
    { key: "all", label: `Alle (${counts.all})` },
    { key: "active", label: `Aktiv (${counts.active})` },
    { key: "sold", label: `Verkauft (${counts.sold})` },
    ...(counts.paused > 0 ? [{ key: "paused", label: `Pausiert (${counts.paused})` }] : []),
    ...(counts.draft > 0 ? [{ key: "draft", label: `Entwürfe (${counts.draft})` }] : []),
  ];

  // Batch actions
  const toggleSelect = (id) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map(l => l.id)));
  };

  const handleBatchAction = async (action) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBatchAction(action);
    try {
      if (action === "pause") {
        await supabase.from("listings").update({ status: "paused" }).in("id", ids);
        setListings(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: "paused" } : l));
      } else if (action === "activate") {
        await supabase.from("listings").update({ status: "active" }).in("id", ids);
        setListings(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: "active" } : l));
      } else if (action === "delete") {
        for (const id of ids) {
          if (!bidCounts[id]?.count) await deleteListing(id);
        }
        setListings(prev => prev.filter(l => !ids.includes(l.id) || bidCounts[l.id]?.count > 0));
      }
      setSelected(new Set());
    } catch (err) { console.error(err); }
    finally { setBatchAction(null); }
  };

  // Quick toggle pause/activate
  const togglePause = async (l) => {
    const newStatus = l.status === "paused" ? "active" : "paused";
    await supabase.from("listings").update({ status: newStatus }).eq("id", l.id);
    setListings(prev => prev.map(x => x.id === l.id ? { ...x, status: newStatus } : x));
  };

  const colHead = { fontSize: 12, fontWeight: 600, color: colors.muted, padding: "12px 10px", textAlign: "left", borderBottom: `1px solid ${colors.border}` };
  const selectStyle = { padding: "7px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1.5px solid ${colors.border}`, background: colors.surface, color: colors.dark, fontFamily: fonts.body, cursor: "pointer", outline: "none" };

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 4px", fontFamily: fonts.head, letterSpacing: ".03em" }}>MEINE INSERATE</h1>
            <p style={{ fontSize: 13, color: colors.mutedLt, margin: 0 }}>{counts.all} Inserate · {counts.active} aktiv</p>
          </div>
          <Link href="/listings/new" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: radius.sm, background: colors.yellow, color: colors.dark, fontSize: 14, fontWeight: 700, fontFamily: fonts.body, textDecoration: "none" }}>
            <Plus size={16} /> Neues Inserat
          </Link>
        </div>

        {/* Status Filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setVisibleCount(PAGE_SIZE); }} style={{
              padding: "7px 14px", borderRadius: radius.sm, fontSize: 12, fontWeight: filter === f.key ? 700 : 500,
              cursor: "pointer", fontFamily: fonts.body, border: `1.5px solid ${filter === f.key ? colors.yellow : colors.border}`,
              background: filter === f.key ? colors.yellowSoft : colors.surface, color: filter === f.key ? colors.dark : colors.muted,
            }}>{f.label}</button>
          ))}
        </div>

        {/* Type + Sort row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setVisibleCount(PAGE_SIZE); }} style={selectStyle}>
            <option value="all">Alle Typen</option>
            <option value="sell">Festpreis</option>
            <option value="auction">Auktion</option>
            <option value="rent">Vermietung</option>
            <option value="service">Service</option>
            <option value="free">Gratis</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
            <option value="views">Meiste Aufrufe</option>
            <option value="bids">Meiste Gebote</option>
            <option value="price_high">Preis hoch → tief</option>
            <option value="price_low">Preis tief → hoch</option>
          </select>
          <span style={{ fontSize: 12, color: colors.muted, marginLeft: "auto" }}>{totalFiltered} Ergebnisse</span>
        </div>

        {/* Batch Actions Bar */}
        {selected.size > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", marginBottom: 12,
            background: colors.yellowSoft, borderRadius: 8, border: `1.5px solid ${colors.yellow}`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{selected.size} ausgewählt</span>
            <button onClick={() => handleBatchAction("pause")} disabled={!!batchAction}
              style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", background: "#FFF3E0", color: "#E65100", cursor: "pointer", fontFamily: fonts.body, display: "flex", alignItems: "center", gap: 4 }}>
              <Pause size={12} /> Pausieren
            </button>
            <button onClick={() => handleBatchAction("activate")} disabled={!!batchAction}
              style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", background: "#E8F5E9", color: "#2E7D32", cursor: "pointer", fontFamily: fonts.body, display: "flex", alignItems: "center", gap: 4 }}>
              <Play size={12} /> Aktivieren
            </button>
            <button onClick={() => { if (confirm(`${selected.size} Inserate löschen?`)) handleBatchAction("delete"); }} disabled={!!batchAction}
              style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, border: "none", background: "#FFEBEE", color: "#c62828", cursor: "pointer", fontFamily: fonts.body, display: "flex", alignItems: "center", gap: 4 }}>
              <Trash2 size={12} /> Löschen
            </button>
            <button onClick={() => setSelected(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.muted, fontFamily: fonts.body }}>
              Auswahl aufheben
            </button>
          </div>
        )}

        {loading && <div style={{ textAlign: "center", padding: 60, color: colors.mutedLt }}>Lade...</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <Package size={40} color={colors.mutedLt} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Keine Inserate</p>
            <p style={{ fontSize: 13, color: colors.mutedLt, margin: "0 0 20px" }}>Erstelle dein erstes Inserat.</p>
            <Link href="/listings/new" style={{ display: "inline-flex", padding: "10px 24px", borderRadius: radius.sm, background: colors.yellow, color: colors.dark, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              <Plus size={16} style={{ marginRight: 6 }} /> Inserat erstellen
            </Link>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ ...colHead, width: 36, textAlign: "center" }}>
                    <input type="checkbox" checked={selected.size === paginated.length && paginated.length > 0} onChange={toggleAll}
                      style={{ cursor: "pointer", accentColor: colors.yellow }} />
                  </th>
                  <th style={colHead}>Artikel</th>
                  <th style={colHead}>Erstellt</th>
                  <th style={{ ...colHead, textAlign: "right" }}>Preis</th>
                  <th style={{ ...colHead, textAlign: "center" }}>Aufrufe</th>
                  <th style={{ ...colHead, textAlign: "center" }}>Favoriten</th>
                  <th style={{ ...colHead, textAlign: "center" }}>Gebote</th>
                  <th style={colHead}>Status</th>
                  <th style={{ ...colHead, width: 120, textAlign: "center" }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(l => {
                  const st = STATUS_CONFIG[l.status] || STATUS_CONFIG.active;
                  const StIcon = st.icon;
                  const isSelected = selected.has(l.id);
                  const hasBids = bidCounts[l.id]?.count > 0;
                  return (
                    <tr key={l.id} style={{ borderBottom: `1px solid ${colors.borderLt}`, transition: "background .1s", background: isSelected ? `${colors.yellow}10` : "transparent" }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = colors.cream; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                      {/* Checkbox */}
                      <td style={{ padding: "14px 10px", textAlign: "center", verticalAlign: "middle" }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(l.id)}
                          style={{ cursor: "pointer", accentColor: colors.yellow }} />
                      </td>
                      {/* Artikel */}
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ width: 56, height: 56, borderRadius: 6, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {l.cover_image ? <img src={l.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={20} color={colors.mutedLt} />}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <Link href={`/listing/${l.id}`} style={{ fontSize: 14, fontWeight: 700, color: colors.blue, textDecoration: "none", display: "block", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{l.title}</Link>
                            <div style={{ fontSize: 11, color: colors.muted }}><TypeBadge type={l.listing_type} /></div>
                          </div>
                        </div>
                      </td>
                      {/* Erstellt */}
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        <div style={{ fontSize: 13, color: colors.muted }}>{fmtDate(l.created_at)}</div>
                      </td>
                      {/* Preis */}
                      <td style={{ padding: "14px 10px", textAlign: "right", verticalAlign: "middle", fontWeight: 700, fontSize: 15 }}>
                        {l.listing_type === "free" ? "Gratis" : (l.listing_type === "rent" || l.listing_type === "service") ? `CHF ${fmtPrice(l.rent_price || l.price)} / ${l.rent_period === "hour" ? "Std" : l.rent_period === "day" ? "Tag" : l.rent_period === "week" ? "Wo" : "Mt"}` : `CHF ${fmtPrice(l.price)}`}
                      </td>
                      {/* Aufrufe */}
                      <td style={{ padding: "14px 10px", textAlign: "center", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, color: colors.muted, fontSize: 13 }}>
                          <Eye size={14} /> {l.view_count || 0}
                        </div>
                      </td>
                      {/* Favoriten */}
                      <td style={{ padding: "14px 10px", textAlign: "center", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, color: l.favorite_count > 0 ? colors.yellow : colors.muted, fontSize: 13 }}>
                          <Heart size={14} fill={l.favorite_count > 0 ? colors.yellow : "none"} /> {l.favorite_count || 0}
                        </div>
                      </td>
                      {/* Gebote */}
                      <td style={{ padding: "14px 10px", textAlign: "center", verticalAlign: "middle" }}>
                        {l.listing_type === "auction" ? (() => {
                          const bc = bidCounts[l.id] || { count: 0, topBid: 0 };
                          return (
                            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, color: bc.count > 0 ? colors.green : colors.muted, fontSize: 13, fontWeight: bc.count > 0 ? 700 : 400 }}>
                                <Gavel size={14} /> {bc.count}
                              </div>
                              {bc.topBid > 0 && (
                                <div style={{ fontSize: 10, color: colors.green, fontWeight: 600 }}>CHF {fmtPrice(bc.topBid)}</div>
                              )}
                            </div>
                          );
                        })() : <span style={{ color: colors.borderLt, fontSize: 12 }}>—</span>}
                      </td>
                      {/* Status */}
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, color: st.color, fontSize: 12, fontWeight: 600 }}>
                          <StIcon size={14} /> {st.label}
                        </div>
                      </td>
                      {/* Actions — Icon-Only mit Hover-Tooltip */}
                      <td style={{ padding: "14px 6px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
                          {/* Bearbeiten — immer sichtbar */}
                          <Link href={`/listings/${l.id}`} title="Bearbeiten" style={{
                            width: 32, height: 32, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
                            color: colors.blue, background: `${colors.blue}10`, border: "none", textDecoration: "none", transition: "all .15s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = `${colors.blue}20`}
                            onMouseLeave={e => e.currentTarget.style.background = `${colors.blue}10`}>
                            <Pencil size={14} />
                          </Link>
                          {/* Ähnliches Inserat erstellen (Duplikat als Vorlage) */}
                          <Link href={`/listings/new?duplicate=${l.id}`} title="Ähnliches Inserat erstellen" style={{
                            width: 32, height: 32, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
                            color: colors.teal, background: `${colors.teal}10`, border: "none", textDecoration: "none", transition: "all .15s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = `${colors.teal}20`}
                            onMouseLeave={e => e.currentTarget.style.background = `${colors.teal}10`}>
                            <Copy size={14} />
                          </Link>
                          {/* Pausieren / Aktivieren — nur bei active oder paused */}
                          {(l.status === "active" || l.status === "paused") && (
                            <button onClick={() => togglePause(l)} title={l.status === "paused" ? "Aktivieren" : "Pausieren"} style={{
                              width: 32, height: 32, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
                              border: "none", cursor: "pointer", fontFamily: fonts.body, transition: "all .15s",
                              color: l.status === "paused" ? "#2E7D32" : "#E65100",
                              background: l.status === "paused" ? "#E8F5E910" : "#FFF3E0",
                            }}
                              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                              {l.status === "paused" ? <Play size={14} /> : <Pause size={14} />}
                            </button>
                          )}
                          {/* Löschen — nicht bei sold/rented, ausgegraut bei Geboten */}
                          {l.status !== "sold" && l.status !== "rented" && (
                            deleteId === l.id ? (
                              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                <button onClick={async () => { await deleteListing(l.id); setListings(prev => prev.filter(x => x.id !== l.id)); setDeleteId(null); }} title="Bestätigen" style={{
                                  width: 28, height: 28, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  background: "#c62828", border: "none", cursor: "pointer", color: "#fff",
                                }}><CheckCircle size={12} /></button>
                                <button onClick={() => setDeleteId(null)} title="Abbrechen" style={{
                                  width: 28, height: 28, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  background: colors.cream, border: "none", cursor: "pointer", color: colors.muted,
                                }}><XCircle size={12} /></button>
                              </div>
                            ) : (
                              <button onClick={() => { if (!hasBids) setDeleteId(l.id); }}
                                title={hasBids ? "Kann nicht gelöscht werden (aktive Gebote)" : "Löschen"}
                                disabled={hasBids}
                                style={{
                                  width: 32, height: 32, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  border: "none", fontFamily: fonts.body, transition: "all .15s",
                                  color: hasBids ? colors.borderLt : "#c62828",
                                  background: hasBids ? "transparent" : "#FFEBEE",
                                  cursor: hasBids ? "not-allowed" : "pointer",
                                  opacity: hasBids ? 0.5 : 1,
                                }}
                                onMouseEnter={e => { if (!hasBids) e.currentTarget.style.background = "#FFCDD2"; }}
                                onMouseLeave={e => { if (!hasBids) e.currentTarget.style.background = "#FFEBEE"; }}>
                                <Trash2 size={14} />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Load More */}
            {hasMore && (
              <div style={{ textAlign: "center", padding: "16px 0", borderTop: `1px solid ${colors.borderLt}` }}>
                <button onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)} style={{
                  padding: "10px 28px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${colors.border}`, background: colors.surface, color: colors.dark,
                  cursor: "pointer", fontFamily: fonts.body, display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  <ChevronDown size={14} /> Weitere {Math.min(PAGE_SIZE, totalFiltered - visibleCount)} von {totalFiltered} laden
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
