"use client";
import { CheckCircle } from "lucide-react";
import { fmtCHF } from "@/lib/formatters";
import { colors, fonts, radius } from "@/lib/theme";

export function DunningTab({ admin }) {
  const { overdueInvoices, overdueSum, dunningDue, dunningSoon, dunningPaused, bulkSendDue, nextStageInfo, confirmAndReactivate, daysOverdue, STAGE_LABELS, dunningTimeline, setTab, setSearch } = admin;

  const card = (inv, opts = {}) => (
    <div key={inv.id} style={{ marginBottom: 10, borderRadius: radius.lg, border: `1px solid ${opts.paused ? colors.border : "#f0c9c9"}`, overflow: "hidden", padding: "14px 16px", background: opts.paused ? "#fff" : "#FFF8F8" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: colors.dark }}>{(inv.sellerName || "?")[0].toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}><span onClick={() => { setTab("users"); setSearch(inv.sellerName || ""); }} style={{ cursor: "pointer", textDecoration: "underline", textDecorationColor: "#d8b8b8" }}>{inv.sellerName}</span> <span style={{ fontFamily: "monospace", fontSize: 11, color: colors.muted, fontWeight: 400 }}>· {inv.invoice_ref}</span></div>
          <div style={{ fontSize: 11, color: "#c0392b", fontWeight: 600 }}>CHF {fmtCHF(inv.total_fees)} · {opts.paused ? "alle Stufen gesendet · Inserate pausiert" : `fällig seit ${daysOverdue(inv)} Tagen`}</div>
        </div>
        {opts.info && <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: opts.info.isDue ? "#E65100" : colors.muted, background: opts.info.isDue ? "#FFF3E0" : colors.cream, padding: "4px 10px", borderRadius: 999 }}>Nächste: {STAGE_LABELS[opts.info.level]} · {opts.info.isDue ? "heute fällig" : `in ${opts.info.daysUntil} Tagen`}</span>}
        <button onClick={() => confirmAndReactivate(inv.id, inv.seller_id)} style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#2E7D32", background: "#E8F5E9", border: "none", borderRadius: 999, padding: "7px 12px", cursor: "pointer", fontFamily: fonts.body }}>{opts.paused ? "Bezahlt + reaktivieren" : "Bezahlt"}</button>
      </div>
      {dunningTimeline(inv)}
    </div>
  );
  const groupHeader = (label, color) => <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color, margin: "16px 0 8px" }}>{label}</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: overdueInvoices.length ? "#c0392b" : colors.muted, background: overdueInvoices.length ? "#FFEBEB" : colors.cream, padding: "5px 12px", borderRadius: 999 }}>{overdueInvoices.length} überfällig · CHF {fmtCHF(overdueSum)} offen</span>
        {dunningDue.length > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#E65100", background: "#FFF3E0", padding: "5px 12px", borderRadius: 999 }}>{dunningDue.length} fällig</span>}
        {dunningDue.length > 0 && <button onClick={bulkSendDue} style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer", fontFamily: fonts.body }}>Alle fälligen senden ({dunningDue.length})</button>}
      </div>
      {overdueInvoices.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "20px 22px" }}>
          <CheckCircle size={22} color={colors.green} />
          <div><div style={{ fontSize: 14, fontWeight: 700 }}>Keine überfälligen Rechnungen</div><div style={{ fontSize: 12, color: colors.muted }}>Alles bezahlt oder noch nicht fällig.</div></div>
        </div>
      ) : (
        <>
          {dunningDue.length > 0 && groupHeader("Jetzt fällig", "#c0392b")}
          {dunningDue.map(inv => card(inv, { info: nextStageInfo(inv) }))}
          {dunningSoon.length > 0 && groupHeader("Bald fällig", colors.muted)}
          {dunningSoon.map(inv => card(inv, { info: nextStageInfo(inv) }))}
          {dunningPaused.length > 0 && groupHeader("Pausiert", colors.muted)}
          {dunningPaused.map(inv => card(inv, { paused: true }))}
        </>
      )}
    </div>
  );
}
