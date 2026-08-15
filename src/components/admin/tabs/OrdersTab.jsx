"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { fmtCHF, fmtDate } from "@/lib/formatters";
import { colors, radius } from "@/lib/theme";
import { makeBeeRef } from "@/lib/fees";
import { th, td } from "@/components/admin/adminStyles";

// Bestellungen als echte Tabelle (gleiches Muster wie ListingsTab):
// feste Spalten, Betraege rechtsbuendig, Detail als aufklappbare Zeile.
export function OrdersTab({ admin }) {
  const { filteredOrders, orderStatusFilter, setOrderStatusFilter, openOrder, toggleOrder, orderDetail, orderDeposit, setOrderDeposit, orderStatusPill, cancelOrder, modPill } = admin;
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ k: "all", l: "Alle" }, { k: "open", l: "Offen" }, { k: "done", l: "Abgeschlossen" }, { k: "cancelled", l: "Storniert" }].map(f => (
          <button key={f.k} onClick={() => setOrderStatusFilter(f.k)} style={modPill(orderStatusFilter === f.k)}>{f.l}</button>
        ))}
      </div>

      <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {filteredOrders.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13 }}>Keine Bestellungen gefunden.</div>
        ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cream }}>
            <th style={th}>Nr</th><th style={th}>Artikel</th><th style={th}>Käufer → Verkäufer</th>
            <th style={th}>Datum</th><th style={{ ...th, textAlign: "right" }}>Betrag</th>
            <th style={{ ...th, textAlign: "center" }}>Status</th><th style={{ ...th, width: 34 }} />
          </tr></thead>
          <tbody>
            {filteredOrders.map(o => {
              const ref = makeBeeRef(o.id);
              const isOpen = openOrder === o.id;
              const det = orderDetail[o.id];
              const deposit = !!orderDeposit[o.id];
              const total = parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0);
              const canDeposit = det?.listing?.listing_type === "rent" && parseFloat(det?.listing?.deposit_amount || 0) > 0;
              const invoiceHref = `/order/${o.id}/invoice${deposit ? "?type=deposit" : ""}`;
              return [
                <tr key={o.id} onClick={() => toggleOrder(o.id)} className="adm-row"
                  style={{ borderBottom: `1px solid ${colors.borderLt}`, cursor: "pointer", background: isOpen ? "#F3FAFA" : undefined, opacity: o.status === "cancelled" ? 0.65 : 1 }}>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: isOpen ? "#0A7170" : colors.muted, whiteSpace: "nowrap" }}>{ref}</td>
                  <td style={{ ...td, fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.listingTitle}</td>
                  <td style={{ ...td, color: colors.muted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.buyerName} → {o.sellerName}</td>
                  <td style={{ ...td, color: colors.muted, whiteSpace: "nowrap" }}>{o.created_at ? fmtDate(o.created_at) : "…"}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>CHF {fmtCHF(total)}</td>
                  <td style={{ ...td, textAlign: "center" }}>{orderStatusPill(o.status)}</td>
                  <td style={{ ...td, textAlign: "center" }}>{isOpen ? <ChevronUp size={14} color={colors.muted} /> : <ChevronDown size={14} color={colors.muted} />}</td>
                </tr>,
                isOpen && (
                  <tr key={`${o.id}-det`} style={{ borderBottom: `1px solid ${colors.borderLt}`, background: "#FCFBF8" }}>
                    <td colSpan={7} style={{ padding: 16 }}>
                      <div style={{ fontSize: 12, lineHeight: 1.9, maxWidth: 560 }}>
                        {[["Artikel", o.listingTitle], ["Käufer", o.buyerName], ["Verkäufer", o.sellerName], ["Betrag + Versand", `CHF ${fmtCHF(parseFloat(o.price || 0))} + ${fmtCHF(parseFloat(o.shipping_cost || 0))}`], ["Bee-Rate", det?.listing?.fee_percentage != null ? `${det.listing.fee_percentage}%` : "…"]].map(([k, v], i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${colors.borderLt}` }}><span style={{ color: colors.muted }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: colors.muted }}>Status</span><span>{orderStatusPill(o.status)}</span></div>
                      </div>
                      <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                        <a href={`/order/${o.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: colors.muted, background: colors.cream, borderRadius: 999, padding: "6px 13px", textDecoration: "none" }}>Bestellung ansehen</a>
                        {canDeposit && (
                          <div style={{ display: "inline-flex", background: colors.cream, borderRadius: 999, padding: 2 }}>
                            {[["Rechnung", false], ["Kaution", true]].map(([lbl, val]) => (
                              <button key={lbl} onClick={(e) => { e.stopPropagation(); setOrderDeposit(prev => ({ ...prev, [o.id]: val })); }} style={{ fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 999, border: "none", cursor: "pointer", background: deposit === val ? "#fff" : "transparent", color: deposit === val ? colors.dark : colors.muted }}>{lbl}</button>
                            ))}
                          </div>
                        )}
                        <a href={invoiceHref} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "6px 13px", textDecoration: "none" }}>Volle Rechnung öffnen</a>
                        {o.status !== "cancelled" && <button onClick={(e) => { e.stopPropagation(); if (confirm(`${ref} stornieren?`)) cancelOrder(o.id, o.listing_id); }} style={{ fontSize: 11, fontWeight: 600, color: "#c0392b", background: "#fff", border: "1px solid #e6a6a6", borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>Stornieren</button>}
                      </div>
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
