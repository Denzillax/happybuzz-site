"use client";
import { useState } from "react";

const T = {
  honey: "#F4C03F", honeyHover: "#E0AF2E", honeySoft: "#FDF6E3",
  dark: "#191615", bg: "#F9F4EC", surface: "#FFFFFF", warm: "#F4EFE6",
  border: "#E8E2D8", borderLt: "#F0EBE2", text: "#191615",
  textMd: "#5C5753", textLt: "#9A9490", green: "#5B8C5A", greenSoft: "#EDF5EC",
  radius: 12, rSm: 8, font: "'Plus Jakarta Sans', system-ui, sans-serif",
};

const TIERS = [
  { k: "fair",      pct: 3,  label: "Fair",      desc: "Deckt die Plattformkosten.", beeRate: 0.20 },
  { k: "supporter", pct: 5,  label: "Supporter", desc: "Empfohlen.",                 beeRate: 0.25, badge: true },
  { k: "impact",    pct: 7,  label: "Impact",    desc: "Starker Beitrag.",            beeRate: 0.30 },
  { k: "hero",      pct: 10, label: "Bee Hero",  desc: "Maximaler Impact.",           beeRate: 0.35 },
];

const Leaf = <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.1 17 3.1s2 6.9 2 12.8c0 1.1-.1 2.1-.3 3.1M6.7 17.3l4.3-4.3"/></svg>;

export default function FeeModel({ price = 0, selected, onSelect }) {
  const [custom, setCustom] = useState("");
  const s = selected || "supporter";
  const p = parseFloat(price) || 0;

  const customPct = Math.max(parseFloat(custom) || 0, 3);
  const activeTier = TIERS.find(t => t.k === s);
  const activePct = s === "custom" ? customPct : (activeTier?.pct || 5);
  const activeBeeRate = s === "custom" ? 0.30 : (activeTier?.beeRate || 0.25);
  const amt = p * activePct / 100;
  const bee = amt * activeBeeRate;

  return (
    <div>
      {/* ── Tier cards (matches live site layout) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {TIERS.map(t => {
          const isSel = s === t.k;
          const tAmt = p * t.pct / 100;
          const tBee = tAmt * t.beeRate;
          return (
            <div key={t.k} onClick={() => { onSelect(t.k); setCustom(""); }}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px", borderRadius: T.radius, cursor: "pointer",
                border: `2px solid ${isSel ? T.honey : T.border}`,
                background: isSel ? T.honeySoft : T.surface,
                transition: "all .15s", position: "relative",
              }}>
              {/* Percentage circle */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: isSel ? T.honey : T.warm,
                color: isSel ? "#fff" : T.text,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 900, flexShrink: 0,
              }}>{t.pct}%</div>
              {/* Label + desc */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: 0 }}>{t.label}</p>
                <p style={{ fontSize: 12, color: T.textMd, margin: "2px 0 0" }}>{t.desc}</p>
              </div>
              {/* Badge */}
              {t.badge && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                  background: isSel ? T.honey : T.greenSoft,
                  color: isSel ? "#fff" : T.green,
                }}>Empfohlen</span>
              )}
            </div>
          );
        })}

        {/* Custom */}
        <div onClick={() => onSelect("custom")}
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 18px", borderRadius: T.radius, cursor: "pointer",
            border: `2px dashed ${s === "custom" ? T.honey : T.border}`,
            background: s === "custom" ? T.honeySoft : T.surface,
            transition: "all .15s",
          }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: s === "custom" ? T.honey : T.warm,
            color: s === "custom" ? "#fff" : T.textLt,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, flexShrink: 0,
          }}>…</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: 0 }}>Eigener Beitrag ab 3 %</p>
              {s === "custom" && (
                <div style={{ display: "flex", alignItems: "center", gap: 2 }} onClick={e => e.stopPropagation()}>
                  <input type="number" value={custom} onChange={e => setCustom(e.target.value)}
                    min="3" placeholder="5"
                    style={{
                      width: 48, padding: "4px 6px", borderRadius: 6, fontSize: 14, fontWeight: 800,
                      border: `1.5px solid ${T.honey}`, outline: "none", textAlign: "center",
                      background: "transparent", fontFamily: T.font, color: T.honey,
                    }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: T.honey }}>%</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: 12, color: T.textMd, margin: "2px 0 0" }}>Du entscheidest selbst.</p>
          </div>
        </div>
      </div>

      {/* ── Beispielrechnung (matches live site exactly) ── */}
      {p > 0 && (
        <div style={{
          background: T.surface, borderRadius: T.radius, padding: "18px 20px",
          border: `1px solid ${T.border}`,
        }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: T.textMd, textTransform: "uppercase",
            letterSpacing: ".06em", margin: "0 0 12px" }}>Beispielrechnung</p>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: T.textMd }}>Verkaufspreis</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: T.text }}>CHF {p.toFixed(2)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: T.textMd }}>Dein Beitrag ({activePct} %)</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: T.honey }}>CHF {amt.toFixed(2)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: T.textMd, fontStyle: "italic" }}>Davon für gutes Projekt</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>ca. CHF {bee.toFixed(2)}</span>
          </div>

          <div style={{ borderTop: `1.5px solid ${T.border}`, paddingTop: 10,
            display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.textMd }}>Du erhältst</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: T.text }}>CHF {(p - amt).toFixed(2)}</span>
          </div>

          <div style={{
            marginTop: 12, padding: "8px 14px", borderRadius: T.rSm,
            background: T.greenSoft, fontSize: 12, color: T.green, fontWeight: 600,
          }}>
            Aktuell unterstützt dieser Anteil Schweizer Bienenschutz.
          </div>
        </div>
      )}

      {/* ── Hint ── */}
      <p style={{ fontSize: 11, color: T.textLt, margin: "10px 0 0",
        display: "flex", alignItems: "center", gap: 4 }}>
        {Leaf} Je höher dein Beitrag, desto mehr fliesst in den Bienenschutz.
      </p>
    </div>
  );
}
