"use client";
import { Megaphone } from "lucide-react";
import { colors, fonts } from "@/lib/theme";
import { ANNOUNCEMENT_PRESETS } from "@/lib/announcement";
import { bcInput } from "@/components/admin/adminStyles";

export function BannerModal({ admin }) {
  const { annOpen, setAnnOpen, ann, setAnn, saveAnnouncement } = admin;
  if (!annOpen) return null;
  return (
    <div onClick={() => setAnnOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(25,22,21,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: "100%", background: "#fff", borderRadius: 0, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
        <div style={{ background: "#1a1a1a", padding: "14px 18px", display: "flex", alignItems: "center", gap: 9 }}>
          <Megaphone size={17} color={colors.yellow} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Ankündigungsbalken</span>
        </div>
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: colors.dark }}>
            <input type="checkbox" checked={ann.enabled} onChange={e => setAnn({ ...ann, enabled: e.target.checked })} /> Balken aktiv
          </label>
          <input value={ann.message} onChange={e => setAnn({ ...ann, message: e.target.value })} placeholder="Text des Balkens…" style={{ ...bcInput }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>Farbe</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ANNOUNCEMENT_PRESETS.map(p => (
                <button key={p.name} onClick={() => setAnn({ ...ann, bg_color: p.bg, text_color: p.text })} style={{ background: p.bg, color: p.text, border: `2px solid ${ann.bg_color === p.bg ? colors.dark : "transparent"}`, borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{p.name}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <label style={{ fontSize: 11, color: colors.muted, display: "flex", alignItems: "center", gap: 5 }}>BG <input value={ann.bg_color} onChange={e => setAnn({ ...ann, bg_color: e.target.value })} style={{ width: 90, ...bcInput, padding: "5px 8px" }} /></label>
              <label style={{ fontSize: 11, color: colors.muted, display: "flex", alignItems: "center", gap: 5 }}>Text <input value={ann.text_color} onChange={e => setAnn({ ...ann, text_color: e.target.value })} style={{ width: 90, ...bcInput, padding: "5px 8px" }} /></label>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>Animation</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[["none", "Keine"], ["marquee", "Laufschrift"], ["slide", "Einfliegen"], ["pulse", "Pulsieren"]].map(([k, lbl]) => (
                <button key={k} onClick={() => setAnn({ ...ann, effect: k })} style={{ background: ann.effect === k ? colors.dark : "#fff", color: ann.effect === k ? "#fff" : colors.dark, border: `1px solid ${colors.border}`, borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{lbl}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>Vorschau</div>
            <div style={{ background: ann.bg_color, color: ann.text_color, fontSize: 13, fontWeight: 600, padding: "9px 14px", borderRadius: 0, textAlign: "center" }}>
              <Megaphone size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{ann.message || "Vorschau-Text"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, padding: "12px 18px", borderTop: "1px solid #EEEEEE" }}>
          <button onClick={() => setAnnOpen(false)} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
          <button onClick={saveAnnouncement} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Speichern</button>
        </div>
      </div>
    </div>
  );
}
