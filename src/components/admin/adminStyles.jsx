import { colors, fonts } from "@/lib/theme";
import { fmtDate } from "@/lib/formatters";

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
