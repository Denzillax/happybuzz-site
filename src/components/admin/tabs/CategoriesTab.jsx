"use client";
import { useState } from "react";
import { ChevronUp, ChevronDown, Plus, Pencil, Check, X, EyeOff, Eye } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { pill } from "@/components/admin/adminStyles";
import { CategoryIcon } from "@/components/shared/CategoryIcon";

// Kategorien-Verwaltung: erstellen, umbenennen, deaktivieren, sortieren.
// Deaktivieren statt löschen — bestehende Inserate behalten ihre Kategorie,
// nur in Pickern/Menüs verschwindet sie.
export function CategoriesTab({ admin }) {
  const { adminCategories, createCategory, renameCategory, toggleCategoryActive, moveCategory } = admin;
  const [newName, setNewName] = useState("");
  const [addingUnder, setAddingUnder] = useState(null); // parent_id für neue Unterkategorie
  const [subName, setSubName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const childrenOf = (parentId) => adminCategories
    .filter(c => (c.parent_id || null) === (parentId || null))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || (a.name || "").localeCompare(b.name || ""));

  const startEdit = (cat) => { setEditId(cat.id); setEditName(cat.name || ""); };
  const commitEdit = () => { if (editId && editName.trim()) renameCategory(editId, editName); setEditId(null); };

  const Row = ({ cat, depth }) => {
    const kids = childrenOf(cat.id);
    const inactive = cat.is_active === false;
    const isEditing = editId === cat.id;
    return (
      <div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 14px", paddingLeft: 14 + depth * 26,
          borderBottom: `1px solid ${colors.borderLt}`,
          background: inactive ? "#fafafa" : "transparent", opacity: inactive ? 0.55 : 1,
        }}>
          {/* Sortieren */}
          <span style={{ display: "inline-flex", flexDirection: "column", flexShrink: 0 }}>
            <button onClick={() => moveCategory(cat, -1)} title="Nach oben" style={{ border: "none", background: "none", cursor: "pointer", padding: 0, lineHeight: 0, color: colors.muted }}><ChevronUp size={13} /></button>
            <button onClick={() => moveCategory(cat, 1)} title="Nach unten" style={{ border: "none", background: "none", cursor: "pointer", padding: 0, lineHeight: 0, color: colors.muted }}><ChevronDown size={13} /></button>
          </span>
          {depth === 0 && <CategoryIcon name={cat.icon || "Package"} size={15} />}
          {/* Name / Inline-Edit */}
          {isEditing ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flex: 1, minWidth: 0 }}>
              <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditId(null); }}
                style={{ flex: 1, minWidth: 0, border: `1px solid ${colors.teal}`, borderRadius: 6, padding: "4px 8px", fontSize: 13, fontFamily: fonts.body, outline: "none" }} />
              <button onClick={commitEdit} title="Speichern" style={{ border: "none", background: "#E8F5E9", color: "#2E7D32", borderRadius: 6, padding: 4, cursor: "pointer", lineHeight: 0 }}><Check size={13} /></button>
              <button onClick={() => setEditId(null)} title="Abbrechen" style={{ border: "none", background: colors.cream, color: colors.muted, borderRadius: 6, padding: 4, cursor: "pointer", lineHeight: 0 }}><X size={13} /></button>
            </span>
          ) : (
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: depth === 0 ? 700 : 500, color: colors.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {cat.name}
              {kids.length > 0 && <span style={{ fontSize: 10, color: colors.muted, marginLeft: 6 }}>({kids.length})</span>}
            </span>
          )}
          {inactive && pill("#f5f5f5", "#666", "Deaktiviert")}
          {/* Aktionen */}
          {!isEditing && (
            <span style={{ display: "inline-flex", gap: 4, flexShrink: 0 }}>
              <button onClick={() => startEdit(cat)} title="Umbenennen" style={{ border: "none", background: colors.cream, color: colors.muted, borderRadius: 6, padding: 5, cursor: "pointer", lineHeight: 0 }}><Pencil size={12} /></button>
              <button onClick={() => { setAddingUnder(addingUnder === cat.id ? null : cat.id); setSubName(""); }} title="Unterkategorie anlegen" style={{ border: "none", background: colors.cream, color: colors.muted, borderRadius: 6, padding: 5, cursor: "pointer", lineHeight: 0 }}><Plus size={12} /></button>
              <button onClick={() => toggleCategoryActive(cat)} title={inactive ? "Aktivieren" : "Deaktivieren"}
                style={{ border: "none", background: inactive ? "#E8F5E9" : "#FFF3E0", color: inactive ? "#2E7D32" : "#E65100", borderRadius: 6, padding: 5, cursor: "pointer", lineHeight: 0 }}>
                {inactive ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
            </span>
          )}
        </div>
        {/* Neue Unterkategorie */}
        {addingUnder === cat.id && (
          <div style={{ display: "flex", gap: 6, padding: "8px 14px", paddingLeft: 14 + (depth + 1) * 26, borderBottom: `1px solid ${colors.borderLt}`, background: "#FBFAF7" }}>
            <input autoFocus value={subName} onChange={e => setSubName(e.target.value)} placeholder={`Neue Unterkategorie in "${cat.name}"...`}
              onKeyDown={e => { if (e.key === "Enter" && subName.trim()) { createCategory(subName, cat.id); setAddingUnder(null); } if (e.key === "Escape") setAddingUnder(null); }}
              style={{ flex: 1, border: `1px solid ${colors.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 12, fontFamily: fonts.body, outline: "none" }} />
            <button onClick={() => { if (subName.trim()) { createCategory(subName, cat.id); setAddingUnder(null); } }}
              style={{ border: "none", background: colors.dark, color: "#fff", borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Anlegen</button>
          </div>
        )}
        {kids.map(k => <Row key={k.id} cat={k} depth={depth + 1} />)}
      </div>
    );
  };

  const mains = childrenOf(null);

  return (
    <div>
      {/* Neue Hauptkategorie */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Neue Hauptkategorie..."
          onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { createCategory(newName, null); setNewName(""); } }}
          style={{ flex: 1, maxWidth: 360, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: fonts.body, outline: "none", background: "#fff" }} />
        <button onClick={() => { if (newName.trim()) { createCategory(newName, null); setNewName(""); } }} disabled={!newName.trim()}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: newName.trim() ? colors.dark : colors.cream, color: newName.trim() ? "#fff" : colors.muted, borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: newName.trim() ? "pointer" : "default", fontFamily: fonts.body }}>
          <Plus size={13} /> Anlegen
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ alignSelf: "center", fontSize: 12, color: colors.muted }}>
          {mains.length} Hauptkategorien · {adminCategories.length} gesamt
        </span>
      </div>

      <p style={{ margin: "0 0 10px", fontSize: 11.5, color: colors.muted }}>
        Deaktivierte Kategorien verschwinden aus Menüs und Formularen. Bestehende Inserate behalten ihre Kategorie.
      </p>

      {/* Baum */}
      <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {mains.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: colors.muted }}>Keine Kategorien vorhanden.</div>
        ) : mains.map(c => <Row key={c.id} cat={c} depth={0} />)}
      </div>
    </div>
  );
}
