"use client";
import Link from "next/link";
import { Play, Pause, Eye, CheckCircle, XCircle } from "lucide-react";
import { fmtDate } from "@/lib/formatters";
import { colors, radius, fonts } from "@/lib/theme";
import { makeArtRef } from "@/lib/fees";
import { TypeBadge } from "@/components/shared/Badge";
import { th, td, useSort, SortTh, listingPriceText, listingPriceValue } from "@/components/admin/adminStyles";

// Status-Aktionsknoepfe (Freigeben/Ablehnen/Pause/Aktiv) — Tabelle + Karten
function StatusActions({ l, approveListing, rejectListing, toggleListingStatus }) {
  return (
    <>
      {l.status === "pending_review" && (
        <>
          <button onClick={() => approveListing(l.id)} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><CheckCircle size={10} /> Freigeben</button>
          <button onClick={() => { const r = window.prompt("Ablehngrund (wird dem Verkäufer angezeigt):"); if (r && r.trim()) rejectListing(l.id, r.trim()); }} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><XCircle size={10} /> Ablehnen</button>
        </>
      )}
      {l.status === "active" && <button onClick={() => toggleListingStatus(l.id, "paused")} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><Pause size={10} /> Pause</button>}
      {(l.status === "paused" || l.status === "draft") && <button onClick={() => toggleListingStatus(l.id, "active")} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><Play size={10} /> Aktiv</button>}
    </>
  );
}

export function ListingsTab({ admin }) {
  const { visibleListings, listingMod, setListingMod, pendingListings, approveListing, rejectListing, statusPill, toggleListingStatus, modPill } = admin;
  const rows = listingMod === "pending" ? pendingListings
    : listingMod === "all" ? visibleListings
    : visibleListings.filter(l => l.status === listingMod);

  // Sortierung: Standard = Originalreihenfolge (neuste zuerst)
  const sort = useSort(rows, (l, key) => {
    if (key === "title") return l.title || "";
    if (key === "seller") return l.sellerName || "";
    if (key === "type") return l.listing_type || "";
    if (key === "price") return listingPriceValue(l);
    if (key === "status") return l.status || "";
    if (key === "date") return l.created_at || "";
    return null;
  });

  const actionProps = { approveListing, rejectListing, toggleListingStatus };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { k: "all", l: `Alle (${visibleListings.length})` },
          { k: "pending", l: `Wartet auf Freigabe (${pendingListings.length})` },
          { k: "scheduled", l: `Geplant (${visibleListings.filter(l => l.status === "scheduled").length})` },
          { k: "active", l: "Aktiv" },
          { k: "paused", l: "Pausiert" },
        ].map(f => (
          <button key={f.k} onClick={() => setListingMod(f.k)} style={modPill(listingMod === f.k)}>{f.l}</button>
        ))}
      </div>

      <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {sort.sorted.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13 }}>
            {listingMod === "pending" ? "Keine Inserate warten auf Freigabe." : "Keine Inserate gefunden."}
          </div>
        ) : (
        <>
        {/* Desktop: sortierbare Tabelle */}
        <table className="po-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cream }}>
            <SortTh label="Titel" k="title" sort={sort} />
            <SortTh label="Verkäufer" k="seller" sort={sort} />
            <SortTh label="Typ" k="type" sort={sort} />
            <SortTh label="Preis" k="price" sort={sort} align="right" />
            <SortTh label="Datum" k="date" sort={sort} />
            <SortTh label="Status" k="status" sort={sort} align="center" />
            <th style={{ ...th, textAlign: "center" }}>Aktionen</th>
          </tr></thead>
          <tbody>
            {sort.sorted.map(l => (
              <tr key={l.id} style={{ borderBottom: `1px solid ${colors.borderLt}` }}>
                <td style={{ ...td, fontWeight: 600, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <Link href={`/listing/${l.id}`} style={{ color: colors.dark, textDecoration: "none" }}>{l.title}</Link>
                  <span style={{ display: "block", fontFamily: "monospace", fontSize: 10, color: colors.muted, fontWeight: 500 }}>{makeArtRef(l.id)}{l.status === "pending_review" && l.submitted_at ? ` · seit ${new Date(l.submitted_at).toLocaleDateString("de-CH")}` : ""}</span>
                  {l.publish_at && ["pending_review", "scheduled"].includes(l.status) && (
                    <span style={{ display: "block", fontSize: 10, color: "#0B5E5C", fontWeight: 700 }}>
                      Geplant für {new Date(l.publish_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}, {new Date(l.publish_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} Uhr
                    </span>
                  )}
                </td>
                <td style={{ ...td, color: colors.muted }}>{l.sellerName}</td>
                <td style={td}><TypeBadge type={l.listing_type} /></td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>{listingPriceText(l)}</td>
                <td style={{ ...td, color: colors.muted, whiteSpace: "nowrap" }}>{fmtDate(l.created_at)}</td>
                <td style={{ ...td, textAlign: "center" }}>{statusPill(l.status)}</td>
                {/* Feste Flucht: Statusknoepfe links, Auge IMMER ganz rechts */}
                <td style={{ ...td }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 34px", alignItems: "center", gap: 4, minWidth: 170 }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <StatusActions l={l} {...actionProps} />
                    </div>
                    <Link href={`/listing/${l.id}`} style={{ padding: "4px 0", borderRadius: 999, background: colors.warm, color: colors.muted, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><Eye size={12} /></Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobil: Karten */}
        <div className="po-cards">
          {sort.sorted.map(l => (
            <div key={l.id} style={{ padding: "12px 14px", borderBottom: `1px solid ${colors.borderLt}`, fontFamily: fonts.body }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <Link href={`/listing/${l.id}`} style={{ fontSize: 13.5, fontWeight: 700, color: colors.dark, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</Link>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: colors.muted }}>{makeArtRef(l.id)} · {fmtDate(l.created_at)}</span>
                  {l.publish_at && ["pending_review", "scheduled"].includes(l.status) && (
                    <span style={{ display: "block", fontSize: 10, color: "#0B5E5C", fontWeight: 700 }}>
                      Geplant für {new Date(l.publish_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}, {new Date(l.publish_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} Uhr
                    </span>
                  )}
                </div>
                {statusPill(l.status)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <TypeBadge type={l.listing_type} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{listingPriceText(l)}</span>
                <span style={{ fontSize: 12, color: colors.muted }}>{l.sellerName}</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                <StatusActions l={l} {...actionProps} />
                <Link href={`/listing/${l.id}`} style={{ padding: "4px 10px", borderRadius: 999, background: colors.warm, color: colors.muted, fontSize: 10, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}><Eye size={10} /> Ansehen</Link>
              </div>
            </div>
          ))}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
