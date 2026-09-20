import { colors, fonts } from "@/lib/theme";

export function Badge({ children, bg = colors.warm, color = colors.muted, style = {} }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20,
      background: bg, color, fontSize: 11, fontWeight: 700,
      fontFamily: fonts.body, letterSpacing: ".03em",
      lineHeight: 1.4, whiteSpace: "nowrap", ...style,
    }}>
      {children}
    </span>
  );
}

export function TypeBadge({ type }) {
  // Formatfarben wie auf der Inseratkarte (TYP_PASTELL), Schrift Ink
  const config = {
    sell:    { bg: "#FBEBEA", color: "#1D1D1D", label: "Festpreis" },
    auction: { bg: "#E3E3FF", color: "#1D1D1D", label: "Auktion" },
    rent:    { bg: "#E3F2FF", color: "#1D1D1D", label: "Miete" },
    service: { bg: "#FFE3FB", color: "#1D1D1D", label: "Service" },
    free:    { bg: "#FFE7A9", color: "#1D1D1D", label: "Gratis" },
  };
  const c = config[type] || config.sell;
  return <Badge bg={c.bg} color={c.color}>{c.label}</Badge>;
}

export function StatusBadge({ status }) {
  const config = {
    active:   { bg: "#DBF5F0", color: "#50804F", label: "Aktiv" },
    draft:    { bg: colors.warm, color: colors.muted, label: "Entwurf" },
    paused:   { bg: "#FFE7A9", color: "#8A5A00", label: "Pausiert" },
    sold:     { bg: "#E3F2FF", color: "#1D1D1D", label: "Verkauft" },
    rented:   { bg: "#E3F2FF", color: "#1D1D1D", label: "Vermietet" },
    inactive: { bg: colors.warm, color: colors.muted, label: "Inaktiv" },
  };
  const c = config[status] || config.draft;
  return <Badge bg={c.bg} color={c.color}>{c.label}</Badge>;
}
