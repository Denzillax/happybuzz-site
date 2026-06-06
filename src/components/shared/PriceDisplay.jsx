import { colors, fonts } from "@/lib/theme";
import { getDisplayPrice } from "@/lib/formatters";

export function PriceDisplay({ listing, size = "md" }) {
  const { text, prefix, suffix } = getDisplayPrice(listing);
  const isFree = listing.listing_type === "free";
  const sizes = {
    sm: { price: 16, label: 11 },
    md: { price: 20, label: 12 },
    lg: { price: 32, label: 14 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <p style={{ margin: 0, lineHeight: 1.2 }}>
      {prefix && <span style={{ fontSize: s.label, fontWeight: 500, fontFamily: fonts.body, color: colors.muted }}>{prefix}</span>}
      <span style={{ fontSize: s.price, fontWeight: 700, fontFamily: fonts.head, color: isFree ? colors.green : colors.dark, letterSpacing: ".01em" }}>{text}</span>
      {suffix && <span style={{ fontSize: s.label, fontWeight: 500, fontFamily: fonts.body, color: colors.muted, marginLeft: 3 }}>{suffix}</span>}
    </p>
  );
}
