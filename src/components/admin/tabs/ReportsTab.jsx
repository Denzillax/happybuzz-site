"use client";
import Link from "next/link";
import { CheckCircle, Flag } from "lucide-react";
import { fmtDate } from "@/lib/formatters";
import { colors, fonts, radius } from "@/lib/theme";
import { pill } from "@/components/admin/adminStyles";

// Meldungs-Workflow: offen → in_pruefung → erledigt/abgelehnt
const REPORT_STATUS = {
  offen:       { label: "Offen",      bg: "#FFEBEE", color: "#c62828" },
  in_pruefung: { label: "In Prüfung", bg: "#FFF3E0", color: "#E65100" },
  erledigt:    { label: "Erledigt",   bg: "#E8F5E9", color: "#2E7D32" },
  abgelehnt:   { label: "Abgelehnt",  bg: "#f5f5f5", color: "#666" },
};
const normStatus = (r) => (r.status && REPORT_STATUS[r.status] ? r.status : (r.is_resolved ? "erledigt" : "offen"));

export function ReportsTab({ admin }) {
  const { reports, setReportStatus, pauseReportedListing } = admin;
  return (
    <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
      {reports.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <CheckCircle size={32} color={colors.green} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Keine Meldungen</p>
          <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>Alles sauber!</p>
        </div>
      ) : reports.map(r => {
        const st = normStatus(r);
        const closed = st === "erledigt" || st === "abgelehnt";
        return (
        <div key={r.id} style={{ padding: "13px 16px", borderBottom: `1px solid ${colors.borderLt}`, background: closed ? "#fafafa" : "transparent", opacity: st === "abgelehnt" ? 0.55 : closed ? 0.7 : 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Flag size={16} color={closed ? colors.muted : "#c62828"} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              {/* Inserat + Status */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                {r.listing_id && <Link href={`/listing/${r.listing_id}`} style={{ fontSize: 13, fontWeight: 700, color: colors.dark, textDecoration: "none" }}>{r.listingTitle}</Link>}
                {pill("#FFF3E0", "#E65100", r.reason || "?")}
                {pill(REPORT_STATUS[st].bg, REPORT_STATUS[st].color, REPORT_STATUS[st].label)}
                <div style={{ flex: 1 }} />
                <select value={st} onChange={e => setReportStatus(r.id, e.target.value)}
                  style={{ border: `1px solid ${colors.border}`, borderRadius: 10, padding: "4px 8px", fontSize: 11, fontFamily: fonts.body, background: "#fff", cursor: "pointer", flexShrink: 0 }}>
                  {Object.entries(REPORT_STATUS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select>
              </div>
              {/* Details */}
              <p style={{ margin: "0 0 4px", fontSize: 11, color: colors.muted }}>
                Gemeldet von <strong>{r.reporterName}</strong> · Besitzer: <strong>{r.ownerName}</strong> · {fmtDate(r.created_at)}
              </p>
              {r.description && <p style={{ margin: "0 0 6px", fontSize: 12, color: "#666" }}>{r.description}</p>}
              {/* Aktionen */}
              {!closed && (
                <div style={{ display: "flex", gap: 4 }}>
                  {r.listing_id && <button onClick={() => pauseReportedListing(r.id, r.listing_id)} style={{ padding: "4px 12px", borderRadius: 999, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Inserat pausieren</button>}
                  {r.listing_id && <Link href={`/listing/${r.listing_id}`} style={{ padding: "4px 12px", borderRadius: 999, background: colors.warm, color: colors.muted, fontSize: 10, fontWeight: 700, textDecoration: "none" }}>Ansehen</Link>}
                </div>
              )}
            </div>
          </div>
        </div>
      );})}
    </div>
  );
}
