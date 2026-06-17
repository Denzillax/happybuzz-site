"use client";
import { Ban, CheckCircle, Pause, Play, BellRing, XCircle, ShieldCheck, Star, Megaphone, Clock, Building2 } from "lucide-react";
import { colors, radius } from "@/lib/theme";

export const AUDIT_META = {
  ban:                  { label: "Konto gesperrt",        Icon: Ban,         color: "#EB5E55", bg: "#FFEBEB" },
  unban:                { label: "Konto entsperrt",       Icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
  report_resolve:       { label: "Meldung erledigt",      Icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
  report_pause_listing: { label: "Inserat pausiert (Meldung)", Icon: Pause,  color: "#E65100", bg: "#FFF3E0" },
  listing_pause:        { label: "Inserat pausiert",      Icon: Pause,       color: "#E65100", bg: "#FFF3E0" },
  listing_activate:     { label: "Inserat aktiviert",     Icon: Play,        color: "#2E7D32", bg: "#E8F5E9" },
  listing_approve:      { label: "Inserat freigegeben",   Icon: Play,        color: "#2E7D32", bg: "#E8F5E9" },
  listing_reject:       { label: "Inserat abgelehnt",     Icon: XCircle,     color: "#c62828", bg: "#FFEBEE" },
  reminder:             { label: "Mahnung gesendet",      Icon: BellRing,    color: "#E65100", bg: "#FFF3E0" },
  fee_paid:             { label: "Bezahlt + reaktiviert", Icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9" },
  order_cancel:         { label: "Bestellung storniert",  Icon: XCircle,     color: "#c62828", bg: "#FFEBEE" },
  id_verify:            { label: "ID verifiziert",        Icon: ShieldCheck, color: "#0A7170", bg: "#E6F5F5" },
  id_reject:            { label: "ID abgelehnt",          Icon: XCircle,     color: "#c62828", bg: "#FFEBEE" },
  review_delete:        { label: "Bewertung gelöscht",    Icon: Star,        color: "#c62828", bg: "#FFEBEE" },
  broadcast:            { label: "Ankündigung gesendet",  Icon: Megaphone,   color: "#0E9493", bg: "#E6F5F5" },
  announcement_bar:     { label: "Banner geändert",       Icon: Megaphone,   color: "#0E9493", bg: "#E6F5F5" },
  company_update:       { label: "Firmendaten geändert",  Icon: Building2,   color: "#0E9493", bg: "#E6F5F5" },
};
const dayLabel = (ds) => {
  const d = new Date(ds), now = new Date(), DAY = 86400000;
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (t === t0) return "Heute";
  if (t === t0 - DAY) return "Gestern";
  return d.toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "long" });
};

export function AuditTab({ admin }) {
  const { auditLog, auditLoading, search, users } = admin;
  return (
    <div>
      {(() => {
        const filtered = auditLog.filter(a => !search || (a.target_label || "").toLowerCase().includes(search.toLowerCase()) || ((AUDIT_META[a.action]?.label) || a.action).toLowerCase().includes(search.toLowerCase()));
        if (auditLoading && filtered.length === 0) return <div style={{ padding: 40, textAlign: "center", color: colors.muted, fontSize: 13 }}>Lade Protokoll…</div>;
        if (filtered.length === 0) return <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>Noch keine protokollierten Aktionen.</div>;
        return filtered.map((a, i) => {
          const meta = AUDIT_META[a.action] || { label: a.action, Icon: Clock, color: colors.muted, bg: colors.cream };
          const Icon = meta.Icon;
          const day = dayLabel(a.created_at);
          const showHeader = i === 0 || day !== dayLabel(filtered[i - 1].created_at);
          const adminName = users.find(u => u.id === a.admin_id)?.display_name || "Admin";
          const time = a.created_at ? new Date(a.created_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }) : "";
          return (
            <div key={a.id}>
              {showHeader && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".07em", color: "#9E9E9E", textTransform: "uppercase", padding: "14px 0 4px" }}>{day}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={17} color={meta.color} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{meta.label}{a.action === "reminder" && a.detail?.level ? <span style={{ fontSize: 10, fontWeight: 700, color: "#E65100", background: "#FFF3E0", padding: "1px 7px", borderRadius: 999, marginLeft: 6 }}>Stufe {a.detail.level}</span> : null}</div>
                  <div style={{ fontSize: 11.5, color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.target_label || "—"}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ fontSize: 11, color: colors.muted }}>{time}</div><div style={{ fontSize: 10, color: "#bbb" }}>{adminName}</div></div>
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
}
