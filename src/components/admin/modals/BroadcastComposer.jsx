"use client";
import { Megaphone, CheckCircle } from "lucide-react";
import { colors, fonts } from "@/lib/theme";
import { bcFieldLabel, bcInput } from "@/components/admin/adminStyles";

// Rundruf-Formular: wird zweimal genutzt — als Modal (BroadcastComposer,
// Schnellzugriff aus der Übersicht) und eingebettet im Tab Kommunikation.
export function BroadcastForm({ admin, embedded = false }) {
  const { bcSegment, setBcSegment, bcUserQuery, setBcUserQuery, users, bcUserIds, setBcUserIds, bcTitle, setBcTitle, bcMessage, setBcMessage, bcLink, setBcLink, bcTargets, bcSending, sendBroadcast, bcEmail, setBcEmail, bcPush, setBcPush, bcMode, setBcMode, bcEffectiveTargets } = admin;
  const disabled = !bcTitle.trim() || !bcMessage.trim() || bcEffectiveTargets.length === 0 || bcSending;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={bcFieldLabel}>Zielgruppe</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", background: colors.cream, borderRadius: 999, padding: 3 }}>
            {[["all", "Alle"], ["private", "Privat"], ["business", "Unternehmen"], ["selected", "Einzelne"]].map(([k, l]) => (
              <button key={k} onClick={() => setBcSegment(k)} style={{ fontSize: 11, fontWeight: bcSegment === k ? 700 : 500, padding: "5px 13px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: fonts.body, background: bcSegment === k ? colors.dark : "transparent", color: bcSegment === k ? "#fff" : colors.muted }}>{l}</button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: "#0A7170", fontWeight: 600 }}>geht an {bcEffectiveTargets.length} Nutzer{bcMode === "newsletter" && bcEffectiveTargets.length < bcTargets.length ? ` (${bcTargets.length - bcEffectiveTargets.length} ohne Newsletter-Erlaubnis übersprungen)` : ""}</span>
        </div>
        {bcSegment === "selected" && (
          <div style={{ marginTop: 8 }}>
            <input value={bcUserQuery} onChange={e => setBcUserQuery(e.target.value)} placeholder="Nutzer suchen…" style={{ ...bcInput, marginBottom: 6 }} />
            <div style={{ maxHeight: 160, overflowY: "auto", border: `1px solid ${colors.border}`, borderRadius: 10 }}>
              {users.filter(u => { const q = bcUserQuery.toLowerCase().trim(); return !q || (u.display_name || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q); }).slice(0, 30).map(u => {
                const on = bcUserIds.includes(u.id);
                return (
                  <div key={u.id} onClick={() => setBcUserIds(prev => on ? prev.filter(id => id !== u.id) : [...prev, u.id])} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", cursor: "pointer", borderBottom: `1px solid ${colors.borderLt}`, background: on ? "#F3FAFA" : "transparent" }}>
                    {on ? <CheckCircle size={16} color={colors.teal} /> : <span style={{ width: 16, height: 16, borderRadius: 10, border: "1.5px solid #ccc", flexShrink: 0 }} />}
                    <span style={{ fontSize: 12, color: colors.dark }}>{u.display_name || "—"} <span style={{ color: colors.muted }}>@{u.username || "—"}</span></span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: colors.muted, marginTop: 4 }}>{bcUserIds.length} ausgewählt</div>
          </div>
        )}
      </div>
      <div>
        <div style={bcFieldLabel}>Art</div>
        <div style={{ display: "inline-flex", background: colors.cream, borderRadius: 999, padding: 3, marginBottom: 4 }}>
          {[["wichtig", "Wichtige Mitteilung"], ["newsletter", "Newsletter/Aktion"]].map(([k, l]) => (
            <button key={k} onClick={() => setBcMode(k)} style={{ fontSize: 11, fontWeight: bcMode === k ? 700 : 500, padding: "5px 13px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: fonts.body, background: bcMode === k ? colors.dark : "transparent", color: bcMode === k ? "#fff" : colors.muted }}>{l}</button>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: colors.muted, lineHeight: 1.5 }}>
          {bcMode === "newsletter"
            ? "Geht nur an Nutzer, die in den Einstellungen Newsletter/Aktionen erlaubt haben."
            : "Geht an alle in der Zielgruppe (für Plattform-Infos, nicht für Werbung)."}
        </div>
      </div>
      <div>
        <div style={bcFieldLabel}>Kanäle (Glocke immer)</div>
        <div style={{ display: "flex", gap: 14 }}>
          {[["E-Mail", bcEmail, setBcEmail], ["Push", bcPush, setBcPush]].map(([l, val, set]) => (
            <label key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: colors.dark, cursor: "pointer" }}>
              <input type="checkbox" checked={val} onChange={() => set(!val)} style={{ accentColor: colors.teal, width: 15, height: 15 }} />
              {l}
            </label>
          ))}
        </div>
      </div>
      <div>
        <div style={bcFieldLabel}>Titel</div>
        <input value={bcTitle} onChange={e => setBcTitle(e.target.value)} placeholder="z.B. Neue Funktion" style={bcInput} />
      </div>
      <div>
        <div style={bcFieldLabel}>Nachricht</div>
        <textarea value={bcMessage} onChange={e => setBcMessage(e.target.value)} rows={3} placeholder="Deine Ankündigung…" style={{ ...bcInput, resize: "vertical", lineHeight: 1.5 }} />
      </div>
      <div>
        <div style={bcFieldLabel}>Link (optional)</div>
        <input value={bcLink} onChange={e => setBcLink(e.target.value)} placeholder="/listings/new" style={bcInput} />
      </div>
      <div style={{ border: "1px dashed #cfd8d8", borderRadius: 10, padding: "11px 12px", background: "#F7FBFB" }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#0A7170", marginBottom: 7 }}>Vorschau in der Glocke</div>
        <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Megaphone size={15} color={colors.dark} /></div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.dark }}>{bcTitle || "Titel der Ankündigung"}</div>
            <div style={{ fontSize: 11.5, color: colors.muted, lineHeight: 1.45 }}>{bcMessage || "Text der Ankündigung…"}</div>
          </div>
        </div>
      </div>
      {embedded && (
        <button onClick={sendBroadcast} disabled={disabled} style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "11px 0", cursor: disabled ? "default" : "pointer", fontFamily: fonts.body, opacity: disabled ? 0.5 : 1 }}>
          {bcSending ? "Sende…" : `An ${bcEffectiveTargets.length} senden${bcEmail || bcPush ? ` (${["Glocke", bcEmail && "Mail", bcPush && "Push"].filter(Boolean).join("+")})` : ""}`}
        </button>
      )}
    </div>
  );
}

export function BroadcastComposer({ admin }) {
  const { broadcastOpen, setBroadcastOpen, bcTitle, bcMessage, bcSending, sendBroadcast, bcEmail, bcPush, bcEffectiveTargets } = admin;
  if (!broadcastOpen) return null;
  const disabled = !bcTitle.trim() || !bcMessage.trim() || bcEffectiveTargets.length === 0 || bcSending;
  return (
    <div onClick={() => setBroadcastOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(25,22,21,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: "100%", background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.2)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#1a1a1a", padding: "14px 18px", display: "flex", alignItems: "center", gap: 9 }}>
          <Megaphone size={17} color={colors.yellow} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Ankündigung senden</span>
        </div>
        <div style={{ padding: "16px 18px", overflowY: "auto" }}>
          <BroadcastForm admin={admin} />
        </div>
        <div style={{ display: "flex", gap: 8, padding: "13px 18px", borderTop: `1px solid ${colors.borderLt}` }}>
          <button onClick={() => setBroadcastOpen(false)} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
          <button onClick={sendBroadcast} disabled={disabled} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "10px 0", cursor: disabled ? "default" : "pointer", fontFamily: fonts.body, opacity: disabled ? 0.5 : 1 }}>{bcSending ? "Sende…" : `An ${bcEffectiveTargets.length} senden${bcEmail || bcPush ? ` (${["Glocke", bcEmail && "Mail", bcPush && "Push"].filter(Boolean).join("+")})` : ""}`}</button>
        </div>
      </div>
    </div>
  );
}
