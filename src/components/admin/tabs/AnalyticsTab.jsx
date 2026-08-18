"use client";
import { fmtCHF } from "@/lib/formatters";
import { colors, fonts } from "@/lib/theme";
import { TrendChart } from "@/components/admin/TrendChart";
import { chartCard, chartHead, chartLabel, chartBig, chartSub, sumSeries, axisLabels } from "@/components/admin/adminStyles";
import { LiveOnline, VisitLog } from "@/components/admin/LiveOnline";

export function AnalyticsTab({ admin }) {
  const { analyticsRange, setAnalyticsRange, analytics, analyticsLoading } = admin;
  return (
    <div>
      <LiveOnline />
      <VisitLog />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 16 }}>
        <div style={{ display: "inline-flex", background: colors.cream, borderRadius: 999, padding: 3 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setAnalyticsRange(d)} style={{ fontSize: 11, fontWeight: analyticsRange === d ? 700 : 500, padding: "6px 13px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: fonts.body, background: analyticsRange === d ? colors.dark : "transparent", color: analyticsRange === d ? "#fff" : colors.muted }}>{d} Tage</button>
          ))}
        </div>
      </div>
      {(!analytics || analyticsLoading) ? (
        <div style={{ padding: 40, textAlign: "center", color: colors.muted, fontSize: 13 }}>Lade Analytik…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          <div style={chartCard}>
            <div style={chartHead}><span style={chartLabel}>Neue Nutzer</span><span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>+{sumSeries(analytics.users)}</span></div>
            <div style={chartBig}>{sumSeries(analytics.users)} <span style={chartSub}>in {analyticsRange} Tagen</span></div>
            <TrendChart data={analytics.users} color="#0E9493" type="area" />
            {axisLabels(analytics.users)}
          </div>
          <div style={chartCard}>
            <div style={chartHead}><span style={chartLabel}>Umsatz (GMV)</span><span style={{ fontSize: 11, color: colors.muted }}>{analytics.sales} Verkäufe</span></div>
            <div style={chartBig}>CHF {fmtCHF(analytics.gmv.reduce((a, d) => a + d.value, 0))}</div>
            <TrendChart data={analytics.gmv} color="#D9A005" type="bar" />
            {axisLabels(analytics.gmv)}
          </div>
          <div style={chartCard}>
            <div style={chartHead}><span style={chartLabel}>Neue Inserate</span><span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>+{sumSeries(analytics.listings)}</span></div>
            <div style={chartBig}>{sumSeries(analytics.listings)} <span style={chartSub}>in {analyticsRange} Tagen</span></div>
            <TrendChart data={analytics.listings} color="#5B8C5A" type="line" />
            {axisLabels(analytics.listings)}
          </div>
          <div style={chartCard}>
            <span style={chartLabel}>Inserate nach Typ</span>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
              {(() => {
                const maxT = Math.max(1, ...analytics.byType.map(t => t.count));
                const lbl = { sell: "Festpreis", auction: "Auktion", rent: "Miete", free: "Gratis", service: "Service" };
                const col = { sell: "#F4C03F", auction: "#94B9C9", rent: "#8B6DB0", free: "#5B8C5A", service: "#E67E22" };
                return analytics.byType.map(t => (
                  <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                    <span style={{ width: 62, color: "#3a3a3a" }}>{lbl[t.type]}</span>
                    <div style={{ flex: 1, background: colors.cream, borderRadius: 999, height: 10 }}><div style={{ width: `${(t.count / maxT) * 100}%`, height: 10, borderRadius: 999, background: col[t.type] }} /></div>
                    <span style={{ color: colors.muted, width: 22, textAlign: "right" }}>{t.count}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
