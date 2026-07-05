"use client";
import { useState } from "react";
import Link from "next/link";
import { Inbox, Save } from "lucide-react";
import { fmtDate } from "@/lib/formatters";
import { colors, fonts, radius } from "@/lib/theme";
import { pill } from "@/components/admin/adminStyles";

// Typen aus dem Beta-Widget (BetaFeedback.jsx)
const TYPE_META = {
  bug:      { label: "Bug",      bg: "#FFEBEE", color: "#c62828" },
  feedback: { label: "Feedback", bg: "#FFF8E1", color: "#B07E09" },
  idea:     { label: "Idee",     bg: "#E8F5E9", color: "#5B8C5A" },
  frage:    { label: "Frage",    bg: "#E9F2F6", color: "#4A7A8C" },
};
const STATUS_META = {
  neu:       { label: "Neu",       bg: "#E3F2FD", color: "#1565C0" },
  in_arbeit: { label: "In Arbeit", bg: "#FFF3E0", color: "#E65100" },
  erledigt:  { label: "Erledigt",  bg: "#E8F5E9", color: "#2E7D32" },
  verworfen: { label: "Verworfen", bg: "#f5f5f5", color: "#666" },
};
// Das Widget setzt keinen Status: NULL/unbekannt gilt als "neu".
const normStatus = (s) => (s && STATUS_META[s] ? s : "neu");
const TRUNC = 160;

export function FeedbackTab({ admin }) {
  const { feedback, openFeedback, setFeedbackStatus, saveFeedbackNote, modPill } = admin;
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [noteDraft, setNoteDraft] = useState({});

  const list = feedback.filter(f =>
    (typeFilter === "all" || f.feedback_type === typeFilter) &&
    (statusFilter === "all" || normStatus(f.status) === statusFilter));

  return (
    <div>
      {/* Zähler + Filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.muted }}>
          {list.length} von {feedback.length} Einträgen · {openFeedback.length} neu
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button onClick={() => setTypeFilter("all")} style={modPill(typeFilter === "all")}>Alle Typen</button>
          {Object.entries(TYPE_META).map(([k, m]) => (
            <button key={k} onClick={() => setTypeFilter(k)} style={modPill(typeFilter === k)}>{m.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button onClick={() => setStatusFilter("all")} style={modPill(statusFilter === "all")}>Alle Status</button>
          {Object.entries(STATUS_META).map(([k, m]) => (
            <button key={k} onClick={() => setStatusFilter(k)} style={modPill(statusFilter === k)}>{m.label}</button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {list.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Inbox size={32} color={colors.muted} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Kein Feedback vorhanden.</p>
            <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>Neue Einträge aus dem Beta-Widget erscheinen hier.</p>
          </div>
        ) : list.map(f => {
          const t = TYPE_META[f.feedback_type] || { label: f.feedback_type || "?", bg: colors.cream, color: colors.muted };
          const st = normStatus(f.status);
          const isOpen = openId === f.id;
          const desc = f.description || "";
          const long = desc.length > TRUNC;
          const draft = noteDraft[f.id] !== undefined ? noteDraft[f.id] : (f.admin_note || "");
          const dirty = draft !== (f.admin_note || "");
          return (
            <div key={f.id} style={{ padding: "13px 16px", borderBottom: `1px solid ${colors.borderLt}`, background: st === "erledigt" || st === "verworfen" ? "#fafafa" : "transparent", opacity: st === "verworfen" ? 0.65 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                {pill(t.bg, t.color, t.label)}
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>{f.title || "(ohne Titel)"}</span>
                {pill(STATUS_META[st].bg, STATUS_META[st].color, STATUS_META[st].label)}
                <div style={{ flex: 1 }} />
                <select value={st} onChange={e => setFeedbackStatus(f.id, e.target.value)}
                  style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: "5px 8px", fontSize: 11, fontFamily: fonts.body, background: "#fff", cursor: "pointer", flexShrink: 0 }}>
                  {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select>
              </div>
              {desc && (
                <p style={{ margin: "0 0 6px", fontSize: 12, color: "#666", whiteSpace: "pre-wrap" }}>
                  {isOpen || !long ? desc : `${desc.slice(0, TRUNC)}...`}
                  {long && (
                    <button onClick={() => setOpenId(isOpen ? null : f.id)} style={{ marginLeft: 6, border: "none", background: "none", color: colors.teal, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body, padding: 0 }}>
                      {isOpen ? "weniger" : "mehr"}
                    </button>
                  )}
                </p>
              )}
              <p style={{ margin: "0 0 8px", fontSize: 11, color: colors.muted }}>
                Von <strong>{f.display_name || "Anonym"}</strong>
                {f.page_url && <> · Seite: <Link href={f.page_url} style={{ color: colors.teal, textDecoration: "none", fontWeight: 600 }}>{f.page_url}</Link></>}
                {" · "}{fmtDate(f.created_at)}
                {(f.browser_info || f.screen_size) && (
                  <span style={{ display: "block", fontSize: 10, color: "#bbb", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.screen_size ? `${f.screen_size} · ` : ""}{f.browser_info || ""}
                  </span>
                )}
              </p>
              {/* Admin-Notiz */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input value={draft} onChange={e => setNoteDraft(p => ({ ...p, [f.id]: e.target.value }))}
                  placeholder="Admin-Notiz..."
                  style={{ flex: 1, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, fontFamily: fonts.body, outline: "none", background: "#fff", boxSizing: "border-box" }} />
                <button onClick={() => saveFeedbackNote(f.id, draft)} disabled={!dirty}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 999, border: "none", background: dirty ? colors.dark : colors.cream, color: dirty ? "#fff" : colors.muted, fontSize: 11, fontWeight: 700, cursor: dirty ? "pointer" : "default", fontFamily: fonts.body, flexShrink: 0 }}>
                  <Save size={12} /> Speichern
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
