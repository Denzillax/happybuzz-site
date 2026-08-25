import { colors, fonts } from "@/lib/theme";

export function Badge({ children, bg = colors.warm, color = colors.muted, style = {} }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 10,
      background: bg, color, fontSize: 11, fontWeight: 700,
      fontFamily: fonts.body, letterSpacing: ".03em",
      lineHeight: 1.4, whiteSpace: "nowrap", ...style,
    }}>
      {children}
    </span>
  );
}

export function TypeBadge({ type }) {
  const config = {
    sell:    { bg: "#E8F5E9", color: "#2E7D32", label: "Festpreis" },
    auction: { bg: "#EDE7F6", color: "#5E35B1", label: "Auktion" },
    rent:    { bg: "#E3F2FD", color: "#1565C0", label: "Mieten" },
    service: { bg: "#FFF0E6", color: "#E67E22", label: "Service" },
    free:    { bg: "#FFF3E0", color: "#E65100", label: "Gratis" },
  };
  const c = config[type] || config.sell;
  return <Badge bg={c.bg} color={c.color}>{c.label}</Badge>;
}

export function StatusBadge({ status }) {
  const config = {
    active:   { bg: "#E8F5E9", color: "#2E7D32", label: "Aktiv" },
    draft:    { bg: colors.warm, color: colors.muted, label: "Entwurf" },
    paused:   { bg: "#FFF3E0", color: "#E65100", label: "Pausiert" },
    sold:     { bg: "#E3F2FD", color: "#1565C0", label: "Verkauft" },
    rented:   { bg: "#E3F2FD", color: "#1565C0", label: "Vermietet" },
    inactive: { bg: colors.warm, color: colors.muted, label: "Inaktiv" },
  };
  const c = config[status] || config.draft;
  return <Badge bg={c.bg} color={c.color}>{c.label}</Badge>;
}
