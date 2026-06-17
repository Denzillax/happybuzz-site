"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { fmtCHF } from "@/lib/formatters";
import { colors, radius } from "@/lib/theme";
import { makeBeeRef } from "@/lib/fees";

export function OrdersTab({ admin }) {
  const { filteredOrders, orderStatusFilter, setOrderStatusFilter, openOrder, toggleOrder, orderDetail, orderDeposit, setOrderDeposit, orderStatusPill, cancelOrder, modPill } = admin;
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ k: "all", l: "Alle" }, { k: "open", l: "Offen" }, { k: "done", l: "Abgeschlossen" }, { k: "cancelled", l: "Storniert" }].map(f => (
          <button key={f.k} onClick={() => setOrderStatusFilter(f.k)} style={modPill(orderStatusFilter === f.k)}>{f.l}</button>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>Keine Bestellungen gefunden.</div>
      )}

      {filteredOrders.map(o => {
        const ref = makeBeeRef(o.id);
        const isOpen = openOrder === o.id;
        const det = orderDetail[o.id];
        const deposit = !!orderDeposit[o.id];
        const total = parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0);
        const canDeposit = det?.listing?.listing_type === "rent" && parseFloat(det?.listing?.deposit_amount || 0) > 0;
        const invoiceHref = `/order/${o.id}/invoice${deposit ? "?type=deposit" : ""}`;
        return (
          <div key={o.id} style={{ marginBottom: 10, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${isOpen ? colors.teal : colors.border}`, overflow: "hidden", opacity: o.status === "cancelled" ? 0.7 : 1 }}>
            <div onClick={() => toggleOrder(o.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer", background: isOpen ? "#F3FAFA" : "transparent" }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: isOpen ? "#0A7170" : colors.muted, minWidth: 90 }}>{ref}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.listingTitle} <span style={{ fontWeight: 400, color: colors.muted }}>· {o.buyerName} → {o.sellerName}</span></span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>CHF {fmtCHF(total)}</span>
              {orderStatusPill(o.status)}
              {isOpen ? <ChevronUp size={15} color={colors.muted} /> : <ChevronDown size={15} color={colors.muted} />}
            </div>
            {isOpen && (
              <div style={{ padding: 16, borderTop: `1px solid ${colors.borderLt}` }}>
                <div style={{ fontSize: 12, lineHeight: 1.9 }}>
                  {[["Artikel", o.listingTitle], ["Käufer", o.buyerName], ["Verkäufer", o.sellerName], ["Betrag + Versand", `CHF ${fmtCHF(parseFloat(o.price || 0))} + ${fmtCHF(parseFloat(o.shipping_cost || 0))}`], ["Bee-Rate", det?.listing?.fee_percentage != null ? `${det.listing.fee_percentage}%` : "…"]].map(([k, v], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${colors.borderLt}` }}><span style={{ color: colors.muted }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: colors.muted }}>Status</span><span>{orderStatusPill(o.status)}</span></div>
                  <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <a href={`/order/${o.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: colors.muted, background: colors.cream, borderRadius: 999, padding: "6px 13px", textDecoration: "none" }}>Bestellung ansehen</a>
                    {canDeposit && (
                      <div style={{ display: "inline-flex", background: colors.cream, borderRadius: 999, padding: 2 }}>
                        {[["Rechnung", false], ["Kaution", true]].map(([lbl, val]) => (
                          <button key={lbl} onClick={() => setOrderDeposit(prev => ({ ...prev, [o.id]: val }))} style={{ fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 999, border: "none", cursor: "pointer", background: deposit === val ? "#fff" : "transparent", color: deposit === val ? colors.dark : colors.muted }}>{lbl}</button>
                        ))}
                      </div>
                    )}
                    <a href={invoiceHref} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "6px 13px", textDecoration: "none" }}>Volle Rechnung öffnen</a>
                    {o.status !== "cancelled" && <button onClick={() => { if (confirm(`${ref} stornieren?`)) cancelOrder(o.id, o.listing_id); }} style={{ fontSize: 11, fontWeight: 600, color: "#c0392b", background: "#fff", border: "1px solid #e6a6a6", borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>Stornieren</button>}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
