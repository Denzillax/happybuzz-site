"use client";
import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { colors, fonts } from "@/lib/theme";
import { fmtDate, fmtCHF } from "@/lib/formatters";

export const th = { padding: "11px 14px", fontSize: 9.5, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em", textAlign: "left", fontFamily: fonts.body };
export const td = { padding: "12px 14px", fontSize: 12.5, fontFamily: fonts.body };
export const pill = (bg, color, label) => <span style={{ padding: "2px 9px", borderRadius: 0, fontSize: 10, fontWeight: 700, background: bg, color }}>{label}</span>;
export const bcFieldLabel = { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#999", marginBottom: 4 };
export const bcInput = { width: "100%", boxSizing: "border-box", border: "1px solid #E2E2E2", borderRadius: 0, padding: "9px 12px", fontSize: 13, fontFamily: fonts.body, color: "#191615", outline: "none" };
export const chartCard = { border: `1px solid ${colors.border}`, borderRadius: 0, padding: 14, background: "#fff" };
export const chartHead = { display: "flex", justifyContent: "space-between", alignItems: "baseline" };
export const chartLabel = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted };
export const chartBig = { fontSize: 22, fontWeight: 800, fontFamily: fonts.head, margin: "2px 0 8px" };
export const chartSub = { fontSize: 11, fontWeight: 600, color: colors.muted };
export const sumSeries = (s) => Math.round((s || []).reduce((a, d) => a + d.value, 0));
export const axisLabels = (s) => s && s.length ? (
  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: colors.muted }}>
    <span>{fmtDate(s[0].date)}</span><span>heute</span>
  </div>
) : null;

// ── Sortierbare Admin-Tabellen ───────────────────────────────
// useSort haelt Schluessel + Richtung; getVal(row, key) liefert den
// Vergleichswert (Zahl oder String). Erster Klick auf eine Spalte
// sortiert absteigend, der zweite dreht um. sortKey null = Originalreihenfolge.
export function useSort(rows, getVal, defaultKey = null) {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState("desc");
  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const arr = [...rows].sort((a, b) => {
      const va = getVal(a, sortKey), vb = getVal(b, sortKey);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return va - vb;
      return String(va).localeCompare(String(vb), "de");
    });
    return sortDir === "desc" ? arr.reverse() : arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, sortDir]);
  const toggle = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };
  return { sorted, sortKey, sortDir, toggle };
}

export function SortTh({ label, k, sort, align = "left", width }) {
  const active = sort.sortKey === k;
  return (
    <th
      style={{ ...th, textAlign: align, width, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", color: active ? "#191615" : th.color }}
      onClick={() => sort.toggle(k)}
      title="Sortieren"
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        {label}
        {active ? (sort.sortDir === "desc" ? <ArrowDown size={10} /> : <ArrowUp size={10} />) : null}
      </span>
    </th>
  );
}

// Effektiver Preis pro Inserat-Typ: Anzeige-Text + Sortierwert.
// Auktion: nach Zuschlag steht der Verkaufspreis in price, vorher "ab Startpreis".
export function listingPriceText(l) {
  if (l.listing_type === "free") return "Gratis";
  if (l.listing_type === "rent" || l.listing_type === "service") {
    if (!(parseFloat(l.rent_price) > 0)) return "—"; // Altbestand ohne Preis: kein 0.00
    const unit = l.rent_period === "hour" ? "Std" : l.rent_period === "day" ? "Tag" : l.rent_period === "week" ? "Wo" : "Mt";
    return `CHF ${fmtCHF(l.rent_price)} / ${unit}`;
  }
  if (l.listing_type === "auction") return parseFloat(l.price || 0) > 0 ? `CHF ${fmtCHF(l.price)}` : `ab CHF ${fmtCHF(l.start_price)}`;
  return `CHF ${fmtCHF(l.price)}`;
}
export function listingPriceValue(l) {
  if (l.listing_type === "free") return 0;
  if (l.listing_type === "rent" || l.listing_type === "service") return parseFloat(l.rent_price || 0);
  if (l.listing_type === "auction") return parseFloat(l.price || l.start_price || 0);
  return parseFloat(l.price || 0);
}
