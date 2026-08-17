"use client";
import { useState } from "react";
import { Plus, Power, Repeat } from "lucide-react";
import { colors, radius } from "@/lib/theme";
import { th, td, pill, bcFieldLabel, bcInput, useSort, SortTh } from "@/components/admin/adminStyles";

const ACTIONS = [
  { value: "listing_created", label: "Inserate erstellen" },
  { value: "sale_completed", label: "Verkäufe abschliessen" },
  { value: "five_star", label: "5-Sterne-Bewertungen erhalten" },
  { value: "buy_completed", label: "Käufe tätigen" },
  { value: "rating_given", label: "Bewertungen abgeben" },
  { value: "distinct_categories", label: "Inserate in verschiedenen Kategorien" },
];
const aLabel = (v) => ACTIONS.find(a => a.value === v)?.label || v;
const fmtD = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" });

export function ChallengesTab({ admin }) {
  const { challenges, saveChallenge, toggleChallenge, updateChallenge, modPill, adminCategories } = admin;
  const [filter, setFilter] = useState("aktiv");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);   // Vorlage im Formular bearbeiten
  const EMPTY = { title: "", description: "", target_action: "listing_created", target_value: 3, xp_reward: 50, is_template: true, starts_at: "", ends_at: "", category_id: "", featured: false };
  const [f, setF] = useState(EMPTY);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const catName = (id) => (adminCategories || []).find(c => c.id === id)?.name || "";
  // Kategorie-Auswahl: Hauptkategorien mit eingerueckten Unterkategorien
  const catOptions = (() => {
    const cats = adminCategories || [];
    const out = [];
    for (const main of cats.filter(c => !c.parent_id)) {
      out.push({ id: main.id, label: main.name });
      for (const sub of cats.filter(c => c.parent_id === main.id)) {
        out.push({ id: sub.id, label: "   " + sub.name });
      }
    }
    return out;
  })();

  const startEdit = (c) => {
    setEditId(c.id);
    setF({ title: c.title, description: c.description || "", target_action: c.target_action, target_value: c.target_value, xp_reward: c.xp_reward, is_template: true, starts_at: "", ends_at: "", category_id: c.category_id || "", featured: !!c.featured });
    setShowForm(true);
  };

  const now = new Date();
  const rows = challenges.filter(c =>
    filter === "vorlagen" ? c.is_template
    : filter === "vergangene" ? (!c.is_template && new Date(c.ends_at) < now)
    : (!c.is_template && new Date(c.ends_at) >= now));

  const sort = useSort(rows, (c, key) => {
    if (key === "title") return c.title || "";
    if (key === "action") return aLabel(c.target_action);
    if (key === "target") return parseInt(c.target_value) || 0;
    if (key === "xp") return parseInt(c.xp_reward) || 0;
    if (key === "period") return c.is_template ? "" : (c.starts_at || "");
    if (key === "participants") return c.is_template ? -1 : (parseInt(c.participants) || 0);
    if (key === "status") return c.active ? 1 : 0;
    return null;
  });

  const submit = async () => {
    if (!f.title.trim()) return alert("Titel fehlt");
    if (!editId && !f.is_template && (!f.starts_at || !f.ends_at)) return alert("Zeitraum fehlt (oder als Vorlage markieren)");
    // Kategorie gilt nur fuer Inserat-Challenges
    const categoryId = f.target_action === "listing_created" && f.category_id ? f.category_id : null;
    const ok = editId
      ? await updateChallenge(editId, { ...f, category_id: categoryId })
      : await saveChallenge({
          title: f.title.trim(), description: f.description.trim(),
          target_action: f.target_action, target_value: parseInt(f.target_value) || 1,
          xp_reward: parseInt(f.xp_reward) || 0, is_template: f.is_template,
          category_id: categoryId, featured: !!f.featured,
          starts_at: f.is_template ? new Date().toISOString() : new Date(f.starts_at).toISOString(),
          ends_at: f.is_template ? new Date().toISOString() : new Date(f.ends_at + "T23:59:59").toISOString(),
        });
    if (ok) { setShowForm(false); setEditId(null); setF(EMPTY); }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {[["aktiv", "Aktuelle"], ["vorlagen", "Vorlagen (wöchentlich)"], ["vergangene", "Vergangene"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={modPill(filter === k)}>{l}</button>
        ))}
        <button onClick={() => setShowForm(s => !s)} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 0, border: "none", background: colors.teal, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={13} /> Neue Challenge
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: 16, marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}><p style={bcFieldLabel}>Titel</p><input style={bcInput} value={f.title} onChange={e => set("title", e.target.value)} /></div>
          <div style={{ gridColumn: "1 / -1" }}><p style={bcFieldLabel}>Beschreibung</p><input style={bcInput} value={f.description} onChange={e => set("description", e.target.value)} /></div>
          <div><p style={bcFieldLabel}>Ziel-Aktion</p>
            <select style={bcInput} value={f.target_action} onChange={e => set("target_action", e.target.value)}>
              {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select></div>
          <div><p style={bcFieldLabel}>Zielwert</p><input style={bcInput} type="number" min="1" value={f.target_value} onChange={e => set("target_value", e.target.value)} /></div>
          <div><p style={bcFieldLabel}>Pollen</p><input style={bcInput} type="number" min="0" value={f.xp_reward} onChange={e => set("xp_reward", e.target.value)} /></div>
          {f.target_action === "listing_created" && (
            <div><p style={bcFieldLabel}>Kategorie (optional)</p>
              <select style={bcInput} value={f.category_id} onChange={e => set("category_id", e.target.value)}>
                <option value="">Alle Kategorien</option>
                {catOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select></div>
          )}
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" id="chal-feat" checked={f.featured} onChange={e => set("featured", e.target.checked)} />
            <label htmlFor="chal-feat" style={{ fontSize: 13 }}>Auf Startseite zeigen (Challenge der Woche Banner)</label>
          </div>
          {!editId && (
            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="chal-tpl" checked={f.is_template} onChange={e => set("is_template", e.target.checked)} />
              <label htmlFor="chal-tpl" style={{ fontSize: 13 }}>Wöchentliche Vorlage (rotiert automatisch jede Woche)</label>
            </div>
          )}
          {!editId && !f.is_template && (<>
            <div><p style={bcFieldLabel}>Von</p><input style={bcInput} type="date" value={f.starts_at} onChange={e => set("starts_at", e.target.value)} /></div>
            <div><p style={bcFieldLabel}>Bis</p><input style={bcInput} type="date" value={f.ends_at} onChange={e => set("ends_at", e.target.value)} /></div>
          </>)}
          <div style={{ gridColumn: "1 / -1" }}>
            <button onClick={submit} style={{ padding: "9px 18px", borderRadius: 0, border: "none", background: colors.teal, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              {editId ? "Vorlage speichern" : "Anlegen"}
            </button>
          </div>
        </div>
      )}

      <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13 }}>Nichts gefunden.</div>
        ) : (
        <>
        <table className="po-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cream }}>
            <SortTh label="Titel" k="title" sort={sort} />
            <SortTh label="Aktion" k="action" sort={sort} />
            <SortTh label="Ziel" k="target" sort={sort} align="right" />
            <SortTh label="Pollen" k="xp" sort={sort} align="right" />
            <SortTh label="Zeitraum" k="period" sort={sort} />
            <SortTh label="Teilnehmer" k="participants" sort={sort} align="right" />
            <SortTh label="Status" k="status" sort={sort} align="center" />
            <th style={{ ...th, textAlign: "center" }}>Aktionen</th>
          </tr></thead>
          <tbody>
            {sort.sorted.map(c => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${colors.borderLt}` }}>
                <td style={{ ...td, fontWeight: 600 }}>{c.title}
                  {c.featured && <span style={{ marginLeft: 6 }}>{pill("#FFF5D8", "#5c4708", "Startseite")}</span>}
                  {c.description && <span style={{ display: "block", fontSize: 11, color: colors.muted, fontWeight: 400 }}>{c.description}</span>}
                </td>
                <td style={{ ...td, color: colors.muted }}>{aLabel(c.target_action)}{c.category_id ? ` · ${catName(c.category_id)}` : ""}</td>
                <td style={{ ...td, textAlign: "right" }}>{c.target_value}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{c.xp_reward}</td>
                <td style={{ ...td, color: colors.muted, whiteSpace: "nowrap" }}>
                  {c.is_template ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Repeat size={11} /> wöchentlich</span> : `${fmtD(c.starts_at)} bis ${fmtD(c.ends_at)}`}
                </td>
                <td style={{ ...td, textAlign: "right" }}>{c.is_template ? "" : c.participants}</td>
                <td style={{ ...td, textAlign: "center" }}>{c.active ? pill("#E8F5E9", "#2E7D32", "Aktiv") : pill("#f5f5f5", "#666", "Aus")}</td>
                <td style={{ ...td, textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    {c.is_template && (
                      <button onClick={() => startEdit(c)} title="Vorlage bearbeiten (gilt ab nächster Woche)"
                        style={{ padding: "4px 10px", borderRadius: 0, border: "none", background: "#E6F5F5", color: "#0A7170", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                        Bearbeiten
                      </button>
                    )}
                    <button onClick={() => toggleChallenge(c)} title={c.active ? "Deaktivieren" : "Aktivieren"}
                      style={{ padding: "4px 10px", borderRadius: 0, border: "none", background: c.active ? "#FFF3E0" : "#E8F5E9", color: c.active ? "#E65100" : "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Power size={10} /> {c.active ? "Aus" : "An"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobil: Karten */}
        <div className="po-cards">
          {sort.sorted.map(c => (
            <div key={c.id} style={{ padding: "12px 14px", borderBottom: `1px solid ${colors.borderLt}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>{c.title} {c.featured && pill("#FFF5D8", "#5c4708", "Startseite")}</p>
                  {c.description && <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.muted }}>{c.description}</p>}
                </div>
                {c.active ? pill("#E8F5E9", "#2E7D32", "Aktiv") : pill("#f5f5f5", "#666", "Aus")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap", fontSize: 12, color: colors.muted }}>
                <span>{aLabel(c.target_action)}{c.category_id ? ` · ${catName(c.category_id)}` : ""}</span>
                <span>Ziel {c.target_value}</span>
                <span style={{ fontWeight: 700, color: colors.dark }}>{c.xp_reward} Pollen</span>
                <span>{c.is_template ? "wöchentlich" : `${fmtD(c.starts_at)} bis ${fmtD(c.ends_at)}`}</span>
                {!c.is_template && <span>{c.participants} Teilnehmer</span>}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {c.is_template && (
                  <button onClick={() => startEdit(c)} style={{ padding: "4px 10px", borderRadius: 0, border: "none", background: "#E6F5F5", color: "#0A7170", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Bearbeiten</button>
                )}
                <button onClick={() => toggleChallenge(c)} style={{ padding: "4px 10px", borderRadius: 0, border: "none", background: c.active ? "#FFF3E0" : "#E8F5E9", color: c.active ? "#E65100" : "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <Power size={10} /> {c.active ? "Aus" : "An"}
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
