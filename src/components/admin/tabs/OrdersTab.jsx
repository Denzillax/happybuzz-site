"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { fmtCHF, fmtDate } from "@/lib/formatters";
import { colors, radius, fonts } from "@/lib/theme";
import { makeBeeRef } from "@/lib/fees";
import { th, td, useSort, SortTh } from "@/components/admin/adminStyles";

// Aufgeklapptes Detail — identisch fuer Tabellenzeile (Desktop) und Karte (Mobil)
function OrderDetail({ o, det, deposit, setOrderDeposit, orderStatusPill, cancelOrder, refText }) {
  const canDeposit = det?.listing?.listing_type === "rent" && parseFloat(det?.listing?.deposit_amount || 0) > 0;
  const invoiceHref = `/order/${o.id}/invoice${deposit ? "?type=deposit" : ""}`;
  return (
    <>
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
        {o.status !== "cancelled" && <button onClick={(e) => { e.stopPropagation(); if (confirm(`${refText} stornieren?`)) cancelOrder(o.id, o.listing_id); }} style={{ fontSize: 11, fontWeight: 600, color: "#c0392b", background: "#fff", border: "1px solid #e6a6a6", borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>Stornieren</button>}
      </div>
    </>
  );
}

// Bestellungen: sortierbare Tabelle (Desktop) + Karten (Mobil), Detail aufklappbar.
export function OrdersTab({ admin }) {
  const { filteredOrders, orderStatusFilter, setOrderStatusFilter, openOrder, toggleOrder, orderDetail, orderDeposit, setOrderDeposit, orderStatusPill, cancelOrder, modPill } = admin;

  const sort = useSort(filteredOrders, (o, key) => {
    if (key === "ref") return makeBeeRef(o.id);
    if (key === "artikel") return o.listingTitle || "";
    if (key === "kaeufer") return o.buyerName || "";
    if (key === "datum") return o.created_at || "";
    if (key === "betrag") return parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0);
    if (key === "status") return o.status || "";
    return null;
  });

  const detailProps = { setOrderDeposit, orderStatusPill, cancelOrder };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ k: "all", l: "Alle" }, { k: "open", l: "Offen" }, { k: "done", l: "Abgeschlossen" }, { k: "cancelled", l: "Storniert" }].map(f => (
          <button key={f.k} onClick={() => setOrderStatusFilter(f.k)} style={modPill(orderStatusFilter === f.k)}>{f.l}</button>
        ))}
      </div>

      <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {sort.sorted.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13 }}>Keine Bestellungen gefunden.</div>
        ) : (
        <>
        <table className="po-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cream }}>
            <SortTh label="Nr" k="ref" sort={sort} />
            <SortTh label="Artikel" k="artikel" sort={sort} />
            <SortTh label="Käufer → Verkäufer" k="kaeufer" sort={sort} />
            <SortTh label="Datum" k="datum" sort={sort} />
            <SortTh label="Betrag" k="betrag" sort={sort} align="right" />
            <SortTh label="Status" k="status" sort={sort} align="center" />
            <th style={{ ...th, width: 34 }} />
          </tr></thead>
          <tbody>
            {sort.sorted.map(o => {
              const ref = makeBeeRef(o.id);
              const isOpen = openOrder === o.id;
              const det = orderDetail[o.id];
              const deposit = !!orderDeposit[o.id];
              const total = parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0);
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
                      <OrderDetail o={o} det={det} deposit={deposit} refText={ref} {...detailProps} />
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>

        {/* Mobil: Karten, Antippen klappt das gleiche Detail auf */}
        <div className="po-cards">
          {sort.sorted.map(o => {
            const ref = makeBeeRef(o.id);
            const isOpen = openOrder === o.id;
            const det = orderDetail[o.id];
            const deposit = !!orderDeposit[o.id];
            const total = parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0);
            return (
              <div key={o.id} style={{ borderBottom: `1px solid ${colors.borderLt}`, fontFamily: fonts.body, opacity: o.status === "cancelled" ? 0.65 : 1 }}>
                <div onClick={() => toggleOrder(o.id)} style={{ padding: "12px 14px", cursor: "pointer", background: isOpen ? "#F3FAFA" : undefined }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.listingTitle}</p>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: colors.muted }}>{ref} · {o.created_at ? fmtDate(o.created_at) : "…"}</span>
                    </div>
                    {isOpen ? <ChevronUp size={15} color={colors.muted} /> : <ChevronDown size={15} color={colors.muted} />}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>CHF {fmtCHF(total)}</span>
                    {orderStatusPill(o.status)}
                    <span style={{ fontSize: 12, color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.buyerName} → {o.sellerName}</span>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ padding: "0 14px 14px", background: "#FCFBF8" }}>
                    <OrderDetail o={o} det={det} deposit={deposit} refText={ref} {...detailProps} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
