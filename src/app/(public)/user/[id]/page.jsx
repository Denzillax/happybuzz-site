"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Calendar, Star, Package, ShoppingBag, ArrowLeft, Loader2, Heart, StickyNote,
} from "lucide-react";
import BeeIcon from "@/components/shared/BeeIcon";
import { BeeLevelBadge, BeeLevelCard } from "@/components/shared/BeeLevel";
import { ListingCard } from "@/components/shared/ListingCard";
import { AccountBadge } from "@/components/shared/AccountBadge";
import { colors, fonts, radius } from "@/lib/theme";
import { getPublicProfile, getUserPublicListings, getUserRatings, getUserAvgRating, toggleFavoriteSeller, isSellerFavorited, getUserNote, saveUserNote, getSellerStats } from "@/lib/listings";
import { supabase } from "@/lib/supabase/supabase";

export default function PublicProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [avgRating, setAvgRating] = useState({ avg: 0, count: 0 });
  const [isSellerFav, setIsSellerFav] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState("listings");
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [sellerStats, setSellerStats] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [prof, items, rats, avg] = await Promise.all([
          getPublicProfile(params.id),
          getUserPublicListings(params.id),
          getUserRatings(params.id),
          getUserAvgRating(params.id),
        ]);
        setProfile(prof);
        setListings(items);
        setRatings(rats);
        setAvgRating(avg);
        getSellerStats(params.id).then(setSellerStats).catch(() => {});

        try {
          const { data } = await supabase.auth.getUser();
          setCurrentUser(data?.user || null);
          if (data?.user && data.user.id !== params.id) {
            setIsSellerFav(await isSellerFavorited(data.user.id, params.id));
            getUserNote(data.user.id, params.id).then(setNote).catch(() => {});
          }
        } catch {}
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [params.id]);

  if (loading) return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={24} color={colors.muted} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!profile) return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: colors.muted }}>Profil nicht gefunden</p>
    </div>
  );

  const initial = (profile.display_name || "?")[0].toUpperCase();
  const memberSince = new Date(profile.created_at).toLocaleDateString("de-CH", { month: "long", year: "numeric" });
  const posCount = ratings.filter(r => r.rating >= 4).length;
  const neuCount = ratings.filter(r => r.rating === 3).length;
  const negCount = ratings.filter(r => r.rating <= 2).length;

  const TABS = [
    { key: "listings", label: `Inserate (${listings.length})`, icon: Package },
    { key: "ratings", label: `Bewertungen (${ratings.length})`, icon: Star },
  ];

  const fmtDate = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* ── PROFIL HEADER ─────────────────────────────── */}
        <div style={{
          background: colors.surface, borderRadius: radius.lg,
          border: `1px solid ${colors.border}`, padding: "28px 30px",
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>

            {/* Avatar */}
            <div style={{
              width: 88, height: 88, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
              background: profile.avatar_url
                ? `url(${profile.avatar_url}) center/cover`
                : `linear-gradient(135deg, ${colors.yellow}, #E8A820)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, fontWeight: 800, color: colors.dark,
            }}>
              {!profile.avatar_url && initial}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: fonts.head }}>
                  {profile.account_type === "business" && profile.company_name ? profile.company_name : (profile.display_name || profile.username)}
                </h1>
                <AccountBadge accountType={profile.account_type} size="lg" />
                <BeeLevelBadge xp={profile.xp_total} size="md" />
              </div>

              {profile.account_type === "business" && profile.company_uid && (
                <p style={{ margin: "0 0 8px", fontSize: 12, color: colors.muted }}>UID: {profile.company_uid}</p>
              )}

              {profile.bio && (
                <p style={{ margin: "0 0 10px", fontSize: 14, color: colors.muted, lineHeight: 1.5 }}>{profile.bio}</p>
              )}

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: colors.muted }}>
                {profile.city && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={13} /> {profile.city}
                  </span>
                )}
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={13} /> Dabei seit {memberSince}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: fonts.head }}>{listings.length}</p>
                <p style={{ margin: 0, fontSize: 11, color: colors.muted }}>Inserate</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: fonts.head, color: avgRating.avg >= 4 ? colors.green : colors.dark }}>
                  {avgRating.count > 0 ? avgRating.avg.toFixed(1) : "–"}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: colors.muted }}>{avgRating.count} Bewert.</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: fonts.head, color: colors.green }}>
                  {(profile.blueten || 0).toLocaleString("de-CH")}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: colors.muted }}>Blüten</p>
              </div>
            </div>

            {/* Favorite Seller Button */}
            {currentUser && currentUser.id !== params.id && (
              <button onClick={async () => {
                const result = await toggleFavoriteSeller(currentUser.id, params.id);
                setIsSellerFav(result);
              }} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: radius.sm,
                border: `1.5px solid ${isSellerFav ? colors.yellow : colors.border}`,
                background: isSellerFav ? `${colors.yellow}15` : "transparent",
                cursor: "pointer", fontFamily: fonts.body,
                fontSize: 13, fontWeight: 700, color: colors.dark,
                flexShrink: 0,
              }}>
                <Heart size={16} fill={isSellerFav ? colors.yellow : "none"} color={isSellerFav ? colors.yellow : colors.muted} />
                {isSellerFav ? "Gemerkt" : "Verkäufer merken"}
              </button>
            )}
          </div>

          {/* Verkäufer-Statistiken (server-berechnet) */}
          {sellerStats && (sellerStats.completed_sales > 0 || sellerStats.sales_rate != null || sellerStats.avg_response_minutes != null) && (() => {
            const fmtResp = (m) => m == null ? "–" : m < 60 ? `${m} Min` : m < 1440 ? `${Math.round(m / 60)} Std` : `${Math.round(m / 1440)} Tg`;
            const tiles = [
              { v: sellerStats.completed_sales, l: "Verkäufe" },
              { v: sellerStats.sales_rate != null ? `${sellerStats.sales_rate}%` : "–", l: "Verkaufsrate" },
              { v: sellerStats.avg_response_minutes != null ? fmtResp(sellerStats.avg_response_minutes) : "–", l: "Ø Antwortzeit" },
            ];
            return (
              <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                {tiles.map((t) => (
                  <div key={t.l} style={{ flex: 1, minWidth: 100, padding: "12px 14px", borderRadius: radius.md, background: colors.cream, border: `1px solid ${colors.borderLt}`, textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: fonts.head, color: colors.dark }}>{t.v}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.muted }}>{t.l}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Private Notiz (nur für eingeloggte Nutzer, nicht beim eigenen Profil) */}
          {currentUser && currentUser.id !== params.id && (
            <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: radius.md, background: colors.cream, border: `1px solid ${colors.borderLt}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <StickyNote size={15} color={colors.muted} />
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.dark }}>Private Notiz</span>
                <span style={{ fontSize: 11, color: colors.muted }}>nur für dich sichtbar</span>
              </div>
              <textarea
                value={note}
                onChange={(e) => { setNote(e.target.value); setNoteSaved(false); }}
                placeholder="z.B. Schnelle Antwort, faire Preise…"
                rows={2}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${colors.border}`, background: "#fff", fontSize: 13, fontFamily: fonts.body, color: colors.dark, resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <button
                  onClick={async () => { setNoteSaving(true); try { await saveUserNote(currentUser.id, params.id, note); setNoteSaved(true); } catch {} finally { setNoteSaving(false); } }}
                  disabled={noteSaving}
                  style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: colors.teal, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer", opacity: noteSaving ? 0.6 : 1 }}
                >
                  {noteSaving ? "Speichern…" : "Notiz speichern"}
                </button>
                {noteSaved && <span style={{ fontSize: 12, color: colors.green, fontWeight: 600 }}>Gespeichert</span>}
              </div>
            </div>
          )}

          {/* Rating Summary Bar */}
          {avgRating.count > 0 && (
            <div style={{
              display: "flex", gap: 16, marginTop: 20, paddingTop: 16,
              borderTop: `1px solid ${colors.borderLt}`, alignItems: "center",
            }}>
              <div style={{ display: "flex", gap: 3 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={18}
                    color={s <= Math.round(avgRating.avg) ? colors.yellow : colors.borderLt}
                    fill={s <= Math.round(avgRating.avg) ? colors.yellow : "none"}
                  />
                ))}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{avgRating.avg.toFixed(1)}</span>
              <span style={{ fontSize: 12, color: colors.muted }}>({avgRating.count} Bewertungen)</span>
              <div style={{ display: "flex", gap: 10, marginLeft: "auto", fontSize: 12 }}>
                <span style={{ color: colors.green, fontWeight: 600 }}>Positiv {posCount}</span>
                <span style={{ color: colors.muted, fontWeight: 600 }}>Neutral {neuCount}</span>
                <span style={{ color: colors.red, fontWeight: 600 }}>Negativ {negCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── TABS ─────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 0, borderBottom: `2px solid ${colors.border}`,
          marginBottom: 24,
        }}>
          {TABS.map(t => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "12px 24px", background: "none", border: "none",
                borderBottom: active ? `2px solid ${colors.yellow}` : "2px solid transparent",
                marginBottom: -2, cursor: "pointer",
                fontSize: 14, fontWeight: active ? 700 : 500,
                fontFamily: fonts.body, color: active ? colors.dark : colors.muted,
                display: "flex", alignItems: "center", gap: 6,
                transition: "all .15s",
              }}>
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB: INSERATE ───────────────────────────── */}
        {tab === "listings" && (
          <div>
            {listings.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: colors.muted }}>
                <Package size={40} color={colors.mutedLt} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 15, fontWeight: 600 }}>Keine aktiven Inserate</p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 16,
              }}>
                {listings.map(l => (
                  <ListingCard key={l.id} listing={l} userId={currentUser?.id} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: BEWERTUNGEN ────────────────────────── */}
        {tab === "ratings" && (
          <div>
            {/* Tag-Aggregation */}
            {(() => {
              const counts = {};
              ratings.forEach(r => (r.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
              const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
              if (!sorted.length) return null;
              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {sorted.map(([t, c]) => (
                    <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 20, background: "#E6F5F5", border: `1px solid ${colors.teal}33`, fontSize: 13, color: colors.tealDark, fontFamily: fonts.body }}>
                      <b style={{ fontWeight: 800 }}>{c}×</b> {t}
                    </span>
                  ))}
                </div>
              );
            })()}
            {ratings.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: colors.muted }}>
                <Star size={40} color={colors.mutedLt} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 15, fontWeight: 600 }}>Noch keine Bewertungen</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ratings.map((r) => {
                  const sentiment = r.rating >= 4 ? "Positiv" : r.rating === 3 ? "Neutral" : "Negativ";
                  const sentColor = r.rating >= 4 ? colors.green : r.rating === 3 ? colors.muted : colors.red;
                  return (
                    <div key={r.id} style={{
                      background: colors.surface, borderRadius: radius.lg,
                      border: `1px solid ${colors.border}`, padding: "18px 22px",
                      display: "flex", gap: 16, alignItems: "flex-start",
                    }}>
                      {/* Rater Avatar */}
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                        background: r.raterAvatar
                          ? `url(${r.raterAvatar}) center/cover`
                          : colors.yellowSoft,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden",
                      }}>
                        {!r.raterAvatar && <BeeIcon size={20} color={colors.yellow} />}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{r.raterName}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: sentColor }}>{sentiment}</span>
                          <span style={{ fontSize: 12, color: colors.muted }}>{fmtDate(r.created_at)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={15}
                              color={s <= r.rating ? colors.yellow : colors.borderLt}
                              fill={s <= r.rating ? colors.yellow : "none"}
                            />
                          ))}
                        </div>
                        {r.comment && (
                          <p style={{ margin: 0, fontSize: 14, color: colors.dark, lineHeight: 1.5 }}>{r.comment}</p>
                        )}
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.muted }}>
                          {r.role === "buyer" ? "als Käufer" : "als Verkäufer"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
