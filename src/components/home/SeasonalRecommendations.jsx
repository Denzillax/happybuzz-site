"use client";
import Link from "next/link";
import { Sun, Leaf, Snowflake, Flower2 } from "lucide-react";

const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif";
const MUTED = "#9A9490";
const DARK = "#191615";
const TEAL = "#0E9493";

// Jahreszeit aus Monat (0-11) ableiten.
function getSeason(month) {
  if (month >= 2 && month <= 4) return {
    key: "spring", icon: Flower2, title: "Frühlingserwachen",
    subtitle: "Zeit für Garten, Velo und draussen sein",
    items: [{ label: "Garten", q: "garten" }, { label: "Velo", q: "velo" }, { label: "Outdoor", q: "outdoor" }, { label: "Pflanzen", q: "pflanzen" }],
  };
  if (month >= 5 && month <= 7) return {
    key: "summer", icon: Sun, title: "Sommer-Saison",
    subtitle: "Camping, Velo, Grill und Wassersport",
    items: [{ label: "Camping", q: "camping" }, { label: "Velo", q: "velo" }, { label: "Grill", q: "grill" }, { label: "Wassersport", q: "wassersport" }],
  };
  if (month >= 8 && month <= 10) return {
    key: "autumn", icon: Leaf, title: "Herbst-Saison",
    subtitle: "Mach dich bereit für die kalte Jahreszeit",
    items: [{ label: "Winterjacken", q: "winterjacke" }, { label: "Ski", q: "ski" }, { label: "Snowboard", q: "snowboard" }, { label: "Bücher", q: "bücher" }],
  };
  return {
    key: "winter", icon: Snowflake, title: "Winterzeit",
    subtitle: "Geschenkideen und Spielzeug für drinnen",
    items: [{ label: "Geschenke", q: "geschenk" }, { label: "Spielzeug", q: "spielzeug" }, { label: "Ski", q: "ski" }, { label: "Spiele", q: "spiele" }],
  };
}

export function SeasonalRecommendations() {
  const season = getSeason(new Date().getMonth());
  const Icon = season.icon;

  return (
    <section style={{ padding: "16px 24px 32px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{
        borderRadius: 18, padding: "22px 24px",
        background: `linear-gradient(135deg, ${TEAL}12, #F4C03F18)`,
        border: "1px solid #0E949322",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={18} color={TEAL} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: HEAD, color: DARK, margin: 0 }}>{season.title}</h2>
        </div>
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 14px", paddingLeft: 44 }}>{season.subtitle}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingLeft: 44 }}>
          {season.items.map((it) => (
            <Link key={it.q} href={`/search?q=${encodeURIComponent(it.q)}`} style={{
              padding: "8px 16px", borderRadius: 20, background: "#fff",
              border: "1.5px solid #E2E2E2", fontSize: 13, fontWeight: 600,
              color: DARK, textDecoration: "none", fontFamily: "'Manrope', sans-serif",
            }}>
              {it.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
