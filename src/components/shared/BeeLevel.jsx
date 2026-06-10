"use client";

import { colors, fonts, radius } from "@/lib/theme";
import { calculateLevel, levelProgress, xpToNext, BEE_LEVELS } from "@/lib/gamification";
import BeeIcon from "./BeeIcon";
import { Droplets } from "lucide-react";

/**
 * BeeLevelBadge — XP-basiertes Bee-Level als kleines Badge neben dem Username.
 *
 * Props:
 *  - xp: number — XP-Total des Users
 *  - size: "sm" | "md" | "lg"
 *  - showLabel: boolean — Level-Name anzeigen (default: true)
 */
export function BeeLevelBadge({ xp = 0, size = "sm", showLabel = true }) {
  const level = calculateLevel(xp);

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
      {showLabel && level.name}
    </span>
  );
}

/**
 * BeeLevelCard — XP-Level mit Fortschrittsbalken für Profil/Settings.
 *
 * Props:
 *  - xp: number — XP-Total
 */
export function BeeLevelCard({ xp = 0, nektar = null }) {
  const total = parseInt(xp) || 0;
  const level = calculateLevel(total);
  const idx = BEE_LEVELS.indexOf(level);
  const next = BEE_LEVELS[idx + 1] || null;
  const progress = Math.round(levelProgress(total) * 100);
  const toNext = xpToNext(total);

  return (
    <div style={{
      background: colors.surface, borderRadius: radius.lg,
      border: `1px solid ${colors.border}`, padding: "22px 24px",
    }}>
      {/* Level + XP */}
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
              {level.name}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.muted }}>
              {total.toLocaleString("de-CH")} Pollen
            </p>
          </div>
        </div>
        <BeeLevelBadge xp={total} size="md" showLabel={false} />
      </div>

      {/* Progress Bar */}
      <div style={{
        height: 8, borderRadius: 4, background: colors.borderLt,
        overflow: "hidden", marginBottom: 8,
      }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: level.color,
          width: `${next ? progress : 100}%`,
          transition: "width .5s ease-out",
        }} />
      </div>

      {/* Next Level Info */}
      {next ? (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.muted }}>
          <span>Noch {toNext.toLocaleString("de-CH")} Pollen bis {next.name}</span>
          <span style={{ fontWeight: 600, color: next.color }}>{next.perk}</span>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 12, color: level.color, fontWeight: 600 }}>
          Maximales Level erreicht
        </p>
      )}

      {nektar != null && (
        <a href="/hive" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "#E8A82014", border: "1px solid #E8A82033", textDecoration: "none" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#C8860A" }}>
            <Droplets size={15} color="#C8860A" /> {Number(nektar).toLocaleString("de-CH")} Nektar
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: colors.teal }}>Einlösen →</span>
        </a>
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
