import { colors, fonts, radius } from "@/lib/theme";

export const inputBase = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: radius.sm,
  border: `1.5px solid ${colors.border}`,
  background: colors.surface,
  fontSize: 14,
  fontFamily: fonts.body,
  color: colors.dark,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .2s, box-shadow .2s",
};

export const labelBase = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: fonts.body,
  color: colors.dark,
  marginBottom: 6,
  letterSpacing: ".01em",
};

export const sectionBase = {
  background: colors.surface,
  borderRadius: radius.lg,
  padding: "24px 20px",
  border: `1px solid ${colors.border}`,
  marginBottom: 16,
};

export const hintStyle = {
  fontSize: 12,
  color: colors.muted,
  fontFamily: fonts.body,
  marginTop: 4,
};
