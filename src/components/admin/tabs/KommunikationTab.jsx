"use client";
// Tab Kommunikation: alles, was an Nutzer rausgeht, an einem Ort.
// Links der Banner-Editor (Balken ueber dem Header), rechts der Rundruf
// (Glocke/Mail/Push), darunter die Versand-Historie aus dem Audit-Log.
import { useState, useEffect } from "react";
import { Megaphone, Send, History } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts } from "@/lib/theme";
import { ANNOUNCEMENT_PRESETS, getAnnouncement } from "@/lib/announcement";
import { bcInput } from "@/components/admin/adminStyles";
import { BroadcastForm } from "@/components/admin/modals/BroadcastComposer";

const Card = ({ icon: Icon, title, children }) => (
  <div style={{ background: "#fff", border: `1px solid ${colors.dark}`, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: `2px solid ${colors.dark}`, paddingBottom: 10 }}>
      <Icon size={16} color={colors.dark} />
      <span style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 11.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: colors.dark }}>{title}</span>
    </div>
    {children}
  </div>
);

export function KommunikationTab({ admin }) {
  const { ann, setAnn, saveAnnouncement } = admin;
  const [history, setHistory] = useState(null);

  // Aktuellen Banner-Zustand laden (sonst zeigt das Formular die Defaults)
  useEffect(() => {
    getAnnouncement().then(row => {
      if (row) setAnn({ enabled: !!row.enabled, message: row.message || "", bg_color: row.bg_color || "#0E9493", text_color: row.text_color || "#FFFFFF", effect: row.effect || "none" });
    });
  }, [setAnn]);

  // Versand-Historie: Rundrufe + Banner-Aenderungen aus dem Audit-Log
  useEffect(() => {
    supabase.from("admin_audit_log")
      .select("action, target_label, detail, created_at")
      .in("action", ["broadcast", "announcement_bar"])
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setHistory(data || []));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="kom-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "start" }}>

        {/* ── Banner ── */}
        <Card icon={Megaphone} title="Banner über dem Header">
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: colors.dark }}>
            <input type="checkbox" checked={ann.enabled} onChange={e => setAnn({ ...ann, enabled: e.target.checked })} style={{ accentColor: colors.teal, width: 15, height: 15 }} /> Balken aktiv
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
          <button onClick={saveAnnouncement} style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "11px 0", cursor: "pointer", fontFamily: fonts.body }}>
            {ann.enabled ? "Speichern + aktiv schalten" : "Speichern (Balken aus)"}
          </button>
        </Card>

        {/* ── Rundruf ── */}
        <Card icon={Send} title="Rundruf (Glocke, Mail, Push)">
          <BroadcastForm admin={admin} embedded />
        </Card>
      </div>

      {/* ── Historie ── */}
      <Card icon={History} title={`Versand-Historie${history ? ` · ${history.length} Einträge` : ""}`}>
        {history === null ? (
          <div style={{ fontSize: 13, color: colors.muted }}>Wird geladen…</div>
        ) : history.length === 0 ? (
          <div style={{ fontSize: 13, color: colors.muted }}>Noch nichts versendet.</div>
        ) : (
          <div>
            {history.map((h, i) => {
              const d = h.detail || {};
              const isBc = h.action === "broadcast";
              const teile = isBc
                ? [
                    `Glocke ${d.count ?? "?"}`,
                    d.mails != null ? `Mail ${d.mails}` : null,
                    d.pushes != null ? `Push ${d.pushes}` : null,
                    d.mode === "newsletter" ? "Newsletter" : null,
                    d.segment && d.segment !== "all" ? `Zielgruppe: ${d.segment}` : null,
                  ].filter(Boolean).join(" · ")
                : `Banner ${h.target_label}${d.message ? ` · "${String(d.message).slice(0, 60)}"` : ""}`;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "44px 130px 1fr", columnGap: 10, alignItems: "start", padding: "7px 0", borderBottom: i < history.length - 1 ? "1px solid rgba(20,17,13,.08)" : "none", fontSize: 12.5 }}>
                  <span style={{ fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: ".06em", padding: "2px 0", textAlign: "center", background: isBc ? "#0E9493" : colors.yellow, color: isBc ? "#fff" : colors.dark }}>{isBc ? "RUF" : "BANNER"}</span>
                  <span style={{ color: colors.muted, fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 11 }}>{new Date(h.created_at).toLocaleString("de-CH", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  <span style={{ minWidth: 0 }}>
                    <b>{isBc ? h.target_label : "Balken geändert"}</b>
                    <span style={{ color: colors.muted }}> · {teile}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
