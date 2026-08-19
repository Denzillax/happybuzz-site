"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getUserListings, deleteListing, getListingAnalytics, renewListing, publishScheduledNow } from "@/lib/listings";
import { redeemNektar, NEKTAR_CATALOG } from "@/lib/gamification";
import Link from "next/link";
import { Package, Plus, Eye, Clock, CheckCircle, XCircle, Pencil, ArchiveRestore, Heart, Trash2, Gavel, Pause, Play, ChevronDown, ArrowUpDown, Copy, BarChart3, X, MessageCircle, Rocket, RefreshCw } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { TypeBadge } from "@/components/shared/Badge";

// Katalog-Tokens (wie öffentliche Seiten)
const K = { ink: "#14110D", sand: "#F9F4EC", paper: "#FBF8F2", honey: "#F4C03F", petrol: "#0B5E5C", moss: "#5B8C5A" };
const MONO = "'Space Mono', monospace";

const STATUS_CONFIG = {
  active:   { label: "Aktiv", color: colors.green, icon: CheckCircle },
  expired:  { label: "Abgelaufen", color: "#E65100", icon: Clock },
  draft:    { label: "Entwurf", color: colors.muted, icon: Clock },
  pending_review: { label: "In Prüfung", color: "#E5A100", icon: Clock },
  scheduled: { label: "Geplant", color: "#0B5E5C", icon: Clock },
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
  const [statsFor, setStatsFor] = useState(null); // listing object
  const [statsData, setStatsData] = useState(null);
  const [myBoosts, setMyBoosts] = useState({}); // listing_id -> [{reward_type, expires_at}]
  const [myNektar, setMyNektar] = useState(0);
  const [boostMenuFor, setBoostMenuFor] = useState(null); // listing id with open boost menu
  const [boosting, setBoosting] = useState(false);

  const doBoost = async (listingId, reward) => {
    if (boosting || myNektar < reward.cost) return;
    setBoosting(true);
    try {
      const res = await redeemNektar(reward.key, reward.cost, listingId, reward.durationHours || 0);
      if (res?.ok) {
        setMyNektar(res.new_balance);
        setMyBoosts((prev) => ({ ...prev, [listingId]: [...(prev[listingId] || []), { reward_type: reward.key, expires_at: reward.durationHours ? new Date(Date.now() + reward.durationHours * 3600000).toISOString() : null }] }));
        setBoostMenuFor(null);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("beedaro:nektar"));
      }
    } catch (e) { console.error(e); }
    finally { setBoosting(false); }
  };

  const openStats = async (listing) => {
    setStatsFor(listing); setStatsData(null);
    const d = await getListingAnalytics(listing.id);
    setStatsData(d || {});
  };

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "/login"; return; }
        const items = await getUserListings(user.id);
        setListings(items);
        supabase.from("nektar_redemptions").select("listing_id, reward_type, expires_at").eq("user_id", user.id).eq("status", "active").then(({ data }) => {
          const bmap = {};
          (data || []).forEach(r => { if (r.listing_id) (bmap[r.listing_id] = bmap[r.listing_id] || []).push(r); });
          setMyBoosts(bmap);
        });
        supabase.from("profiles").select("nektar").eq("id", user.id).maybeSingle().then(({ data }) => setMyNektar(data?.nektar || 0));
        const auctionIds = items.filter(l => l.listing_type === "auction").map(l => l.id);
        if (auctionIds.length > 0) {
          const { data: historyBids } = await supabase.from("bid_history").select("listing_id").in("listing_id", auctionIds);
          const countMap = {};
          auctionIds.forEach(id => { countMap[id] = { count: 0, topBid: 0 }; });
          (historyBids || []).forEach(b => { countMap[b.listing_id].count++; });
          if (historyBids?.length === 0) {
            const { data: bidsAlt } = await supabase.from("public_bids").select("listing_id").in("listing_id", auctionIds);
            (bidsAlt || []).forEach(b => { countMap[b.listing_id].count++; });
          }
          const { data: topBids } = await supabase.from("public_bids").select("listing_id, amount").in("listing_id", auctionIds).order("amount", { ascending: false });
          (topBids || []).forEach(b => { if (countMap[b.listing_id] && !countMap[b.listing_id].topBid) countMap[b.listing_id].topBid = b.amount; });
          setBidCounts(countMap);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const renew = async (l) => {
    try {
      // renewListing (lib) setzt expires_at auf +60 Tage und liefert das neue Datum
      const expires = await renewListing(l.id);
      setListings(prev => prev.map(x => x.id === l.id ? { ...x, expires_at: expires, status: "active" } : x));
      toast.success("Inserat verlängert: 60 Tage neue Laufzeit.");
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Verlängern fehlgeschlagen.");
    }
  };

  const fmtPrice = (p) => (parseFloat(p) || 0).toLocaleString("de-CH", { minimumFractionDigits: 2 });
  const fmtDate = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" });

  // Abgelaufen: Status steht zwar auf "active", aber die Laufzeit ist vorbei.
  // Die Suche filtert solche Inserate aus, der Verkäufer sah aber weiter
  // "Aktiv" und konnte sich nicht erklären, warum ihn niemand findet.
  const isExpired = (l) => l.status === "active" && l.expires_at && new Date(l.expires_at) < new Date();

  // Filter
  let filtered = listings.filter((l) => {
    if (filter === "all") return true;
    if (filter === "expired") return isExpired(l);
    if (filter === "active") return l.status === "active" && !isExpired(l);
    return l.status === filter;
  });
  if (typeFilter !== "all") filtered = filtered.filter(l => l.listing_type === typeFilter);

  // Sort — status priority first (active/paused on top, sold/archived bottom)
  const statusPriority = { pending_review: 0, scheduled: 1, active: 2, paused: 3, draft: 4, rented: 5, sold: 6, expired: 7, archived: 8, inactive: 9 };
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
    active: listings.filter(l => l.status === "active" && !isExpired(l)).length,
    expired: listings.filter(isExpired).length,
    sold: listings.filter(l => l.status === "sold").length,
    paused: listings.filter(l => l.status === "paused").length,
    draft: listings.filter(l => l.status === "draft").length,
    scheduled: listings.filter(l => l.status === "scheduled").length,
  };

  const FILTERS = [
    { key: "all", label: `Alle (${counts.all})` },
    { key: "active", label: `Aktiv (${counts.active})` },
    ...(counts.expired > 0 ? [{ key: "expired", label: `Abgelaufen (${counts.expired})` }] : []),
    { key: "sold", label: `Verkauft (${counts.sold})` },
    ...(counts.paused > 0 ? [{ key: "paused", label: `Pausiert (${counts.paused})` }] : []),
    ...(counts.draft > 0 ? [{ key: "draft", label: `Entwürfe (${counts.draft})` }] : []),
    ...(counts.scheduled > 0 ? [{ key: "scheduled", label: `Geplant (${counts.scheduled})` }] : []),
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
    } catch (err) { console.error(err); toast.error("Aktion fehlgeschlagen. Bitte erneut versuchen."); }
    finally { setBatchAction(null); }
  };

  // Quick toggle pause/activate
  const togglePause = async (l) => {
    const newStatus = l.status === "paused" ? "active" : "paused";
    await supabase.from("listings").update({ status: newStatus }).eq("id", l.id);
    setListings(prev => prev.map(x => x.id === l.id ? { ...x, status: newStatus } : x));
  };

  const colHead = { fontSize: 12, fontWeight: 600, color: colors.muted, padding: "12px 10px", textAlign: "left", borderBottom: `1px solid ${colors.border}` };
  const selectStyle = { padding: "7px 12px", borderRadius: 0, fontSize: 12, fontWeight: 600, border: `1px solid ${K.ink}`, background: "#fff", color: K.ink, fontFamily: fonts.body, cursor: "pointer", outline: "none" };

  return (
    <div style={{ fontFamily: fonts.body, background: K.paper, minHeight: "100vh", color: K.ink }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: ".18em", textTransform: "uppercase", color: K.petrol, marginBottom: 6 }}>Verkäuferpult · Katalog der zweiten Leben</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", fontFamily: "'General Sans','Manrope',sans-serif", letterSpacing: "-0.01em" }}>Meine Inserate</h1>
            <p style={{ fontSize: 13, color: colors.mutedLt, margin: 0 }}>{counts.all} Inserate · {counts.active} aktiv</p>
          </div>
          <Link href="/listings/new" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 20px", borderRadius: 0, background: K.honey, color: K.ink, fontSize: 14, fontWeight: 800, fontFamily: fonts.body, textDecoration: "none", border: `1px solid ${K.ink}` }}>
            <Plus size={16} /> Neues Inserat
          </Link>
        </div>

        {/* Status Filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setVisibleCount(PAGE_SIZE); }} style={{
              padding: "7px 14px", borderRadius: 0, fontSize: 12, fontWeight: filter === f.key ? 800 : 600,
              cursor: "pointer", fontFamily: fonts.body, border: `1px solid ${K.ink}`,
              background: filter === f.key ? K.honey : "#fff", color: K.ink,
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
            background: K.sand, borderRadius: 0, border: `1px solid ${K.ink}`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{selected.size} ausgewählt</span>
            <button onClick={() => handleBatchAction("pause")} disabled={!!batchAction}
              style={{ padding: "5px 12px", borderRadius: 0, fontSize: 12, fontWeight: 700, border: `1px solid ${K.ink}`, background:"#FFF3E0", color: "#E65100", cursor: "pointer", fontFamily: fonts.body, display: "flex", alignItems: "center", gap: 4 }}>
              <Pause size={12} /> Pausieren
            </button>
            <button onClick={() => handleBatchAction("activate")} disabled={!!batchAction}
              style={{ padding: "5px 12px", borderRadius: 0, fontSize: 12, fontWeight: 700, border: `1px solid ${K.ink}`, background:"#E8F5E9", color: "#2E7D32", cursor: "pointer", fontFamily: fonts.body, display: "flex", alignItems: "center", gap: 4 }}>
              <Play size={12} /> Aktivieren
            </button>
            <button onClick={() => { if (confirm(`${selected.size} Inserate löschen?`)) handleBatchAction("delete"); }} disabled={!!batchAction}
              style={{ padding: "5px 12px", borderRadius: 0, fontSize: 12, fontWeight: 700, border: `1px solid ${K.ink}`, background:"#FFEBEE", color: "#c62828", cursor: "pointer", fontFamily: fonts.body, display: "flex", alignItems: "center", gap: 4 }}>
              <Trash2 size={12} /> Löschen
            </button>
            <button onClick={() => setSelected(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: colors.muted, fontFamily: fonts.body }}>
              Auswahl aufheben
            </button>
          </div>
        )}

        {loading && <div style={{ textAlign: "center", padding: 60, color: colors.mutedLt }}>Lade...</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 0, border: `1px solid ${K.ink}` }}>
            <Package size={40} color={colors.mutedLt} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Keine Inserate</p>
            <p style={{ fontSize: 13, color: colors.mutedLt, margin: "0 0 20px" }}>Erstelle dein erstes Inserat.</p>
            <Link href="/listings/new" style={{ display: "inline-flex", padding: "11px 24px", borderRadius: 0, background: K.honey, color: K.ink, fontSize: 13, fontWeight: 800, textDecoration: "none", border: `1px solid ${K.ink}` }}>
              <Plus size={16} style={{ marginRight: 6 }} /> Inserat erstellen
            </Link>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 0, border: `1px solid ${K.ink}`, overflow: "hidden" }}>
            <div className="ml-table">
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
                  const st = isExpired(l) ? STATUS_CONFIG.expired : (STATUS_CONFIG[l.status] || STATUS_CONFIG.active);
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
                          <div style={{ width: 56, height: 56, borderRadius: 0, border: `1px solid ${K.ink}`, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {l.cover_image ? <img src={l.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={20} color={colors.mutedLt} />}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <Link href={`/listing/${l.id}`} style={{ fontSize: 14, fontWeight: 700, color: colors.blue, textDecoration: "none", display: "block", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{l.title}</Link>
                            <div style={{ fontSize: 11, color: colors.muted }}><TypeBadge type={l.listing_type} /></div>
                            {l.status === "draft" && l.review_reason && <div style={{ fontSize: 11, color: "#c62828", marginTop: 3, maxWidth: 220, whiteSpace: "normal", lineHeight: 1.3 }}>Abgelehnt: {l.review_reason}</div>}
                            {l.status === "scheduled" && l.publish_at && (
                              <div style={{ fontSize: 11, color: "#0B5E5C", marginTop: 3, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span>Geht live am {new Date(l.publish_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}, {new Date(l.publish_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} Uhr</span>
                                <button
                                  onClick={async () => { try { await publishScheduledNow(l); setListings(prev => prev.map(x => x.id === l.id ? { ...x, status: "active", publish_at: null } : x)); } catch (e) { console.error(e); } }}
                                  style={{ border: `1px solid ${K.ink}`, background: "#fff", padding: "2px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer", color: K.ink }}
                                >
                                  Jetzt veröffentlichen
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Erstellt */}
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        <div style={{ fontSize: 13, color: colors.muted }}>{fmtDate(l.created_at)}</div>
                      </td>
                      {/* Preis */}
                      <td style={{ padding: "14px 10px", textAlign: "right", verticalAlign: "middle", fontWeight: 700, fontSize: 15 }}>
                        {/* Auktion: Top-Gebot, sonst "ab Startpreis" — price ist bei Auktionen leer */}
                        {l.listing_type === "free" ? "Gratis"
                          : (l.listing_type === "rent" || l.listing_type === "service") ? `CHF ${fmtPrice(l.rent_price || l.price)} / ${l.rent_period === "hour" ? "Std" : l.rent_period === "day" ? "Tag" : l.rent_period === "week" ? "Wo" : "Mt"}`
                          : l.listing_type === "auction" ? (() => { const bc = bidCounts[l.id] || { topBid: 0 }; return bc.topBid > 0 ? `CHF ${fmtPrice(bc.topBid)}` : `ab CHF ${fmtPrice(l.start_price || 0)}`; })()
                          : `CHF ${fmtPrice(l.price)}`}
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
                        {myBoosts[l.id]?.length > 0 && (() => {
                          const labels = { spotlight: "Spotlight", golden_stamp: "Featured", mega_boost: "Mega-Boost" };
                          const b = myBoosts[l.id][0];
                          const rem = b.expires_at ? Math.max(0, new Date(b.expires_at).getTime() - Date.now()) : null;
                          const remStr = rem == null ? "" : rem < 3600000 ? `noch ${Math.ceil(rem / 60000)}m` : rem < 86400000 ? `noch ${Math.round(rem / 3600000)}h` : `noch ${Math.round(rem / 86400000)}d`;
                          return <div style={{ marginTop: 4, fontSize: 10, fontWeight: 800, color: "#C8860A", display: "flex", alignItems: "center", gap: 3 }}><Rocket size={10} /> {labels[b.reward_type] || b.reward_type}{remStr ? ` · ${remStr}` : ""}</div>;
                        })()}
                      </td>
                      {/* Actions — Icon-Only mit Hover-Tooltip */}
                      <td style={{ padding: "14px 6px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
                          {/* Bearbeiten — immer sichtbar */}
                          <Link href={`/listings/${l.id}`} title="Bearbeiten" style={{
                            width: 32, height: 32, borderRadius: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
                            color: colors.blue, background: `${colors.blue}10`, border: "none", textDecoration: "none", transition: "all .15s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = `${colors.blue}20`}
                            onMouseLeave={e => e.currentTarget.style.background = `${colors.blue}10`}>
                            <Pencil size={14} />
                          </Link>
                          {/* Ähnliches Inserat erstellen (Duplikat als Vorlage) */}
                          <Link href={`/listings/new?duplicate=${l.id}`} title="Ähnliches Inserat erstellen" style={{
                            width: 32, height: 32, borderRadius: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
                            color: colors.teal, background: `${colors.teal}10`, border: "none", textDecoration: "none", transition: "all .15s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = `${colors.teal}20`}
                            onMouseLeave={e => e.currentTarget.style.background = `${colors.teal}10`}>
                            <Copy size={14} />
                          </Link>
                          {/* Statistik */}
                          <button onClick={() => openStats(l)} title="Statistik" style={{
                            width: 32, height: 32, borderRadius: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
                            color: colors.muted, background: colors.cream, border: "none", cursor: "pointer", transition: "all .15s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = colors.warm}
                            onMouseLeave={e => e.currentTarget.style.background = colors.cream}>
                            <BarChart3 size={14} />
                          </button>
                          {/* Boost (Nektar) — nur bei aktiven Inseraten */}
                          {l.status === "active" && (
                            <div style={{ position: "relative" }}>
                              <button onClick={() => setBoostMenuFor(boostMenuFor === l.id ? null : l.id)} title="Boosten" style={{
                                width: 32, height: 32, borderRadius: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
                                color: "#C8860A", background: "#E8A82014", border: "none", cursor: "pointer", transition: "all .15s",
                              }}>
                                <Rocket size={14} />
                              </button>
                              {boostMenuFor === l.id && (
                                <>
                                  <div onClick={() => setBoostMenuFor(null)} style={{ position: "fixed", inset: 0, zIndex: 200 }} />
                                  <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 201, width: 210, background: "#fff", borderRadius: 0, boxShadow: "0 8px 28px rgba(0,0,0,.16)", border: `1px solid ${colors.borderLt}`, padding: "6px", textAlign: "left" }}>
                                    <p style={{ margin: "4px 8px 6px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, display: "flex", justifyContent: "space-between" }}><span>Boosten</span><span style={{ color: "#C8860A" }}>{myNektar} Nektar</span></p>
                                    {NEKTAR_CATALOG.filter(r => r.needsListing).map(r => {
                                      const aff = myNektar >= r.cost;
                                      return (
                                        <button key={r.key} onClick={() => doBoost(l.id, r)} disabled={!aff || boosting} style={{
                                          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                                          padding: "9px 8px", borderRadius: 0, border: "none", background: "transparent", cursor: aff ? "pointer" : "default",
                                          fontFamily: fonts.body, fontSize: 12.5, color: aff ? colors.dark : colors.mutedLt,
                                        }}
                                          onMouseEnter={e => { if (aff) e.currentTarget.style.background = colors.cream; }}
                                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                                          <span style={{ fontWeight: 700 }}>{r.name}</span>
                                          <span style={{ fontWeight: 800, color: aff ? "#C8860A" : colors.mutedLt, whiteSpace: "nowrap" }}>{r.cost} Nektar</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          {/* Pausieren / Aktivieren — nur bei active oder paused */}
                          {/* Verlängern: nur bei abgelaufener Laufzeit. Auktionen sind
                              ausgenommen, deren Ende ist Teil des Gebotsablaufs. */}
                          {isExpired(l) && l.listing_type !== "auction" && (
                            <button onClick={() => renew(l)} title="Verlängern (60 Tage neue Laufzeit)" style={{
                              height: 32, padding: "0 10px", borderRadius: 0, display: "inline-flex", alignItems: "center", gap: 5,
                              border: "none", cursor: "pointer", fontFamily: fonts.body, fontSize: 11, fontWeight: 700,
                              color: "#fff", background: K.petrol, transition: "all .15s",
                            }}
                              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                              <RefreshCw size={13} /> Verlängern
                            </button>
                          )}
                          {(l.status === "active" || l.status === "paused") && (
                            <button onClick={() => togglePause(l)} title={l.status === "paused" ? "Aktivieren" : "Pausieren"} style={{
                              width: 32, height: 32, borderRadius: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
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
                                  width: 28, height: 28, borderRadius: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  background: "#c62828", border: "none", cursor: "pointer", color: "#fff",
                                }}><CheckCircle size={12} /></button>
                                <button onClick={() => setDeleteId(null)} title="Abbrechen" style={{
                                  width: 28, height: 28, borderRadius: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  background: colors.cream, border: "none", cursor: "pointer", color: colors.muted,
                                }}><XCircle size={12} /></button>
                              </div>
                            ) : (
                              <button onClick={() => { if (!hasBids) setDeleteId(l.id); }}
                                title={hasBids ? "Kann nicht gelöscht werden (aktive Gebote)" : "Löschen"}
                                disabled={hasBids}
                                style={{
                                  width: 32, height: 32, borderRadius: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
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
            </div>

            {/* ── MOBILE: Karten-Liste ── */}
            <div className="ml-cards">
              {paginated.map(l => {
                const st = isExpired(l) ? STATUS_CONFIG.expired : (STATUS_CONFIG[l.status] || STATUS_CONFIG.active);
                const StIcon = st.icon;
                const hasBids = bidCounts[l.id]?.count > 0;
                const bc = bidCounts[l.id] || { count: 0, topBid: 0 };
                const boost = myBoosts[l.id]?.[0];
                // Einheitliche Zellen im 3er-Raster: gleich breit, zentriert,
                // damit die Aktionsleiste auf dem Handy nicht zerfleddert.
                const actBtn = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", boxSizing: "border-box", gap: 5, padding: "9px 4px", borderRadius: 0, border: `1px solid ${K.ink}`, background: "#fff", fontSize: 12, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer", textDecoration: "none", color: colors.dark, whiteSpace: "nowrap" };
                return (
                  <div key={l.id} style={{ padding: "14px 16px", borderBottom: `1px solid ${colors.borderLt}` }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ width: 60, height: 60, borderRadius: 0, border: `1px solid ${K.ink}`, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {l.cover_image ? <img src={l.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={22} color={colors.mutedLt} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/listing/${l.id}`} style={{ fontSize: 14.5, fontWeight: 700, color: colors.dark, textDecoration: "none", display: "block", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.title}</Link>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <TypeBadge type={l.listing_type} />
                          <span style={{ fontSize: 14, fontWeight: 800, color: colors.dark }}>{l.listing_type === "free" ? "Gratis" : (l.listing_type === "rent" || l.listing_type === "service") ? `CHF ${fmtPrice(l.rent_price || l.price)} / ${l.rent_period === "hour" ? "Std" : l.rent_period === "day" ? "Tag" : l.rent_period === "week" ? "Wo" : "Mt"}` : l.listing_type === "auction" ? (bc.topBid > 0 ? `CHF ${fmtPrice(bc.topBid)}` : `ab CHF ${fmtPrice(l.start_price || 0)}`) : `CHF ${fmtPrice(l.price)}`}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, flexWrap: "wrap", fontSize: 12.5 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: st.color, fontWeight: 700 }}><StIcon size={14} /> {st.label}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: colors.muted }}><Eye size={14} /> {l.view_count || 0}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: l.favorite_count > 0 ? colors.yellow : colors.muted }}><Heart size={14} fill={l.favorite_count > 0 ? colors.yellow : "none"} /> {l.favorite_count || 0}</span>
                      {l.listing_type === "auction" && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: bc.count > 0 ? colors.green : colors.muted, fontWeight: bc.count > 0 ? 700 : 400 }}><Gavel size={14} /> {bc.count}{bc.topBid > 0 ? ` · CHF ${fmtPrice(bc.topBid)}` : ""}</span>}
                      {boost && (() => { const labels = { spotlight: "Spotlight", golden_stamp: "Featured", mega_boost: "Mega-Boost" }; const rem = boost.expires_at ? Math.max(0, new Date(boost.expires_at).getTime() - Date.now()) : null; const remStr = rem == null ? "" : rem < 3600000 ? `noch ${Math.ceil(rem / 60000)}m` : rem < 86400000 ? `noch ${Math.round(rem / 3600000)}h` : `noch ${Math.round(rem / 86400000)}d`; return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#C8860A", fontWeight: 800 }}><Rocket size={13} /> {labels[boost.reward_type] || boost.reward_type}{remStr ? ` · ${remStr}` : ""}</span>; })()}
                    </div>

                    {l.status === "scheduled" && l.publish_at && (
                      <div style={{ fontSize: 12, color: "#0B5E5C", fontWeight: 700, marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span>Geht live am {new Date(l.publish_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}, {new Date(l.publish_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} Uhr</span>
                        <button
                          onClick={async () => { try { await publishScheduledNow(l); setListings(prev => prev.map(x => x.id === l.id ? { ...x, status: "active", publish_at: null } : x)); } catch (e) { console.error(e); } }}
                          style={{ border: `1px solid ${K.ink}`, background: "#fff", padding: "3px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: K.ink, fontFamily: fonts.body }}
                        >
                          Jetzt veröffentlichen
                        </button>
                      </div>
                    )}

                    {/* Aktionen: festes 3er-Raster statt Flex-Wrap */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 12 }}>
                      <Link href={`/listings/${l.id}`} style={{ ...actBtn, color: colors.blue, borderColor: `${colors.blue}40` }}><Pencil size={14} /> Bearbeiten</Link>
                      <Link href={`/listings/new?duplicate=${l.id}`} style={{ ...actBtn, color: colors.teal, borderColor: `${colors.teal}40` }}><Copy size={14} /> Ähnliches</Link>
                      <button onClick={() => openStats(l)} style={actBtn}><BarChart3 size={14} /> Statistik</button>
                      {isExpired(l) && l.listing_type !== "auction" && (
                        <button onClick={() => renew(l)} style={{ ...actBtn, color: "#fff", background: K.petrol, borderColor: K.petrol }}><RefreshCw size={14} /> Verlängern</button>
                      )}
                      {l.status === "active" && (
                        <div style={{ position: "relative", width: "100%" }}>
                          <button onClick={() => setBoostMenuFor(boostMenuFor === l.id ? null : l.id)} style={{ ...actBtn, color: "#C8860A", borderColor: "#E8A82055" }}><Rocket size={14} /> Boosten</button>
                          {boostMenuFor === l.id && (
                            <>
                              <div onClick={() => setBoostMenuFor(null)} style={{ position: "fixed", inset: 0, zIndex: 200 }} />
                              <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, zIndex: 201, width: 210, background: "#fff", borderRadius: 0, boxShadow: "0 8px 28px rgba(0,0,0,.16)", border: `1px solid ${colors.borderLt}`, padding: 6, textAlign: "left" }}>
                                <p style={{ margin: "4px 8px 6px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, display: "flex", justifyContent: "space-between" }}><span>Boosten</span><span style={{ color: "#C8860A" }}>{myNektar} Nektar</span></p>
                                {NEKTAR_CATALOG.filter(r => r.needsListing).map(r => {
                                  const aff = myNektar >= r.cost;
                                  return (
                                    <button key={r.key} onClick={() => doBoost(l.id, r)} disabled={!aff || boosting} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "9px 8px", borderRadius: 0, border: "none", background: "transparent", cursor: aff ? "pointer" : "default", fontFamily: fonts.body, fontSize: 12.5, color: aff ? colors.dark : colors.mutedLt }}>
                                      <span style={{ fontWeight: 700 }}>{r.name}</span>
                                      <span style={{ fontWeight: 800, color: aff ? "#C8860A" : colors.mutedLt, whiteSpace: "nowrap" }}>{r.cost} Nektar</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {(l.status === "active" || l.status === "paused") && (
                        <button onClick={() => togglePause(l)} style={{ ...actBtn, color: l.status === "paused" ? "#2E7D32" : "#E65100", borderColor: l.status === "paused" ? "#2E7D3240" : "#E6510040" }}>
                          {l.status === "paused" ? <><Play size={14} /> Aktivieren</> : <><Pause size={14} /> Pausieren</>}
                        </button>
                      )}
                      {l.status !== "sold" && l.status !== "rented" && (
                        deleteId === l.id ? (
                          <>
                            <button onClick={async () => { await deleteListing(l.id); setListings(prev => prev.filter(x => x.id !== l.id)); setDeleteId(null); }} style={{ ...actBtn, background: "#c62828", color: "#fff", borderColor: "#c62828", gridColumn: "span 2" }}><CheckCircle size={14} /> Wirklich löschen</button>
                            <button onClick={() => setDeleteId(null)} style={actBtn}>Abbrechen</button>
                          </>
                        ) : (
                          <button onClick={() => { if (!hasBids) setDeleteId(l.id); }} disabled={hasBids} style={{ ...actBtn, color: hasBids ? colors.mutedLt : "#c62828", borderColor: hasBids ? colors.borderLt : "#c6282840", opacity: hasBids ? 0.5 : 1, cursor: hasBids ? "not-allowed" : "pointer" }}><Trash2 size={14} /> Löschen</button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div style={{ textAlign: "center", padding: "16px 0", borderTop: `1px solid ${colors.borderLt}` }}>
                <button onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)} style={{
                  padding: "10px 28px", borderRadius: 0, fontSize: 13, fontWeight: 700,
                  border: `1px solid ${K.ink}`, background: "#fff", color: K.ink,
                  cursor: "pointer", fontFamily: fonts.body, display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  <ChevronDown size={14} /> Weitere {Math.min(PAGE_SIZE, totalFiltered - visibleCount)} von {totalFiltered} laden
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── STATISTIK-MODAL ── */}
      {statsFor && (
        <div onClick={() => setStatsFor(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: K.paper, borderRadius: 0, border: `1px solid ${K.ink}`, padding: "22px 24px", maxWidth: 460, width: "100%", fontFamily: fonts.body, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, fontFamily: MONO, color: K.petrol, textTransform: "uppercase", letterSpacing: ".14em" }}>Statistik</p>
                <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 800, color: colors.dark }}>{statsFor.title}</h3>
              </div>
              <button onClick={() => setStatsFor(null)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.muted, padding: 2 }}><X size={20} /></button>
            </div>

            {!statsData ? (
              <p style={{ fontSize: 13, color: colors.muted, textAlign: "center", padding: 30 }}>Lade…</p>
            ) : (
              <>
                <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                  {[
                    { v: statsData.total_views ?? 0, l: "Aufrufe", icon: Eye },
                    { v: statsData.favorites ?? 0, l: "Favoriten", icon: Heart },
                    { v: statsData.chat_requests ?? 0, l: "Chat-Anfragen", icon: MessageCircle },
                  ].map(t => (
                    <div key={t.l} style={{ flex: 1, padding: "12px 10px", borderRadius: 0, background: "#fff", border: `1px solid ${K.ink}`, textAlign: "center" }}>
                      <t.icon size={15} color={K.petrol} style={{ marginBottom: 4 }} />
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: fonts.head, color: colors.dark }}>{t.v}</p>
                      <p style={{ margin: "1px 0 0", fontSize: 10, color: colors.muted }}>{t.l}</p>
                    </div>
                  ))}
                </div>

                {/* 7-Tage Aufrufe */}
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: colors.dark }}>Aufrufe (7 Tage)</p>
                {(() => {
                  const daily = statsData.daily || [];
                  const max = Math.max(1, ...daily.map(d => d.count));
                  return (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90, marginBottom: 6 }}>
                      {daily.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ fontSize: 9, color: colors.muted }}>{d.count}</div>
                          <div style={{ width: "100%", height: `${Math.round((d.count / max) * 64)}px`, minHeight: 3, background: d.count > 0 ? K.petrol : colors.borderLt, borderRadius: 0 }} />
                          <div style={{ fontSize: 9, color: colors.mutedLt }}>{d.day}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {daily0Note(statsData)}

                {/* Quellen */}
                {statsData.sources && Object.keys(statsData.sources).length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: colors.dark }}>Woher kommen Aufrufe</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {Object.entries(statsData.sources).map(([s, c]) => (
                        <span key={s} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 0, background: "#fff", border: `1px solid ${K.ink}`, color: colors.dark }}>
                          {({ search: "Suche", intern: "Intern", extern: "Extern", direct: "Direkt" })[s] || s}: <b>{c}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function daily0Note(statsData) {
  const total = (statsData.daily || []).reduce((s, d) => s + (d.count || 0), 0);
  if (total > 0) return null;
  return <p style={{ fontSize: 11, color: "#9A9490", margin: "0 0 6px" }}>Noch keine erfassten Aufrufe in den letzten 7 Tagen (Tracking ab jetzt aktiv).</p>;
}
