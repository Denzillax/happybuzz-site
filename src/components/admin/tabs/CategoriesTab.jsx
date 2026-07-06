"use client";
import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, ChevronRight, Plus, Pencil, Check, X, EyeOff, Eye, Search, Maximize2, Minimize2 } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { pill } from "@/components/admin/adminStyles";
import { CategoryIcon } from "@/components/shared/CategoryIcon";

const STORAGE_KEY = "beedaro_admin_cat_expanded";

// Kategorien-Verwaltung: erstellen, umbenennen, deaktivieren, sortieren.
// Baum ist auf-/zuklappbar (Zustand in localStorage gemerkt), mit Live-Suche
// (klappt Treffer-Äste temporär auf) und Alles-auf/-zu.
// Deaktivieren statt löschen — bestehende Inserate behalten ihre Kategorie,
// nur in Pickern/Menüs verschwindet sie.
export function CategoriesTab({ admin }) {
  const { adminCategories, createCategory, renameCategory, toggleCategoryActive, moveCategory } = admin;
  const [newName, setNewName] = useState("");
  const [addingUnder, setAddingUnder] = useState(null); // parent_id für neue Unterkategorie
  const [subName, setSubName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [query, setQuery] = useState("");

  // Aufgeklappte IDs — beim ersten Öffnen alles zu, danach gemerkt.
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? new Set(JSON.parse(raw)) : new Set(); }
    catch { return new Set(); }
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...expanded])); } catch {}
  }, [expanded]);

  const allChildrenOf = (parentId) => adminCategories
    .filter(c => (c.parent_id || null) === (parentId || null))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || (a.name || "").localeCompare(b.name || ""));

  // ── Suche: Treffer + deren Vorfahren sichtbar/aufgeklappt ──
  const q = query.trim().toLowerCase();
  let visibleSet = null, autoOpen = null;
  if (q) {
    visibleSet = new Set(); autoOpen = new Set();
    const parentOf = {};
    adminCategories.forEach(c => { parentOf[c.id] = c.parent_id || null; });
    adminCategories.forEach(c => {
      if ((c.name || "").toLowerCase().includes(q)) {
        visibleSet.add(c.id);
        let p = parentOf[c.id];
        while (p) { visibleSet.add(p); autoOpen.add(p); p = parentOf[p]; }
      }
    });
  }
  const isVisible = (id) => !q || visibleSet.has(id);
  const isOpen = (id) => (q ? autoOpen.has(id) : expanded.has(id));

  const toggle = (id) => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const parentIds = adminCategories
    .filter(c => adminCategories.some(x => (x.parent_id || null) === c.id))
    .map(c => c.id);
  const expandAll = () => setExpanded(new Set(parentIds));
  const collapseAll = () => setExpanded(new Set());

  const startEdit = (cat) => { setEditId(cat.id); setEditName(cat.name || ""); };
  const commitEdit = () => { if (editId && editName.trim()) renameCategory(editId, editName); setEditId(null); };
  // Neue Unterkategorie anlegen + Elternteil aufklappen, damit sie sichtbar wird.
  const addSub = (parentId, name) => {
    if (!name.trim()) return;
    createCategory(name, parentId);
    setExpanded(prev => new Set(prev).add(parentId));
    setAddingUnder(null); setSubName("");
  };

  const Row = ({ cat, depth }) => {
    const kids = allChildrenOf(cat.id);
    const hasKids = kids.length > 0;
    const open = isOpen(cat.id);
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
          {/* Auf-/Zuklappen (oder Platzhalter bei Blättern) */}
          {hasKids ? (
            <button onClick={() => toggle(cat.id)} title={open ? "Zuklappen" : "Aufklappen"}
              style={{ border: "none", background: "none", cursor: "pointer", padding: 2, lineHeight: 0, color: colors.dark, flexShrink: 0 }}>
              <ChevronRight size={15} style={{ transition: "transform .15s", transform: open ? "rotate(90deg)" : "none" }} />
            </button>
          ) : (
            <span style={{ width: 19, flexShrink: 0 }} />
          )}
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
            <span onClick={() => hasKids && toggle(cat.id)}
              style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: depth === 0 ? 700 : 500, color: colors.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: hasKids ? "pointer" : "default" }}>
              {cat.name}
              {hasKids && <span style={{ fontSize: 10, color: colors.muted, marginLeft: 6 }}>({kids.length})</span>}
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
              onKeyDown={e => { if (e.key === "Enter") addSub(cat.id, subName); if (e.key === "Escape") setAddingUnder(null); }}
              style={{ flex: 1, border: `1px solid ${colors.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 12, fontFamily: fonts.body, outline: "none" }} />
            <button onClick={() => addSub(cat.id, subName)}
              style={{ border: "none", background: colors.dark, color: "#fff", borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Anlegen</button>
          </div>
        )}
        {open && kids.filter(k => isVisible(k.id)).map(k => <Row key={k.id} cat={k} depth={depth + 1} />)}
      </div>
    );
  };

  const mains = allChildrenOf(null);
  const visibleMains = mains.filter(c => isVisible(c.id));

  return (
    <div>
      {/* Neue Hauptkategorie */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
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

      {/* Suche + Alles auf/zu */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.cream, borderRadius: 999, padding: "8px 14px", flex: 1, maxWidth: 360 }}>
          <Search size={15} color={colors.muted} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Kategorie suchen..."
            style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13, fontFamily: fonts.body, color: colors.dark }} />
          {query && <button onClick={() => setQuery("")} title="Suche leeren" style={{ border: "none", background: "none", cursor: "pointer", padding: 0, lineHeight: 0, color: colors.muted }}><X size={14} /></button>}
        </div>
        <button onClick={expandAll} title="Alles aufklappen" style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${colors.border}`, background: "#fff", color: colors.dark, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>
          <Maximize2 size={13} /> Alles auf
        </button>
        <button onClick={collapseAll} title="Alles zuklappen" style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${colors.border}`, background: "#fff", color: colors.dark, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>
          <Minimize2 size={13} /> Alles zu
        </button>
      </div>

      <p style={{ margin: "0 0 10px", fontSize: 11.5, color: colors.muted }}>
        Deaktivierte Kategorien verschwinden aus Menüs und Formularen. Bestehende Inserate behalten ihre Kategorie.
      </p>

      {/* Baum */}
      <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {mains.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: colors.muted }}>Keine Kategorien vorhanden.</div>
        ) : visibleMains.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: colors.muted }}>Keine Treffer für &bdquo;{query}&ldquo;.</div>
        ) : visibleMains.map(c => <Row key={c.id} cat={c} depth={0} />)}
      </div>
    </div>
  );
}
