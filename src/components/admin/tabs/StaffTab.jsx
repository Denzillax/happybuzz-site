"use client";
import { useState } from "react";
import { colors, fonts, radius } from "@/lib/theme";
import { ROLE_LABELS } from "@/lib/staff";

export function StaffTab({ admin }) {
  const { users, staffRoles, setStaffRole, isOwner } = admin;
  const [q, setQ] = useState("");
  if (!isOwner) return null;
  const roleEntries = Object.keys(ROLE_LABELS);
  const ql = q.toLowerCase().trim();
  const list = users.filter(u => !ql || (u.display_name || "").toLowerCase().includes(ql) || (u.username || "").toLowerCase().includes(ql));
  return (
    <div>
      <p style={{ fontSize: 13, color: colors.muted, margin: "0 0 14px" }}>Weise Nutzern eine Admin-Rolle zu. Sie sehen dann nur die Tabs ihrer Rolle. Firma und Mitarbeiter bleiben dir vorbehalten.</p>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Nutzer suchen…" style={{ width: "100%", maxWidth: 360, border: `1px solid ${colors.border}`, borderRadius: 999, padding: "9px 15px", fontSize: 13, fontFamily: fonts.body, outline: "none", marginBottom: 14, boxSizing: "border-box" }} />
      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.lg, overflow: "hidden" }}>
        {list.slice(0, 50).map(u => {
          const role = staffRoles[u.id] || "";
          return (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: `1px solid ${colors.borderLt}` }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: role ? colors.yellowSoft : "#EDEDEA", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: colors.dark, flexShrink: 0 }}>{(u.display_name || "?")[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.display_name || "—"} <span style={{ fontWeight: 400, color: colors.muted, fontSize: 11 }}>@{u.username || "—"}</span></div>
                {role && <div style={{ fontSize: 11, color: "#0A7170", fontWeight: 600 }}>{ROLE_LABELS[role]}</div>}
              </div>
              <select value={role} onChange={e => setStaffRole(u.id, e.target.value)} style={{ border: `1px solid ${colors.border}`, borderRadius: 0, padding: "7px 10px", fontSize: 12, fontFamily: fonts.body, background: "#fff", cursor: "pointer", flexShrink: 0 }}>
                <option value="">Keine Rolle</option>
                {roleEntries.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
