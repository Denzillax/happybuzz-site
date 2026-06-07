import { colors } from "@/lib/theme";
import { Check, X, Star } from "lucide-react";
const C = colors;

export default function PublicProfileModal({ profile, onClose }) {
  if (!profile) return null;
  const initial = (profile.display_name || profile.username || "?")[0].toUpperCase();

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(25,22,21,.6)",
        backdropFilter: "blur(6px)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn .25s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 440,
          padding: 32, position: "relative",
          boxShadow: "0 24px 64px rgba(0,0,0,.2)",
          animation: "slideUp .3s ease",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 12, background: "none",
          border: "none", fontSize: 22, color: C.muted, cursor: "pointer",
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
        }}><X size={20} /></button>

        {/* Avatar + Name */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 12",
            background: profile.avatar_url
              ? `url(${profile.avatar_url}) center/cover`
              : `linear-gradient(135deg, ${C.yellow}, #E8A820)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 800, color: C.dark,
            fontFamily: "'General Sans', sans-serif",
            border: "3px solid #fff", boxShadow: "0 4px 16px rgba(244,192,63,.3)",
          }}>
            {!profile.avatar_url && initial}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
            <h2 style={{ fontFamily: "'General Sans', sans-serif", fontSize: 22, margin: 0, color: C.dark }}>
              {profile.display_name || profile.username}
            </h2>
            {profile.is_verified && (
              <div style={{
                width: 20, height: 20, borderRadius: "50%", background: C.green,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Check size={12} color="#fff" /></div>
            )}
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>
            Mitglied seit {new Date(profile.created_at).toLocaleDateString("de-CH", { month: "long", year: "numeric" })}
            {profile.city && ` · ${profile.city}`}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 32, marginBottom: 20,
          padding: "16px 0", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
        }}>
          {[
            [profile.listings_count ?? 0, "Inserate"],
            [profile.sales_count ?? 0, "Verkäufe"],
            [profile.rating_avg ?? "–", "Bewertung"],
          ].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, fontFamily: "'General Sans', sans-serif" }}>{v}</div>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p style={{ fontSize: 14, color: C.dark, lineHeight: 1.6, textAlign: "center", margin: "0 0 20px" }}>
            {profile.bio}
          </p>
        )}

        {/* Verification badges */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
          {profile.is_verified && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: C.greenSoft, color: C.green,
            }}><Check size={10} /> Verifiziert</span>
          )}
        </div>

        {/* Rating stars */}
        {profile.rating_count > 0 && (
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 16 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} size={16}
                fill={i <= Math.round(profile.rating_avg) ? C.yellow : "none"}
                color={C.yellow} strokeWidth={2}
              />
            ))}
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 4 }}>
              ({profile.rating_avg}) · {profile.rating_count} Bewertungen
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
