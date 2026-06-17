"use client";
import Link from "next/link";
import { CheckCircle, Flag } from "lucide-react";
import { fmtDate } from "@/lib/formatters";
import { colors, radius } from "@/lib/theme";
import { pill } from "@/components/admin/adminStyles";

export function ReportsTab({ admin }) {
  const { reports, resolveReport, pauseReportedListing } = admin;
  return (
    <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
      {reports.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <CheckCircle size={32} color={colors.green} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Keine Meldungen</p>
          <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>Alles sauber!</p>
        </div>
      ) : reports.map(r => (
        <div key={r.id} style={{ padding: "13px 16px", borderBottom: `1px solid ${colors.borderLt}`, background: r.is_resolved ? "#fafafa" : "transparent", opacity: r.is_resolved ? 0.6 : 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Flag size={16} color={r.is_resolved ? colors.muted : "#c62828"} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              {/* Inserat */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                {r.listing_id && <Link href={`/listing/${r.listing_id}`} style={{ fontSize: 13, fontWeight: 700, color: colors.dark, textDecoration: "none" }}>{r.listingTitle}</Link>}
                {pill("#FFF3E0", "#E65100", r.reason || "—")}
                {pill(r.is_resolved ? "#E8F5E9" : "#FFEBEE", r.is_resolved ? "#2E7D32" : "#c62828", r.is_resolved ? "Erledigt" : "Offen")}
              </div>
              {/* Details */}
              <p style={{ margin: "0 0 4px", fontSize: 11, color: colors.muted }}>
                Gemeldet von <strong>{r.reporterName}</strong> · Besitzer: <strong>{r.ownerName}</strong> · {fmtDate(r.created_at)}
              </p>
              {r.description && <p style={{ margin: "0 0 6px", fontSize: 12, color: "#666" }}>{r.description}</p>}
              {/* Aktionen */}
              {!r.is_resolved && (
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => resolveReport(r.id)} style={{ padding: "4px 12px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Erledigt</button>
                  {r.listing_id && <button onClick={() => pauseReportedListing(r.id, r.listing_id)} style={{ padding: "4px 12px", borderRadius: 999, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Inserat pausieren</button>}
                  {r.listing_id && <Link href={`/listing/${r.listing_id}`} style={{ padding: "4px 12px", borderRadius: 999, background: colors.warm, color: colors.muted, fontSize: 10, fontWeight: 700, textDecoration: "none" }}>Ansehen</Link>}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
