"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { fmtCHF, fmtDate } from "@/lib/formatters";
import { colors, fonts, radius } from "@/lib/theme";
import { makeBeeRef, makeArtRef } from "@/lib/fees";
import { pill, th, td } from "@/components/admin/adminStyles";

// Rechnungen als echte Tabelle (gleiches Muster wie ListingsTab/OrdersTab):
// feste Spalten, Betraege rechtsbuendig, Detail als aufklappbare Zeile.
export function InvoicesTab({ admin }) {
  const { invoiceType, setInvoiceType, invoiceRows, openInvoiceKey, toggleInvoiceRow, sc, feeLedger, dunningTimeline, mahnButton, confirmAndReactivate, modPill } = admin;
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ k: "all", l: "Alle" }, { k: "bee", l: "Bestell-Rechnungen (BEE)" }, { k: "fee", l: "Gebühren-Rechnungen (FEE)" }].map(f => (
          <button key={f.k} onClick={() => setInvoiceType(f.k)} style={modPill(invoiceType === f.k)}>{f.l}</button>
        ))}
      </div>

      <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {invoiceRows.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13 }}>Keine Rechnungen gefunden.</div>
        ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cream }}>
            <th style={th}>Nr</th><th style={th}>Typ</th><th style={th}>Von → An</th>
            <th style={{ ...th, textAlign: "right" }}>Betrag</th>
            <th style={{ ...th, textAlign: "center" }}>Status</th><th style={{ ...th, width: 34 }} />
          </tr></thead>
          <tbody>
            {invoiceRows.map(r => {
              const key = `${r.kind}:${r.id}`;
              const isOpen = openInvoiceKey === key;
              const typeBadge = r.kind === "bee" ? pill("#E6F5F5", "#0A7170", "BEE") : pill("#FFF5D8", "#5c4708", "FEE");
              const sc2 = sc[r.status] || (r.status === "cancelled" ? { bg: "#FFEBEE", color: "#c62828", label: "Storniert" } : { bg: "#E3F2FD", color: "#1565C0", label: "Offen" });
              return [
                <tr key={key} onClick={() => toggleInvoiceRow(r.kind, r.kind === "bee" ? r.id : r.inv)} className="adm-row"
                  style={{ borderBottom: `1px solid ${colors.borderLt}`, cursor: "pointer", background: isOpen ? "#F3FAFA" : undefined }}>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: isOpen ? "#0A7170" : colors.muted, whiteSpace: "nowrap" }}>{r.ref}</td>
                  <td style={td}>{typeBadge}</td>
                  <td style={{ ...td, color: colors.muted, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.payer} → {r.payee}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>CHF {fmtCHF(r.amount)}</td>
                  <td style={{ ...td, textAlign: "center" }}>{pill(sc2.bg, sc2.color, sc2.label)}</td>
                  <td style={{ ...td, textAlign: "center" }}>{isOpen ? <ChevronUp size={14} color={colors.muted} /> : <ChevronDown size={14} color={colors.muted} />}</td>
                </tr>,
                isOpen && r.kind === "bee" && (
                  <tr key={`${key}-det`} style={{ borderBottom: `1px solid ${colors.borderLt}`, background: "#FCFBF8" }}>
                    <td colSpan={6} style={{ padding: 16, fontSize: 12, lineHeight: 1.9 }}>
                      <div style={{ maxWidth: 560 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${colors.borderLt}` }}><span style={{ color: colors.muted }}>Käufer → Verkäufer</span><span style={{ fontWeight: 500 }}>{r.payer} → {r.payee}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: colors.muted }}>Betrag</span><span style={{ fontWeight: 600 }}>CHF {fmtCHF(r.amount)}</span></div>
                      </div>
                      <a href={`/order/${r.id}/invoice`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "7px 16px", textDecoration: "none" }}>Volle Rechnung öffnen</a>
                    </td>
                  </tr>
                ),
                isOpen && r.kind === "fee" && (() => {
                  const inv = r.inv;
                  const ledger = feeLedger[inv.id] || [];
                  return (
                    <tr key={`${key}-det`} style={{ borderBottom: `1px solid ${colors.borderLt}`, background: "#FCFBF8" }}>
                      <td colSpan={6} style={{ padding: 16 }}>
                        <div style={{ fontSize: 12, maxWidth: 640 }}>
                          {ledger.map(f => (
                            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                              <span>{fmtDate(f.created_at)} · {f.purchase_id ? makeBeeRef(f.purchase_id) + " · " : ""}{f.listing_id ? makeArtRef(f.listing_id) + " · " : ""}{f.listing_title}</span><span style={{ fontWeight: 600 }}>CHF {fmtCHF(f.fee_amount)}</span>
                            </div>
                          ))}
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#5B8C5A" }}><span>Bee-Impact</span><span>CHF {fmtCHF(inv.total_bee_impact)}</span></div>
                          {dunningTimeline(inv)}
                          {inv.status !== "paid" ? (
                            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                              {mahnButton(inv)}
                              <button onClick={(e) => { e.stopPropagation(); confirmAndReactivate(inv.id, inv.seller_id); }} style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Bezahlt</button>
                            </div>
                          ) : <p style={{ margin: "8px 0 0", fontSize: 11, color: "#2E7D32" }}>Bezahlt am {fmtDate(inv.paid_at)}</p>}
                          <a href={`/fees/invoice/${inv.id}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 12, fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "7px 16px", textDecoration: "none" }}>Volle Rechnung öffnen</a>
                        </div>
                      </td>
                    </tr>
                  );
                })(),
              ];
            })}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
