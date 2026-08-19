"use client";
// Tab Kommunikation: alles, was an Nutzer rausgeht, an einem Ort.
// Variante A: Unter-Pills (Banner / Laufschrift / Rundruf / Historie), immer
// genau ein Bereich in voller Breite. Banner- und Laufschrift-Editor sind
// baugleich: grosse Live-Vorschau zuoberst (Laufschrift = echte TickerBar in
// Originalgroesse), dann Status, Text, Farbe, Spezialzeilen, Speichern.
import { useState, useEffect } from "react";
import { Megaphone, Send, History, Tv } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts } from "@/lib/theme";
import { ANNOUNCEMENT_PRESETS, getAnnouncement, getTicker } from "@/lib/announcement";
import { bcInput } from "@/components/admin/adminStyles";
import { BroadcastForm } from "@/components/admin/modals/BroadcastComposer";
import { TickerBar } from "@/components/layout/Ticker";

const MONO = "'Space Mono', ui-monospace, monospace";

// Beschriftete Zeile: Label links in Mono, Inhalt rechts — gleiche Optik ueberall
const Row = ({ label, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", gap: 14 }}>
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
  <div style={{ display: "inline-flex", flexWrap: "wrap", maxWidth: "100%", background: colors.cream, borderRadius: 12, padding: 3, gap: 2 }}>
    {options.map(([k, l]) => (
      <button key={k} onClick={() => onChange(k)} style={{ fontSize: 11, fontWeight: value === k ? 700 : 500, padding: "5px 13px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: fonts.body, background: value === k ? colors.dark : "transparent", color: value === k ? "#fff" : colors.muted, whiteSpace: "nowrap" }}>{l}</button>
    ))}
  </div>
);

// Farb-Swatches als Kreise + Hex-Felder
const ColorPick = ({ bg, text, onPick, onBg, onText }) => (
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
);

// Weisser Rahmen fuer den jeweils aktiven Bereich
const Panel = ({ children }) => (
  <div style={{ background: "#fff", border: `1px solid ${colors.dark}`, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
    {children}
  </div>
);

const SaveBtn = ({ onClick, label }) => (
  <button onClick={onClick} style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "11px 28px", cursor: "pointer", fontFamily: fonts.body, alignSelf: "flex-start" }}>
    {label}
  </button>
);

const BEREICHE = [
  { k: "banner", l: "Banner", icon: Megaphone },
  { k: "ticker", l: "Laufschrift", icon: Tv },
  { k: "rundruf", l: "Rundruf", icon: Send },
  { k: "historie", l: "Historie", icon: History },
];

const TEMPO_LABEL = { slow: "langsam", normal: "normal", fast: "schnell" };

export function KommunikationTab({ admin }) {
  const { ann, setAnn, saveAnnouncement, ticker, setTicker, saveTicker } = admin;
  const [bereich, setBereich] = useState("banner");
  const [history, setHistory] = useState(null);
  const [histFilter, setHistFilter] = useState("alle");

  // Aktuelle Zustaende laden (sonst zeigen die Formulare nur Defaults)
  useEffect(() => {
    getAnnouncement().then(row => {
      if (row) setAnn({ enabled: !!row.enabled, message: row.message || "", bg_color: row.bg_color || "#0E9493", text_color: row.text_color || "#FFFFFF", effect: row.effect || "none" });
    });
    getTicker().then(row => {
      if (row) setTicker({ enabled: !!row.enabled, message: row.message || "", bg_color: row.bg_color || "#191615", text_color: row.text_color || "#F4C03F", placement: row.placement || "home", speed: row.speed || "normal" });
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

  const histRows = (history || []).filter(h => histFilter === "alle" || h.action === histFilter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Unter-Navigation */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {BEREICHE.map(({ k, l, icon: Icon }) => (
          <button key={k} onClick={() => setBereich(k)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12.5, fontWeight: bereich === k ? 700 : 500, fontFamily: fonts.body,
            padding: "8px 16px", borderRadius: 999, cursor: "pointer",
            border: `1.5px solid ${colors.dark}`,
            background: bereich === k ? colors.dark : "#fff",
            color: bereich === k ? "#fff" : colors.dark,
          }}>
            <Icon size={13} /> {l}
          </button>
        ))}
      </div>

      {/* ── Banner ── */}
      {bereich === "banner" && (
        <Panel>
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
            <input value={ann.message} onChange={e => setAnn({ ...ann, message: e.target.value })} placeholder="Text des Balkens…" style={{ ...bcInput, maxWidth: 560 }} />
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
          <SaveBtn onClick={saveAnnouncement} label={ann.enabled ? "Speichern + aktiv schalten" : "Speichern (Balken aus)"} />
        </Panel>
      )}

      {/* ── Grosse Laufschrift ── */}
      {bereich === "ticker" && (
        <Panel>
          {/* Echte TickerBar: identisch mit der Live-Laufschrift, inkl. Tempo */}
          <TickerBar
            message={ticker.message || "Vorschau-Text"}
            bgColor={ticker.bg_color} textColor={ticker.text_color}
            speed={ticker.speed} disabled={!ticker.enabled}
          />
          <Row label="Status">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Toggle on={ticker.enabled} onChange={() => setTicker({ ...ticker, enabled: !ticker.enabled })} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: ticker.enabled ? "#0A7170" : colors.muted }}>{ticker.enabled ? "Aktiv, für alle sichtbar" : "Aus"}</span>
            </div>
          </Row>
          <Row label="Text">
            <input value={ticker.message} onChange={e => setTicker({ ...ticker, message: e.target.value })} placeholder="Text der Laufschrift…" style={{ ...bcInput, maxWidth: 560 }} />
          </Row>
          <Row label="Farbe">
            <ColorPick bg={ticker.bg_color} text={ticker.text_color}
              onPick={p => setTicker({ ...ticker, bg_color: p.bg, text_color: p.text })}
              onBg={v => setTicker({ ...ticker, bg_color: v })} onText={v => setTicker({ ...ticker, text_color: v })} />
          </Row>
          <Row label="Tempo">
            <Segment value={ticker.speed || "normal"} onChange={k => setTicker({ ...ticker, speed: k })}
              options={[["slow", "Langsam"], ["normal", "Normal"], ["fast", "Schnell"]]} />
          </Row>
          <Row label="Wo">
            <Segment value={ticker.placement} onChange={k => setTicker({ ...ticker, placement: k })}
              options={[["home", "Startseite (unter Hero)"], ["global", "Alle Seiten (unter Header)"]]} />
          </Row>
          <SaveBtn onClick={saveTicker} label={ticker.enabled ? "Speichern + aktiv schalten" : "Speichern (Laufschrift aus)"} />
        </Panel>
      )}

      {/* ── Rundruf ── */}
      {bereich === "rundruf" && (
        <Panel>
          <div style={{ maxWidth: 720 }}>
            <BroadcastForm admin={admin} embedded />
          </div>
        </Panel>
      )}

      {/* ── Historie ── */}
      {bereich === "historie" && (
        <Panel>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["alle", "Alle"], ["broadcast", "Rundruf"], ["announcement_bar", "Banner"], ["ticker", "Laufschrift"]].map(([k, l]) => (
              <button key={k} onClick={() => setHistFilter(k)} style={{
                fontSize: 11.5, fontWeight: histFilter === k ? 700 : 500, fontFamily: fonts.body,
                padding: "5px 13px", borderRadius: 999, border: `1px solid ${colors.border}`,
                cursor: "pointer", background: histFilter === k ? colors.yellow : "#fff", color: colors.dark,
              }}>{l}</button>
            ))}
          </div>
          {history === null ? (
            <div style={{ fontSize: 13, color: colors.muted }}>Wird geladen…</div>
          ) : histRows.length === 0 ? (
            <div style={{ fontSize: 13, color: colors.muted }}>Noch nichts versendet.</div>
          ) : (
            <div>
              {histRows.map((h, i) => {
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
                  : [
                      h.target_label,
                      d.message ? `"${String(d.message).slice(0, 60)}"` : null,
                      d.placement ? (d.placement === "home" ? "Startseite" : "Alle Seiten") : null,
                      d.speed ? `Tempo ${TEMPO_LABEL[d.speed] || d.speed}` : null,
                    ].filter(Boolean).join(" · ");
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "58px 130px 1fr", columnGap: 10, alignItems: "start", padding: "8px 0", borderBottom: i < histRows.length - 1 ? "1px solid rgba(20,17,13,.08)" : "none", fontSize: 12.5 }}>
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
        </Panel>
      )}
    </div>
  );
}
