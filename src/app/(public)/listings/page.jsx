"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { getUserListings, deleteListing } from "@/lib/listings";
import Link from "next/link";
import { Package, Plus, Eye, Clock, CheckCircle, XCircle, Pencil, ArchiveRestore, Heart, Trash2 } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { TypeBadge } from "@/components/shared/Badge";

const STATUS_CONFIG = {
  active:   { label: "Aktiv", color: colors.green, icon: CheckCircle },
  draft:    { label: "Entwurf", color: colors.muted, icon: Clock },
  sold:     { label: "Verkauft", color: colors.blue, icon: CheckCircle },
  rented:   { label: "Vermietet", color: colors.blue, icon: CheckCircle },
  inactive: { label: "Inaktiv", color: colors.muted, icon: XCircle },
  archived: { label: "Archiviert", color: colors.muted, icon: ArchiveRestore },
};

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "/login"; return; }
        setListings(await getUserListings(user.id));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const fmtPrice = (p) => (parseFloat(p) || 0).toLocaleString("de-CH", { minimumFractionDigits: 2 });
  const fmtDate = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" });
  const filtered = listings.filter((l) => filter === "all" || l.status === filter);
  const counts = { all: listings.length, active: listings.filter(l => l.status === "active").length, sold: listings.filter(l => l.status === "sold").length };

  const FILTERS = [
    { key: "all", label: `Alle (${counts.all})` },
    { key: "active", label: `Aktiv (${counts.active})` },
    { key: "sold", label: `Verkauft (${counts.sold})` },
    { key: "draft", label: "Entwürfe" },
  ];

  const colHead = { fontSize: 12, fontWeight: 600, color: colors.muted, padding: "12px 10px", textAlign: "left", borderBottom: `1px solid ${colors.border}` };

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px 80px" }}>

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

        {/* Filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: "7px 14px", borderRadius: radius.sm, fontSize: 12, fontWeight: filter === f.key ? 700 : 500,
              cursor: "pointer", fontFamily: fonts.body, border: `1.5px solid ${filter === f.key ? colors.yellow : colors.border}`,
              background: filter === f.key ? colors.yellowSoft : colors.surface, color: filter === f.key ? colors.dark : colors.muted,
            }}>{f.label}</button>
          ))}
        </div>

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
                  <th style={colHead}>Artikel</th>
                  <th style={colHead}>Erstellt</th>
                  <th style={{ ...colHead, textAlign: "right" }}>Preis</th>
                  <th style={{ ...colHead, textAlign: "center" }}>Aufrufe</th>
                  <th style={{ ...colHead, textAlign: "center" }}>Favoriten</th>
                  <th style={colHead}>Status</th>
                  <th style={{ ...colHead, width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const st = STATUS_CONFIG[l.status] || STATUS_CONFIG.active;
                  const StIcon = st.icon;
                  return (
                    <tr key={l.id} style={{ borderBottom: `1px solid ${colors.borderLt}`, transition: "background .1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = colors.cream}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      {/* Artikel */}
                      <td style={{ padding: "14px 10px", display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 64, height: 64, borderRadius: radius.sm, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {l.cover_image ? <img src={l.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={22} color={colors.mutedLt} />}
                        </div>
                        <div>
                          <Link href={`/listing/${l.id}`} style={{ fontSize: 14, fontWeight: 700, color: colors.blue, textDecoration: "none", display: "block", marginBottom: 2 }}>{l.title}</Link>
                          <div style={{ fontSize: 11, color: colors.muted }}><TypeBadge type={l.listing_type} /></div>
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
                      {/* Status */}
                      <td style={{ padding: "14px 10px", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, color: st.color, fontSize: 12, fontWeight: 600 }}>
                          <StIcon size={14} /> {st.label}
                        </div>
                      </td>
                      {/* Actions */}
                      <td style={{ padding: "14px 10px", verticalAlign: "middle", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                          <Link href={`/listings/${l.id}`} style={{ color: colors.blue, fontSize: 13, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Pencil size={13} /> Bearbeiten
                          </Link>
                          {deleteId === l.id ? (
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <button onClick={async () => { await deleteListing(l.id); setListings(prev => prev.filter(x => x.id !== l.id)); setDeleteId(null); }} style={{ background: "#c62828", border: "none", cursor: "pointer", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 4, fontFamily: fonts.body }}>Ja, löschen</button>
                              <button onClick={() => setDeleteId(null)} style={{ background: colors.cloud, border: "none", cursor: "pointer", color: colors.muted, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 4, fontFamily: fonts.body }}>Abbrechen</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteId(l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, fontFamily: fonts.body }}>
                              <Trash2 size={13} /> Löschen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
