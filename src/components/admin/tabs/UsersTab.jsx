"use client";
import { fmtDate } from "@/lib/formatters";
import { colors, fonts, radius } from "@/lib/theme";
import { pill } from "@/components/admin/adminStyles";
import { UserProfile } from "@/components/admin/tabs/UserProfile";

export function UsersTab({ admin }) {
  const {
    filteredUsers, flaggedUsers, bannedUsers, userMod, setUserMod, visibleUsers,
    modPill, openProfile, openUserProfile, toggleBan,
  } = admin;

  if (openProfile) return <UserProfile admin={admin} />;

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ k: "all", l: `Alle (${filteredUsers.length})` }, { k: "flagged", l: `Geflaggt (${flaggedUsers.length})` }, { k: "banned", l: `Gesperrt (${bannedUsers.length})` }].map(f => (
          <button key={f.k} onClick={() => setUserMod(f.k)} style={modPill(userMod === f.k)}>{f.l}</button>
        ))}
      </div>

      {visibleUsers.length === 0 && (
        <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>
          {userMod === "flagged" ? "Keine geflaggten Konten." : userMod === "banned" ? "Keine gesperrten Konten." : "Keine Benutzer gefunden."}
        </div>
      )}

      {visibleUsers.map(u => {
        const rowTint = u.is_banned ? "#FFF6F6" : ((u.contact_violations || 0) > 0 ? "#FFFBF4" : "transparent");
        return (
          <div key={u.id} style={{ marginBottom: 10, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${u.is_banned ? "#f0c9c9" : colors.border}`, overflow: "hidden" }}>
            <div onClick={() => openUserProfile(u.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", background: rowTint }}
              onMouseEnter={e => { if (rowTint === "transparent") e.currentTarget.style.background = "#FAFAF8"; }}
              onMouseLeave={e => { if (rowTint === "transparent") e.currentTarget.style.background = "transparent"; }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: u.is_banned ? "#EDEDEA" : colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700, color: u.is_banned ? "#999" : colors.dark }}>
                {(u.display_name || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.display_name || "—"} <span style={{ fontWeight: 400, color: colors.muted, fontSize: 11 }}>@{u.username || "—"}</span>
                  {u.id_verified && <span style={{ marginLeft: 5, fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "#E6F5F5", color: "#0A7170", fontWeight: 700 }}>ID</span>}
                  {u.id_document_url && !u.id_verified && <span style={{ marginLeft: 5, fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "#FFF8E1", color: "#E65100", fontWeight: 700 }}>ID?</span>}
                  {u.is_banned && <span style={{ marginLeft: 5, fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "#EB5E55", color: "#fff", fontWeight: 700 }}>GESPERRT</span>}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.muted }}>{u.city || "—"} · {u.created_at ? fmtDate(u.created_at) : ""}</p>
              </div>
              {(u.contact_violations || 0) > 0 && !u.is_banned && (
                <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: "#c0392b", background: "#FFEBEB", padding: "4px 10px", borderRadius: 999 }}>{u.contact_violations}× Kontakt</span>
              )}
              <span className="admin-hide-narrow" style={{ flexShrink: 0 }}>{pill(colors.yellowSoft, colors.dark, u.bee_level || "starter")}</span>
              <span className="admin-hide-narrow" style={{ fontSize: 11, color: "#5B8C5A", fontWeight: 600, minWidth: 64, textAlign: "right" }}>{(u.blueten || 0).toLocaleString("de-CH")}</span>
              <button onClick={(e) => { e.stopPropagation(); toggleBan(u); }} style={{
                flexShrink: 0, padding: "6px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body, background: "#fff",
                border: `1px solid ${u.is_banned ? "#aed8b0" : "#e6a6a6"}`, color: u.is_banned ? "#2E7D32" : "#c0392b",
              }}>{u.is_banned ? "Entsperren" : "Sperren"}</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
