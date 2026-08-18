"use client";
// Tab Kommunikation: alles, was an Nutzer rausgeht, an einem Ort.
// Banner-Editor und Laufschrift (je mit grosser Live-Vorschau zuoberst),
// daneben der Rundruf, darunter die Versand-Historie aus dem Audit-Log.
import { useState, useEffect } from "react";
import { Megaphone, Send, History, Tv } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts } from "@/lib/theme";
import { ANNOUNCEMENT_PRESETS, getAnnouncement, getTicker } from "@/lib/announcement";
import { bcInput } from "@/components/admin/adminStyles";
import { BroadcastForm } from "@/components/admin/modals/BroadcastComposer";

const MONO = "'Space Mono', ui-monospace, monospace";

const Card = ({ icon: Icon, title, children }) => (
  <div style={{ background: "#fff", border: `1px solid ${colors.dark}`, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: `2px solid ${colors.dark}`, paddingBottom: 10 }}>
      <Icon size={16} color={colors.dark} />
      <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: colors.dark }}>{title}</span>
    </div>
    {children}
  </div>
);

// Beschriftete Zeile: Label links in Mono, Inhalt rechts — gleiche Optik ueberall
const Row = ({ label, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", alignItems: "center", gap: 12 }}>
    <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: colors.muted }}>{label}</span>
    <div style={{ minWidth: 0 }}>{children}</div>
  </div>
);

const Toggle = ({ on, onChange }) => (
  <button onClick={onChange} style={{ width: 44, height: 24, borderRadius: 0, border: "none", cursor: "pointer", background: on ? colors.yellow : "#ccc", position: "relative", transition: "background .2s", flexShrink: 0 }}>
    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: on ? 22 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
  </button>
);

const Segment = ({ options, value, onChange }) => (
  // flexWrap + maxWidth: bei schmalen Karten brechen die Optionen um,
  // statt ueber den Kartenrand hinauszulaufen
  <div style={{ display: "inline-flex", flexWrap: "wrap", maxWidth: "100%", background: colors.cream, borderRadius: 12, padding: 3, gap: 2 }}>
    {options.map(([k, l]) => (
      <button key={k} onClick={() => onChange(k)} style={{ fontSize: 11, fontWeight: value === k ? 700 : 500, padding: "5px 13px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: fonts.body, background: value === k ? colors.dark : "transparent", color: value === k ? "#fff" : colors.muted, whiteSpace: "nowrap" }}>{l}</button>
    ))}
  </div>
);

// Farb-Swatches als Kreise + Hex-Felder
const ColorPick = ({ bg, text, onPick, onBg, onText }) => (
  <div>
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      {ANNOUNCEMENT_PRESETS.map(p => (
        <button key={p.name} onClick={() => onPick(p)} title={p.name} style={{
          width: 26, height: 26, borderRadius: "50%", background: p.bg, cursor: "pointer",
          border: bg === p.bg ? `3px solid ${colors.yellow}` : `2px solid ${colors.dark}`,
        }} />
      ))}
      <label style={{ fontSize: 10, color: colors.muted, display: "flex", alignItems: "center", gap: 4, fontFamily: MONO }}>BG
        <input value={bg} onChange={e => onBg(e.target.value)} style={{ width: 78, ...bcInput, padding: "4px 7px", fontSize: 11 }} />
      </label>
      <label style={{ fontSize: 10, color: colors.muted, display: "flex", alignItems: "center", gap: 4, fontFamily: MONO }}>TEXT
        <input value={text} onChange={e => onText(e.target.value)} style={{ width: 78, ...bcInput, padding: "4px 7px", fontSize: 11 }} />
      </label>
    </div>
  </div>
);

export function KommunikationTab({ admin }) {
  const { ann, setAnn, saveAnnouncement, ticker, setTicker, saveTicker } = admin;
  const [history, setHistory] = useState(null);

  // Aktuelle Zustaende laden (sonst zeigen die Formulare nur Defaults)
  useEffect(() => {
    getAnnouncement().then(row => {
      if (row) setAnn({ enabled: !!row.enabled, message: row.message || "", bg_color: row.bg_color || "#0E9493", text_color: row.text_color || "#FFFFFF", effect: row.effect || "none" });
    });
    getTicker().then(row => {
      if (row) setTicker({ enabled: !!row.enabled, message: row.message || "", bg_color: row.bg_color || "#191615", text_color: row.text_color || "#F4C03F", placement: row.placement || "home" });
    });
  }, [setAnn, setTicker]);

  // Versand-Historie: Rundrufe + Banner-/Ticker-Aenderungen aus dem Audit-Log
  useEffect(() => {
    supabase.from("admin_audit_log")
      .select("action, target_label, detail, created_at")
      .in("action", ["broadcast", "announcement_bar", "ticker"])
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setHistory(data || []));
  }, []);

  const tickerText = (ticker.message || "Vorschau-Text") + " · ";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="kom-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "start" }}>

        {/* ── Banner ── */}
        <Card icon={Megaphone} title="Banner über dem Header">
          {/* Live-Vorschau zuoberst: so sieht der Balken wirklich aus */}
          <div style={{ background: ann.bg_color, color: ann.text_color, fontSize: 15, fontWeight: 700, padding: "11px 14px", textAlign: "center", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", opacity: ann.enabled ? 1 : 0.45 }}>
            {ann.message || "Vorschau-Text"}
          </div>
          <Row label="Status">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Toggle on={ann.enabled} onChange={() => setAnn({ ...ann, enabled: !ann.enabled })} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: ann.enabled ? "#0A7170" : colors.muted }}>{ann.enabled ? "Aktiv, für alle sichtbar" : "Aus"}</span>
            </div>
          </Row>
          <Row label="Text">
            <input value={ann.message} onChange={e => setAnn({ ...ann, message: e.target.value })} placeholder="Text des Balkens…" style={bcInput} />
          </Row>
          <Row label="Farbe">
            <ColorPick bg={ann.bg_color} text={ann.text_color}
              onPick={p => setAnn({ ...ann, bg_color: p.bg, text_color: p.text })}
              onBg={v => setAnn({ ...ann, bg_color: v })} onText={v => setAnn({ ...ann, text_color: v })} />
          </Row>
          <Row label="Animation">
            <Segment value={ann.effect} onChange={k => setAnn({ ...ann, effect: k })}
              options={[["none", "Keine"], ["marquee", "Laufschrift"], ["slide", "Einfliegen"], ["pulse", "Pulsieren"]]} />
          </Row>
          <button onClick={saveAnnouncement} style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "11px 0", cursor: "pointer", fontFamily: fonts.body }}>
            {ann.enabled ? "Speichern + aktiv schalten" : "Speichern (Balken aus)"}
          </button>
        </Card>

        {/* ── Grosse Laufschrift ── */}
        <Card icon={Tv} title="Grosse Laufschrift">
          {/* Live-Vorschau: laeuft wirklich */}
          <div style={{ background: ticker.bg_color, color: ticker.text_color, overflow: "hidden", borderTop: `1.5px solid ${colors.dark}`, borderBottom: `1.5px solid ${colors.dark}`, opacity: ticker.enabled ? 1 : 0.45 }}>
            <div className="ticker-track" style={{ display: "inline-flex", whiteSpace: "nowrap", fontFamily: "'General Sans', 'Manrope', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 20, lineHeight: 1, padding: "10px 0" }}>
              <span>{tickerText.repeat(6)}</span>
              <span aria-hidden="true">{tickerText.repeat(6)}</span>
            </div>
          </div>
          <Row label="Status">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Toggle on={ticker.enabled} onChange={() => setTicker({ ...ticker, enabled: !ticker.enabled })} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: ticker.enabled ? "#0A7170" : colors.muted }}>{ticker.enabled ? "Aktiv, für alle sichtbar" : "Aus"}</span>
            </div>
          </Row>
          <Row label="Text">
            <input value={ticker.message} onChange={e => setTicker({ ...ticker, message: e.target.value })} placeholder="Text der Laufschrift…" style={bcInput} />
          </Row>
          <Row label="Farbe">
            <ColorPick bg={ticker.bg_color} text={ticker.text_color}
              onPick={p => setTicker({ ...ticker, bg_color: p.bg, text_color: p.text })}
              onBg={v => setTicker({ ...ticker, bg_color: v })} onText={v => setTicker({ ...ticker, text_color: v })} />
          </Row>
          <Row label="Wo">
            <Segment value={ticker.placement} onChange={k => setTicker({ ...ticker, placement: k })}
              options={[["home", "Startseite (unter Hero)"], ["global", "Alle Seiten (unter Header)"]]} />
          </Row>
          <button onClick={saveTicker} style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "11px 0", cursor: "pointer", fontFamily: fonts.body }}>
            {ticker.enabled ? "Speichern + aktiv schalten" : "Speichern (Laufschrift aus)"}
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
              const art = h.action === "broadcast" ? "RUF" : h.action === "ticker" ? "TICKER" : "BANNER";
              const teile = h.action === "broadcast"
                ? [
                    `Glocke ${d.count ?? "?"}`,
                    d.mails != null ? `Mail ${d.mails}` : null,
                    d.pushes != null ? `Push ${d.pushes}` : null,
                    d.mode === "newsletter" ? "Newsletter" : null,
                    d.segment && d.segment !== "all" ? `Zielgruppe: ${d.segment}` : null,
                  ].filter(Boolean).join(" · ")
                : `${h.target_label}${d.message ? ` · "${String(d.message).slice(0, 60)}"` : ""}${d.placement ? ` · ${d.placement === "home" ? "Startseite" : "Alle Seiten"}` : ""}`;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "58px 130px 1fr", columnGap: 10, alignItems: "start", padding: "7px 0", borderBottom: i < history.length - 1 ? "1px solid rgba(20,17,13,.08)" : "none", fontSize: 12.5 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: ".06em", padding: "2px 0", textAlign: "center", background: art === "RUF" ? "#0E9493" : colors.yellow, color: art === "RUF" ? "#fff" : colors.dark }}>{art}</span>
                  <span style={{ color: colors.muted, fontFamily: MONO, fontSize: 11 }}>{new Date(h.created_at).toLocaleString("de-CH", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  <span style={{ minWidth: 0 }}>
                    <b>{h.action === "broadcast" ? h.target_label : h.action === "ticker" ? "Laufschrift geändert" : "Balken geändert"}</b>
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
