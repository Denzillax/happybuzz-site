"use client";
import { Building2 } from "lucide-react";
import { colors, fonts } from "@/lib/theme";

// "Unternehmen"-Badge für gewerbliche Verkäufer.
// Rendert nichts für Privatkonten (account_type !== 'business').
export function AccountBadge({ accountType, size = "sm" }) {
  if (accountType !== "business") return null;
  const s = size === "lg"
    ? { font: 12, icon: 13, pad: "3px 9px", gap: 4 }
    : { font: 10, icon: 11, pad: "2px 7px", gap: 3 };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: s.gap,
      padding: s.pad, borderRadius: 0,
      background: colors.greenSoft, color: colors.tealDark,
      fontFamily: fonts.body, fontSize: s.font, fontWeight: 700,
      lineHeight: 1, whiteSpace: "nowrap",
    }}>
      <Building2 size={s.icon} /> Unternehmen
    </span>
  );
}

export default AccountBadge;
