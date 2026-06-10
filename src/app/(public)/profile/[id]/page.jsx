"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Star, MapPin, Calendar, Package, ShoppingBag } from "lucide-react";
import { AccountBadge } from "@/components/shared/AccountBadge";
import { colors, fonts, radius } from "@/lib/theme";
import { fmtCHF, fullName } from "@/lib/formatters";

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (p) setProfile(p);
      const { data: ls } = await supabase.from("listings").select("id, title, price, listing_type, status, listing_images(url, sort_order)").eq("user_id", id).eq("status", "active").order("created_at", { ascending: false }).limit(20);
      setListings(ls || []);
      const { data: rs } = await supabase.from("ratings").select("score, comment, created_at, purchase_id").eq("rated_id", id).order("created_at", { ascending: false }).limit(10);
      setRatings(rs || []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div style={{ fontFamily: fonts.body, padding: 60, textAlign: "center", color: "#888" }}>Lade Profil...</div>;
  if (!profile) return <div style={{ fontFamily: fonts.body, padding: 60, textAlign: "center", color: "#888" }}>Profil nicht gefunden</div>;

  const avgRating = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1) : null;
  const img = (l) => l.listing_images?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))?.[0]?.url;

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px 60px" }}>
        {/* Header */}
        <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 30 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: colors.dark, flexShrink: 0 }}>
            {profile.avatar_url ? <img src={profile.avatar_url} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : (profile.display_name?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
                {profile.account_type === "business" && profile.company_name ? profile.company_name : (profile.display_name || "Benutzer")}
              </h1>
              <AccountBadge accountType={profile.account_type} size="lg" />
            </div>
            {profile.account_type === "business" && profile.company_uid && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.muted }}>UID: {profile.company_uid}</p>
            )}
            {profile.city && <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.muted, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {profile.postal_code} {profile.city}</p>}
            <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 13 }}>
              {avgRating && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={14} fill={colors.yellow} color={colors.yellow} /> {avgRating} ({ratings.length} Bewertungen)</span>}
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Package size={14} /> {listings.length} Inserate</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: colors.muted }}><Calendar size={14} /> Dabei seit {new Date(profile.created_at).toLocaleDateString("de-CH", { month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* Inserate */}
        {listings.length > 0 && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Inserate</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 30 }}>
              {listings.map(l => (
                <Link key={l.id} href={`/listing/${l.id}`} style={{ textDecoration: "none", color: colors.dark }}>
                  <div style={{ background: "#fff", borderRadius: radius.md, overflow: "hidden", border: `1px solid ${colors.borderLt}` }}>
                    <div style={{ height: 140, background: "#f0f0f0" }}>
                      {img(l) && <img src={img(l)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                    <div style={{ padding: "10px 12px" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, color: colors.yellow }}>{l.listing_type === "free" ? "Gratis" : `CHF ${fmtCHF(l.price)}`}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Bewertungen */}
        {ratings.length > 0 && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Bewertungen</h2>
            {ratings.map((r, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: radius.md, border: `1px solid ${colors.borderLt}`, padding: "14px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>{[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= r.score ? colors.yellow : "none"} color={s <= r.score ? colors.yellow : colors.muted} />)}</div>
                {r.comment && <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.dark }}>{r.comment}</p>}
                <p style={{ margin: "4px 0 0", fontSize: 11, color: colors.muted }}>{new Date(r.created_at).toLocaleDateString("de-CH")}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
