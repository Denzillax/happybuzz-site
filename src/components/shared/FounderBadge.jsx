"use client";
import BeeIcon from "@/components/shared/BeeIcon";
import { fonts } from "@/lib/theme";

const HONEY = "#F4C03F";
const HONEY_SOFT = "#FBF1D2";
const INK = "#14110D";

// Öffentliches "Gründungsmitglied"-Abzeichen.
// Kriterium: profiles.founder_number ist gesetzt. Die Nummer vergibt der
// DB-Trigger assign_founder_number beim ersten Verkauf, an die ersten 500
// Verkäufer. Sie ist dauerhaft und kann nicht nachgekauft werden.
export function isFounder(profile) {
  return !!(profile && profile.founder_number);
}

/**
 * FounderBadge
 * Props:
 *  - profile: Objekt mit founder_number (bevorzugt), ODER
 *  - number: Zahl (explizit)
 *  - size: "sm" | "md" | "lg"
 *  - label: bool — Text "Gründungsmitglied" zeigen (default true).
 *           Bei false erscheint nur die Nummer, für enge Stellen wie Karten.
 */
export function FounderBadge({ profile, number, size = "sm", label = true }) {
  const nr = number != null ? number : profile?.founder_number;
  if (!nr) return null;

  const s = size === "lg"
    ? { icon: 14, font: 12, pad: "4px 10px", gap: 5 }
    : size === "md"
      ? { icon: 12, font: 11, pad: "3px 9px", gap: 4 }
      : { icon: 10, font: 10, pad: "2px 7px", gap: 3 };

  return (
    <span
      title={`Gründungsmitglied Nr. ${nr}: einer der ersten 500 Verkäufer auf BEEDARO`}
      style={{
        display: "inline-flex", alignItems: "center", gap: s.gap,
        padding: s.pad, borderRadius: 10,
        background: HONEY_SOFT, color: INK,
        border: `1px solid ${HONEY}`,
        fontFamily: fonts.body, fontSize: s.font, fontWeight: 700,
        lineHeight: 1, whiteSpace: "nowrap",
      }}
    >
      <BeeIcon size={s.icon} color={HONEY} />
      {label ? `Gründungsmitglied Nr. ${nr}` : `Nr. ${nr}`}
    </span>
  );
}

export default FounderBadge;
