"use client";

import { colors, fonts, radius } from "@/lib/theme";
import { getBeeLevel, getBeeLevelProgress, getNextBeeLevel } from "@/lib/constants";
import BeeIcon from "./BeeIcon";

/**
 * BeeLevelBadge — Zeigt das Bee-Level als kleines Badge neben dem Username.
 *
 * Props:
 *  - impactTotal: number — CHF Bee-Impact des Users
 *  - size: "sm" | "md" | "lg" — Badge-Grösse
 *  - showLabel: boolean — Level-Name anzeigen (default: true)
 */
export function BeeLevelBadge({ impactTotal = 0, size = "sm", showLabel = true }) {
  const level = getBeeLevel(impactTotal);

  const sizes = {
    sm: { icon: 12, font: 10, pad: "2px 7px", gap: 3 },
    md: { icon: 14, font: 11, pad: "3px 9px", gap: 4 },
    lg: { icon: 16, font: 12, pad: "4px 11px", gap: 5 },
  };
  const s = sizes[size] || sizes.sm;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: s.gap,
      padding: s.pad, borderRadius: 20,
      background: `${level.color}18`,
      color: level.color,
      fontSize: s.font, fontWeight: 700, fontFamily: fonts.body,
      lineHeight: 1, whiteSpace: "nowrap",
    }}>
      <BeeIcon size={s.icon} color={level.color} />
      {showLabel && level.label}
    </span>
  );
}

/**
 * BeeLevelCard — Grössere Anzeige mit Fortschrittsbalken für Profil/Settings.
 *
 * Props:
 *  - impactTotal: number — CHF Bee-Impact
 */
export function BeeLevelCard({ impactTotal = 0 }) {
  const level = getBeeLevel(impactTotal);
  const progress = getBeeLevelProgress(impactTotal);
  const next = getNextBeeLevel(impactTotal);
  const total = parseFloat(impactTotal) || 0;

  return (
    <div style={{
      background: colors.surface, borderRadius: radius.lg,
      border: `1px solid ${colors.border}`, padding: "22px 24px",
    }}>
      {/* Level + Impact */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: `${level.color}18`, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <BeeIcon size={24} color={level.color} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: colors.dark, fontFamily: fonts.body }}>
              {level.label}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.muted }}>
              CHF {total.toFixed(2)} Bee-Impact
            </p>
          </div>
        </div>
        <BeeLevelBadge impactTotal={impactTotal} size="md" showLabel={false} />
      </div>

      {/* Progress Bar */}
      <div style={{
        height: 8, borderRadius: 4, background: colors.borderLt,
        overflow: "hidden", marginBottom: 8,
      }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: level.color,
          width: `${progress}%`,
          transition: "width .5s ease-out",
        }} />
      </div>

      {/* Next Level Info */}
      {next ? (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.muted }}>
          <span>{progress}% zum nächsten Level</span>
          <span style={{ fontWeight: 600 }}>
            {next.label} ab CHF {next.min}
          </span>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 12, color: level.color, fontWeight: 600 }}>
          Maximales Level erreicht
        </p>
      )}

      {/* Benefits */}
      {level.benefits && level.benefits.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.borderLt}` }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: ".04em" }}>Deine Vorteile</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {level.benefits.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.dark }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: level.color, flexShrink: 0 }} />
                {b}
              </div>
            ))}
          </div>
          {next && next.benefits && (
            <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, background: `${next.color}10`, fontSize: 11, color: colors.muted }}>
              <span style={{ fontWeight: 600, color: next.color }}>Nächstes Level:</span> {next.benefits[next.benefits.length - 1]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * CommunityImpactCounter. Für die Startseite.
 * Props: total (CHF community), userImpact (CHF persönlich), firstName (Vorname)
 */
export function CommunityImpactCounter({ total = 0, userImpact = 0, firstName = "" }) {
  const t = parseFloat(total) || 0;
  const u = parseFloat(userImpact) || 0;
  const sqm = Math.round(t / 5);
  return (
    <div style={{
      padding: "24px 28px", borderRadius: radius.lg,
      background: "#fff", color: colors.dark, position: "relative", overflow: "hidden",
      border: `1.5px solid ${colors.yellow}33`, boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    }}>
      <div style={{ position: "absolute", top: -20, right: -10, opacity: 0.06 }}>
        <BeeIcon size={120} color={colors.yellow} />
      </div>
      <div style={{ position: "relative" }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: colors.yellow, textTransform: "uppercase", letterSpacing: ".08em", fontFamily: fonts.body }}>
          Gemeinsam bewirkt
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 32, fontWeight: 800, fontFamily: fonts.head, color: colors.dark }}>
          CHF {t.toLocaleString("de-CH", { minimumFractionDigits: 2 })}
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: colors.muted, fontFamily: fonts.body }}>
          Das sind über {sqm.toLocaleString("de-CH")} m² neue Blühflächen.
        </p>
        {u > 0 && firstName && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid #eee` }}>
            <p style={{ margin: 0, fontSize: 12, color: colors.muted, fontFamily: fonts.body }}>Dein Beitrag</p>
            <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 700, fontFamily: fonts.head, color: colors.dark }}>
              CHF {u.toLocaleString("de-CH", { minimumFractionDigits: 2 })}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.yellow, fontWeight: 600, fontFamily: fonts.body }}>
              Danke dafür, {firstName}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
