"use client";
import Link from "next/link";
import { Play, Pause, Eye, CheckCircle, XCircle } from "lucide-react";
import { fmtCHF } from "@/lib/formatters";
import { colors, radius } from "@/lib/theme";
import { makeArtRef } from "@/lib/fees";
import { TypeBadge } from "@/components/shared/Badge";
import { th, td } from "@/components/admin/adminStyles";

export function ListingsTab({ admin }) {
  const { visibleListings, listingMod, setListingMod, pendingListings, approveListing, rejectListing, statusPill, toggleListingStatus, modPill } = admin;
  const rows = listingMod === "pending" ? pendingListings
    : listingMod === "all" ? visibleListings
    : visibleListings.filter(l => l.status === listingMod);
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { k: "all", l: `Alle (${visibleListings.length})` },
          { k: "pending", l: `Wartet auf Freigabe (${pendingListings.length})` },
          { k: "active", l: "Aktiv" },
          { k: "paused", l: "Pausiert" },
        ].map(f => (
          <button key={f.k} onClick={() => setListingMod(f.k)} style={modPill(listingMod === f.k)}>{f.l}</button>
        ))}
      </div>

      <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13 }}>
            {listingMod === "pending" ? "Keine Inserate warten auf Freigabe." : "Keine Inserate gefunden."}
          </div>
        ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cream }}>
            <th style={th}>Titel</th><th style={th}>Verkäufer</th><th style={th}>Typ</th>
            <th style={{ ...th, textAlign: "right" }}>Preis</th><th style={{ ...th, textAlign: "center" }}>Status</th><th style={{ ...th, textAlign: "center" }}>Aktionen</th>
          </tr></thead>
          <tbody>
            {rows.map(l => (
              <tr key={l.id} style={{ borderBottom: `1px solid ${colors.borderLt}` }}>
                <td style={{ ...td, fontWeight: 600, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <Link href={`/listing/${l.id}`} style={{ color: colors.dark, textDecoration: "none" }}>{l.title}</Link>
                  <span style={{ display: "block", fontFamily: "monospace", fontSize: 10, color: colors.muted, fontWeight: 500 }}>{makeArtRef(l.id)}{l.status === "pending_review" && l.submitted_at ? ` · seit ${new Date(l.submitted_at).toLocaleDateString("de-CH")}` : ""}</span>
                </td>
                <td style={{ ...td, color: colors.muted }}>{l.sellerName}</td>
                <td style={td}><TypeBadge type={l.listing_type} /></td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{l.listing_type === "free" ? "Gratis" : `CHF ${fmtCHF(l.price)}`}</td>
                <td style={{ ...td, textAlign: "center" }}>{statusPill(l.status)}</td>
                <td style={{ ...td, textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    {l.status === "pending_review" && (
                      <>
                        <button onClick={() => approveListing(l.id)} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><CheckCircle size={10} /> Freigeben</button>
                        <button onClick={() => { const r = window.prompt("Ablehngrund (wird dem Verkäufer angezeigt):"); if (r && r.trim()) rejectListing(l.id, r.trim()); }} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#FFEBEE", color: "#c62828", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><XCircle size={10} /> Ablehnen</button>
                      </>
                    )}
                    {l.status === "active" && <button onClick={() => toggleListingStatus(l.id, "paused")} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><Pause size={10} /> Pause</button>}
                    {(l.status === "paused" || l.status === "draft") && <button onClick={() => toggleListingStatus(l.id, "active")} style={{ padding: "4px 10px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><Play size={10} /> Aktiv</button>}
                    <Link href={`/listing/${l.id}`} style={{ padding: "4px 10px", borderRadius: 999, background: colors.warm, color: colors.muted, fontSize: 10, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center" }}><Eye size={10} /></Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
