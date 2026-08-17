"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { fmtCHF, fmtDate } from "@/lib/formatters";
import { colors, fonts, radius } from "@/lib/theme";
import { makeBeeRef, makeArtRef } from "@/lib/fees";
import { pill, th, td, useSort, SortTh } from "@/components/admin/adminStyles";

// Detail-Inhalte — identisch fuer Tabellenzeile (Desktop) und Karte (Mobil)
function BeeDetail({ r }) {
  return (
    <>
      <div style={{ maxWidth: 560, fontSize: 12, lineHeight: 1.9 }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${colors.borderLt}` }}><span style={{ color: colors.muted }}>Käufer → Verkäufer</span><span style={{ fontWeight: 500 }}>{r.payer} → {r.payee}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: colors.muted }}>Betrag</span><span style={{ fontWeight: 600 }}>CHF {fmtCHF(r.amount)}</span></div>
      </div>
      <a href={`/order/${r.id}/invoice`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "7px 16px", textDecoration: "none" }}>Volle Rechnung öffnen</a>
    </>
  );
}

function FeeDetail({ inv, feeLedger, dunningTimeline, mahnButton, confirmAndReactivate }) {
  const ledger = feeLedger[inv.id] || [];
  return (
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
  );
}

// Rechnungen: sortierbare Tabelle (Desktop) + Karten (Mobil), Detail aufklappbar.
export function InvoicesTab({ admin }) {
  const { invoiceType, setInvoiceType, invoiceRows, openInvoiceKey, toggleInvoiceRow, sc, feeLedger, dunningTimeline, mahnButton, confirmAndReactivate, modPill } = admin;

  const sort = useSort(invoiceRows, (r, key) => {
    if (key === "ref") return r.ref || "";
    if (key === "kind") return r.kind || "";
    if (key === "payer") return r.payer || "";
    if (key === "amount") return parseFloat(r.amount || 0);
    if (key === "status") return r.status || "";
    return null;
  });

  const feeProps = { feeLedger, dunningTimeline, mahnButton, confirmAndReactivate };
  const statusOf = (r) => sc[r.status] || (r.status === "cancelled" ? { bg: "#FFEBEE", color: "#c62828", label: "Storniert" } : { bg: "#E3F2FD", color: "#1565C0", label: "Offen" });
  const badgeOf = (r) => r.kind === "bee" ? pill("#E6F5F5", "#0A7170", "BEE") : pill("#FFF5D8", "#5c4708", "FEE");

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ k: "all", l: "Alle" }, { k: "bee", l: "Bestell-Rechnungen (BEE)" }, { k: "fee", l: "Gebühren-Rechnungen (FEE)" }].map(f => (
          <button key={f.k} onClick={() => setInvoiceType(f.k)} style={modPill(invoiceType === f.k)}>{f.l}</button>
        ))}
      </div>

      <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {sort.sorted.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13 }}>Keine Rechnungen gefunden.</div>
        ) : (
        <>
        <table className="po-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cream }}>
            <SortTh label="Nr" k="ref" sort={sort} />
            <SortTh label="Typ" k="kind" sort={sort} />
            <SortTh label="Von → An" k="payer" sort={sort} />
            <SortTh label="Betrag" k="amount" sort={sort} align="right" />
            <SortTh label="Status" k="status" sort={sort} align="center" />
            <th style={{ ...th, width: 34 }} />
          </tr></thead>
          <tbody>
            {sort.sorted.map(r => {
              const key = `${r.kind}:${r.id}`;
              const isOpen = openInvoiceKey === key;
              const sc2 = statusOf(r);
              return [
                <tr key={key} onClick={() => toggleInvoiceRow(r.kind, r.kind === "bee" ? r.id : r.inv)} className="adm-row"
                  style={{ borderBottom: `1px solid ${colors.borderLt}`, cursor: "pointer", background: isOpen ? "#F3FAFA" : undefined }}>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: isOpen ? "#0A7170" : colors.muted, whiteSpace: "nowrap" }}>{r.ref}</td>
                  <td style={td}>{badgeOf(r)}</td>
                  <td style={{ ...td, color: colors.muted, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.payer} → {r.payee}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>CHF {fmtCHF(r.amount)}</td>
                  <td style={{ ...td, textAlign: "center" }}>{pill(sc2.bg, sc2.color, sc2.label)}</td>
                  <td style={{ ...td, textAlign: "center" }}>{isOpen ? <ChevronUp size={14} color={colors.muted} /> : <ChevronDown size={14} color={colors.muted} />}</td>
                </tr>,
                isOpen && (
                  <tr key={`${key}-det`} style={{ borderBottom: `1px solid ${colors.borderLt}`, background: "#FCFBF8" }}>
                    <td colSpan={6} style={{ padding: 16 }}>
                      {r.kind === "bee" ? <BeeDetail r={r} /> : <FeeDetail inv={r.inv} {...feeProps} />}
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>

        {/* Mobil: Karten mit denselben aufklappbaren Details */}
        <div className="po-cards">
          {sort.sorted.map(r => {
            const key = `${r.kind}:${r.id}`;
            const isOpen = openInvoiceKey === key;
            const sc2 = statusOf(r);
            return (
              <div key={key} style={{ borderBottom: `1px solid ${colors.borderLt}`, fontFamily: fonts.body }}>
                <div onClick={() => toggleInvoiceRow(r.kind, r.kind === "bee" ? r.id : r.inv)} style={{ padding: "12px 14px", cursor: "pointer", background: isOpen ? "#F3FAFA" : undefined }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: colors.dark }}>{r.ref}</span>
                    {isOpen ? <ChevronUp size={15} color={colors.muted} /> : <ChevronDown size={15} color={colors.muted} />}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    {badgeOf(r)}
                    <span style={{ fontSize: 13, fontWeight: 700 }}>CHF {fmtCHF(r.amount)}</span>
                    {pill(sc2.bg, sc2.color, sc2.label)}
                  </div>
                  <p style={{ margin: "5px 0 0", fontSize: 12, color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.payer} → {r.payee}</p>
                </div>
                {isOpen && (
                  <div style={{ padding: "0 14px 14px", background: "#FCFBF8" }}>
                    {r.kind === "bee" ? <BeeDetail r={r} /> : <FeeDetail inv={r.inv} {...feeProps} />}
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
