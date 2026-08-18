"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CategoryIcon } from "@/components/shared/CategoryIcon";
import { colors, fonts } from "@/lib/theme";
import { getAllCategories } from "@/lib/listings";

// ── Katalog-Design-Tokens ──
const INK = "#14110D";
const SAND = "#ECE3D2";
const PETROL = "#0B5E5C";
const MONO = "'Space Mono', ui-monospace, monospace";

function buildTree(cats) {
  const map = {};
  const roots = [];
  cats.forEach((c) => { map[c.id] = { ...c, children: [] }; });
  cats.forEach((c) => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(map[c.id]);
    } else if (!c.parent_id) {
      roots.push(map[c.id]);
    }
  });
  return roots;
}

export function MegaMenu({ open, onClose }) {
  const [categories, setCategories] = useState([]);
  const [activeMain, setActiveMain] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [activeSubSub, setActiveSubSub] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    getAllCategories().then((data) => setCategories(buildTree(data)));
  }, []);

  useEffect(() => {
    if (!open) { setActiveMain(null); setActiveSub(null); setActiveSubSub(null); }
  }, [open]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open || !categories.length) return null;

  const mainCat = activeMain ? categories.find((c) => c.id === activeMain) : null;
  const subCat = activeSub && mainCat ? mainCat.children.find((c) => c.id === activeSub) : null;
  const subSubCat = activeSubSub && subCat ? subCat.children.find((c) => c.id === activeSubSub) : null;

  const colStyle = {
    width: 240, flexShrink: 0, maxHeight: "70vh", overflowY: "auto", borderRight: `1px solid ${colors.borderLt}`,
    padding: "8px 0",
  };

  const itemStyle = (active) => ({
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 16px", fontSize: 13, fontFamily: fonts.body,
    color: active ? INK : colors.muted, fontWeight: active ? 700 : 500,
    // Hellbeige statt Sand, gelber Akzent statt Petrol (Feedback Denis)
    background: active ? "#F9F4EC" : "transparent",
    cursor: "pointer", transition: "all .1s", textDecoration: "none",
    borderLeft: active ? "3px solid #F4C03F" : "3px solid transparent",
  });

  return (
    <div ref={ref} style={{
      position: "absolute", top: "100%", left: 0, zIndex: 1000,
      background: colors.surface, borderRadius: "0 0 12px 12px",
      border: `1px solid ${INK}`, borderTop: "none",
      boxShadow: "0 16px 40px rgba(20,17,13,.16)",
      display: "flex", minHeight: 300,
    }}>
      {/* Column 1: Main Categories */}
      <div style={colStyle}>
        <div style={{ padding: "8px 16px 12px", fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: PETROL, textTransform: "uppercase", letterSpacing: ".14em" }}>
          Alle Kategorien
        </div>
        {categories.map((cat) => (
          <div
            key={cat.id}
            onMouseEnter={() => { setActiveMain(cat.id); setActiveSub(null); }}
          >
            {cat.children.length > 0 ? (
              <div style={itemStyle(activeMain === cat.id)}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CategoryIcon name={cat.icon} size={16} />
                  {cat.name}
                </span>
                <ChevronRight size={14} />
              </div>
            ) : (
              <Link href={`/search?category=${cat.slug}`} style={itemStyle(activeMain === cat.id)} onClick={onClose}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CategoryIcon name={cat.icon} size={16} />
                  {cat.name}
                </span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Column 2: Subcategories */}
      {mainCat && mainCat.children.length > 0 && (
        <div style={colStyle}>
          <Link href={`/search?category=${mainCat.slug}`} onClick={onClose}
            style={{ display: "block", padding: "8px 16px 12px", fontSize: 13, fontWeight: 700, color: PETROL, textDecoration: "none" }}>
            Alle in {mainCat.name}
          </Link>
          {mainCat.children.map((sub) => (
            <div
              key={sub.id}
              onMouseEnter={() => { setActiveSub(sub.id); setActiveSubSub(null); }}
            >
              {sub.children.length > 0 ? (
                <div style={itemStyle(activeSub === sub.id)}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CategoryIcon name={sub.icon} size={14} />
                    {sub.name}
                  </span>
                  <ChevronRight size={14} />
                </div>
              ) : (
                <Link href={`/search?category=${sub.slug}`} style={itemStyle(activeSub === sub.id)} onClick={onClose}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CategoryIcon name={sub.icon} size={14} />
                    {sub.name}
                  </span>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Column 3: Sub-Subcategories */}
      {subCat && subCat.children.length > 0 && (
        <div style={{ ...colStyle, borderRight: subSubCat ? `1px solid ${colors.borderLt}` : "none" }}>
          <Link href={`/search?category=${subCat.slug}`} onClick={onClose}
            style={{ display: "block", padding: "8px 16px 12px", fontSize: 13, fontWeight: 700, color: PETROL, textDecoration: "none" }}>
            Alle in {subCat.name}
          </Link>
          {subCat.children.map((subsub) => (
            subsub.children.length > 0 ? (
              <div key={subsub.id} onMouseEnter={() => setActiveSubSub(subsub.id)}
                style={itemStyle(activeSubSub === subsub.id)}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CategoryIcon name={subsub.icon} size={14} />
                  {subsub.name}
                </span>
                <ChevronRight size={14} style={{ opacity: 0.4 }} />
              </div>
            ) : (
              <Link key={subsub.id} href={`/search?category=${subsub.slug}`} style={itemStyle(false)} onClick={onClose}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CategoryIcon name={subsub.icon} size={14} />
                  {subsub.name}
                </span>
              </Link>
            )
          ))}
        </div>
      )}

      {/* Column 4: Level 4 categories */}
      {subSubCat && subSubCat.children.length > 0 && (
        <div style={{ ...colStyle, borderRight: "none" }}>
          <Link href={`/search?category=${subSubCat.slug}`} onClick={onClose}
            style={{ display: "block", padding: "8px 16px 12px", fontSize: 13, fontWeight: 700, color: PETROL, textDecoration: "none" }}>
            Alle in {subSubCat.name}
          </Link>
          {subSubCat.children.map((item) => (
            <Link key={item.id} href={`/search?category=${item.slug}`} style={itemStyle(false)} onClick={onClose}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CategoryIcon name={item.icon} size={14} />
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
