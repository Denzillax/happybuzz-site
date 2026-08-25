"use client";

import { colors, fonts, radius } from "@/lib/theme";
import { FEE_TIERS, BEE_IMPACT_RATE, DEFAULT_FEE_PERCENT, DEFAULT_FEE_TIER_CONFIG, FEE_FREE_BELOW, FEE_CAP, isFeeFree } from "@/lib/constants";
import BeeIcon from "@/components/shared/BeeIcon";

export default function FeeModel({ price, selected, onSelect, defaultTier }) {
  const numPrice = parseFloat(price) || 0;
  const numSelected = typeof selected === "number" ? selected : parseInt(selected) || DEFAULT_FEE_PERCENT;
  const activeTier = FEE_TIERS.find((t) => t.pct === numSelected) || DEFAULT_FEE_TIER_CONFIG;

  return (
    <div>
      {/* Tier Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {FEE_TIERS.map((t) => {
          const isActive = numSelected === t.pct;
          const isDefault = defaultTier && (defaultTier === t.tier || defaultTier === t.dbTier || defaultTier === t.pct || defaultTier === String(t.pct));
          const beePct = (t.pct * BEE_IMPACT_RATE).toFixed(1);
          const platPct = (t.pct * (1 - BEE_IMPACT_RATE)).toFixed(1);

          return (
            <div
              key={t.pct}
              onClick={() => onSelect(t.pct, t.tier)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: radius.sm,
                cursor: "pointer",
                background: isActive ? colors.yellowSoft : colors.surface,
                border: `1.5px solid ${isActive ? colors.yellow : colors.border}`,
                transition: "all .15s",
              }}
            >
              {/* Radio */}
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                border: `2px solid ${isActive ? colors.yellow : colors.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {isActive && (
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors.yellow }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, fontFamily: fonts.body, color: colors.dark }}>
                    {t.label}
                  </span>
                  <span style={{
                    fontSize: 18, fontFamily: fonts.head,
                    color: isActive ? colors.yellow : colors.muted, letterSpacing: ".02em",
                  }}>
                    {t.pct}%
                  </span>
                  {isDefault && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, fontFamily: fonts.body,
                      background: colors.green, color: "#fff",
                      padding: "2px 6px", borderRadius: 10,
                      textTransform: "uppercase", letterSpacing: ".04em",
                    }}>
                      Dein Standard
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: colors.muted, fontFamily: fonts.body, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  {platPct}% Plattform · {beePct}% Bee-Impact <BeeIcon size={13} color={colors.yellow} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bagatellgrenze: unter der Schwelle faellt gar keine Gebuehr an */}
      {numPrice > 0 && isFeeFree(numPrice) && (
        <div style={{
          background: colors.surface, border: `1.5px solid ${colors.border}`,
          borderRadius: radius.sm, padding: "14px 16px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontFamily: fonts.body, fontWeight: 700, color: colors.green }}>
              Gebührenfrei
            </span>
            <span style={{ fontSize: 15, fontFamily: fonts.body, fontWeight: 800, color: colors.green }}>
              CHF {numPrice.toFixed(2)}
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: colors.muted, fontFamily: fonts.body }}>
            Verkäufe unter CHF {FEE_FREE_BELOW}.00 sind gebührenfrei. Du bekommst den vollen Betrag,
            dafür fliesst hier kein Bee-Impact. Und nach oben gilt: nie mehr als CHF {FEE_CAP}.00 Gebühr pro Verkauf.
          </p>
        </div>
      )}

      {/* Summary */}
      {numPrice > 0 && !isFeeFree(numPrice) && (() => {
        const rawFee = numPrice * activeTier.pct / 100;
        const capped = rawFee > FEE_CAP;
        const totalFee = Math.min(rawFee, FEE_CAP);
        const beeFee = totalFee * BEE_IMPACT_RATE;
        const platFee = totalFee * (1 - BEE_IMPACT_RATE);
        const payout = numPrice - totalFee;

        return (
          <div style={{
            background: colors.surface, border: `1.5px solid ${colors.border}`,
            borderRadius: radius.sm, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontFamily: fonts.body, color: colors.muted }}>Verkaufspreis</span>
              <span style={{ fontSize: 14, fontFamily: fonts.body, fontWeight: 600, color: colors.dark }}>
                CHF {numPrice.toFixed(2)}
              </span>
            </div>

            {capped && (
              <p style={{ margin: "0 0 8px", fontSize: 12, fontFamily: fonts.body, fontWeight: 700, color: colors.green }}>
                Gebühren-Deckel aktiv: maximal CHF {FEE_CAP}.00 statt CHF {rawFee.toFixed(2)}.
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontFamily: fonts.body, color: colors.muted }}>
                Plattform ({(activeTier.pct * (1 - BEE_IMPACT_RATE)).toFixed(1)}%)
              </span>
              <span style={{ fontSize: 14, fontFamily: fonts.body, fontWeight: 600, color: colors.red }}>
                − CHF {platFee.toFixed(2)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontFamily: fonts.body, color: colors.muted, display: "inline-flex", alignItems: "center", gap: 4 }}>
                Bee-Impact ({(activeTier.pct * BEE_IMPACT_RATE).toFixed(1)}%) <BeeIcon size={13} color={colors.yellow} />
              </span>
              <span style={{ fontSize: 14, fontFamily: fonts.body, fontWeight: 600, color: colors.green }}>
                − CHF {beeFee.toFixed(2)}
              </span>
            </div>

            <div style={{
              borderTop: `1px solid ${colors.border}`, paddingTop: 8, marginTop: 4,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 14, fontFamily: fonts.body, fontWeight: 700, color: colors.dark }}>
                Du erhältst
              </span>
              <span style={{
                fontSize: 18, fontFamily: fonts.head,
                color: colors.green, letterSpacing: ".02em",
              }}>
                CHF {payout.toFixed(2)}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
