"use client";
import { useState } from "react";
import { Receipt, CheckCircle, Megaphone } from "lucide-react";
import { fmtCHF } from "@/lib/formatters";
import { colors, fonts, radius } from "@/lib/theme";
import BeeIcon from "@/components/shared/BeeIcon";

export function OverviewTab({ admin }) {
  const { stats, gmv, avgOrder, nonCancelledOrders, topSellers, openAnnouncement, setBroadcastOpen, STAT_CARDS, ATTENTION } = admin;
  const [feeView, setFeeView] = useState("paid");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 14 }}>
        <button onClick={openAnnouncement} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", color: colors.dark, border: `1px solid ${colors.border}`, borderRadius: 999, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>
          <Megaphone size={15} /> Banner
        </button>
        <button onClick={() => setBroadcastOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: colors.dark, color: "#fff", border: "none", borderRadius: 999, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>
          <Megaphone size={15} /> Ankündigung senden
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 12, marginBottom: 32 }}>
        {STAT_CARDS.map((s, i) => {
          if (s.feeToggle) {
            const FEE = {
              paid:    ["Gebühren bezahlt",     stats.feesPaid,    stats.impactPaid],
              open:    ["Gebühren offen",       stats.feesOpen,    stats.impactOpen],
              accrued: ["Gebühren aufgelaufen", stats.feesAccrued, stats.impactAccrued],
              total:   ["Gebühren gesamt",      (stats.feesPaid || 0) + (stats.feesOpen || 0) + (stats.feesAccrued || 0), (stats.impactPaid || 0) + (stats.impactOpen || 0) + (stats.impactAccrued || 0)],
            };
            const [feeLabel, feeVal, feeImp] = FEE[feeView] || FEE.paid;
            return (
              <div key={i} style={{ gridColumn: "span 2", background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "17px 18px" }}>
                <span style={{ width: 34, height: 34, borderRadius: 0, background: s.tint + "18", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Receipt size={17} color={s.tint} />
                </span>
                <div style={{ fontSize: 27, fontWeight: 800, fontFamily: fonts.head, lineHeight: 1.05, marginTop: 13, color: colors.dark }}>CHF {fmtCHF(feeVal || 0)}</div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, marginTop: 6 }}>{feeLabel}</div>
                <div style={{ fontSize: 11.5, color: colors.muted, marginTop: 3 }}>davon Bee-Impact CHF {fmtCHF(feeImp || 0)}</div>
                <div style={{ display: "flex", background: colors.cream, borderRadius: 999, padding: 2, marginTop: 11 }}>
                  {[["paid", "Bezahlt"], ["open", "Offen"], ["accrued", "Aufgelaufen"], ["total", "Gesamt"]].map(([k, lbl]) => (
                    <button key={k} onClick={() => setFeeView(k)} style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: 600, padding: "5px 0", borderRadius: 999, border: "none", cursor: "pointer", background: feeView === k ? "#fff" : "transparent", color: feeView === k ? colors.dark : colors.muted, fontFamily: fonts.body }}>{lbl}</button>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={i} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "17px 18px" }}>
              <span style={{ width: 34, height: 34, borderRadius: 0, background: s.tint + "18", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {s.Bee ? <BeeIcon size={17} color={s.tint} /> : <s.Icon size={17} color={s.tint} />}
              </span>
              <div style={{ fontSize: 27, fontWeight: 800, fontFamily: fonts.head, lineHeight: 1.05, marginTop: 13, color: s.danger ? "#EB5E55" : colors.dark }}>
                {s.value}{s.sub && <span style={{ fontSize: 13, fontWeight: 600, color: colors.muted }}> {s.sub}</span>}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, marginTop: 6 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 32 }}>
        <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "17px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted }}>Umsatz (GMV)</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: fonts.head, marginTop: 8 }}>CHF {fmtCHF(gmv)}</div>
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Ø Bestellwert: {avgOrder ? `CHF ${fmtCHF(avgOrder)}` : "—"} · {nonCancelledOrders.length} Käufe</div>
        </div>
        <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "17px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, marginBottom: 10 }}>Top-Verkäufer</div>
          {topSellers.length === 0 ? <div style={{ fontSize: 12, color: colors.muted }}>Noch keine Verkäufe.</div> : topSellers.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
              <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {s.name}</span>
              <span style={{ color: colors.muted, flexShrink: 0, marginLeft: 8 }}>{s.count} · CHF {fmtCHF(s.sum)}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: colors.muted, margin: "0 0 13px" }}>Zu prüfen</h2>
      {ATTENTION.every(a => a.n === 0) ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "20px 22px" }}>
          <CheckCircle size={22} color={colors.green} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Alles ruhig</div>
            <div style={{ fontSize: 12, color: colors.muted }}>Keine geflaggten Konten, Sperren oder offenen Meldungen.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
          {ATTENTION.map((a, i) => (
            <button key={i} onClick={a.onClick} style={{
              display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer", fontFamily: fonts.body,
              background: "#fff", border: `1px solid ${a.n > 0 ? a.color + "55" : colors.border}`, borderRadius: radius.lg, padding: "16px 18px",
            }}>
              <span style={{ width: 44, height: 44, borderRadius: 0, background: (a.n > 0 ? a.color : "#999") + "18", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <a.Icon size={21} color={a.n > 0 ? a.color : "#999"} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 23, fontWeight: 800, fontFamily: fonts.head, lineHeight: 1, color: a.n > 0 ? a.color : colors.dark }}>{a.n}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
