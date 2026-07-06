"use client";
import { BadgeCheck } from "lucide-react";
import { fonts } from "@/lib/theme";

const MOSS = "#5B8C5A";
const MOSS_SOFT = "#EEF4EC";
const INK = "#14110D";

// Öffentliches "Verifiziert"-Abzeichen für Verkäufer.
// Kriterium (bewusst): E-Mail bestätigt UND Ausweis vom Admin geprüft
// (profiles.is_verified && profiles.id_verified). Sonst wird nichts gerendert.
export function isVerifiedSeller(profile) {
  return !!(profile && profile.is_verified && profile.id_verified);
}

/**
 * VerifiedSellerBadge
 * Props:
 *  - profile: Objekt mit is_verified + id_verified (bevorzugt), ODER
 *  - verified: bool (explizit)
 *  - size: "sm" | "md" | "lg"
 *  - label: bool — Text "Verifiziert" zeigen (default true)
 */
export function VerifiedSellerBadge({ profile, verified, size = "sm", label = true }) {
  const show = verified != null ? verified : isVerifiedSeller(profile);
  if (!show) return null;

  const s = size === "lg"
    ? { icon: 15, font: 12, pad: "4px 10px", gap: 5 }
    : size === "md"
      ? { icon: 13, font: 11, pad: "3px 9px", gap: 4 }
      : { icon: 11, font: 10, pad: "2px 7px", gap: 3 };

  return (
    <span
      title="Identität von BEEDARO geprüft (Ausweis + E-Mail)"
      style={{
        display: "inline-flex", alignItems: "center", gap: s.gap,
        padding: s.pad, borderRadius: 8,
        background: MOSS_SOFT, color: MOSS,
        border: `1px solid ${MOSS}`,
        fontFamily: fonts.body, fontSize: s.font, fontWeight: 700,
        lineHeight: 1, whiteSpace: "nowrap",
      }}
    >
      <BadgeCheck size={s.icon} strokeWidth={2.4} color={MOSS} />
      {label && "Verifiziert"}
    </span>
  );
}

export default VerifiedSellerBadge;
