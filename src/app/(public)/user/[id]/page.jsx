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
import { VerifiedSellerBadge } from "@/components/shared/VerifiedSellerBadge";
import { FounderBadge } from "@/components/shared/FounderBadge";
import { colors, fonts, radius } from "@/lib/theme";
import { getPublicProfile, getUserPublicListings, getUserRatings, getUserAvgRating, toggleFavoriteSeller, isSellerFavorited, getUserNote, saveUserNote, getSellerStats } from "@/lib/listings";
import { supabase } from "@/lib/supabase/supabase";

// Katalog-Tokens (wie öffentliche Seiten)
const K = { ink: "#14110D", sand: "#F9F4EC", paper: "#FBF8F2", honey: "#F4C03F", petrol: "#0B5E5C" };
const MONO = "'Space Mono', monospace";
const HEAD = "'General Sans','Manrope',sans-serif";
const monoLabel = { fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: ".12em", textTransform: "uppercase", color: "#8A8580" };

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

  // Einzeilig ohne Klammern: "INSERATE (10)" brach mobil in zwei Zeilen um
  const TABS = [
    { key: "listings", label: `Inserate ${listings.length}`, icon: Package },
    { key: "ratings", label: `Bewertungen ${ratings.length}`, icon: Star },
  ];

  const fmtDate = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ fontFamily: fonts.body, background: K.paper, minHeight: "100vh", color: K.ink }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>

        <div style={{ ...monoLabel, color: K.ink, marginBottom: 12 }}>Verkäuferprofil · Katalog der zweiten Leben</div>

        {/* ── SHOP-BANNER (nur Unternehmenskonten mit Banner) ── */}
        {profile.account_type === "business" && profile.shop_banner_url && (
          <div style={{ border: `1px solid ${K.ink}`, overflow: "hidden", marginBottom: 24, boxShadow: "6px 6px 0 rgba(20,17,13,.1)" }}>
            <img
              src={profile.shop_banner_url}
              alt={`${profile.company_name || profile.display_name} Banner`}
              className="shop-banner-img"
              style={{ display: "block", width: "100%", aspectRatio: "4 / 1", objectFit: "cover" }}
            />
            <style>{`@media (max-width: 640px) { .shop-banner-img { aspect-ratio: 5 / 2 !important; } }`}</style>
          </div>
        )}

        {/* ── PROFIL HEADER ─────────────────────────────── */}
        <div style={{
          background: "#fff", borderRadius: 0,
          border: `1px solid ${K.ink}`, padding: "28px 30px",
          marginBottom: 24, boxShadow: "6px 6px 0 rgba(20,17,13,.1)",
        }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>

            {/* Avatar */}
            <div style={{
              width: 88, height: 88, borderRadius: 0, border: `1px solid ${K.ink}`, overflow: "hidden", flexShrink: 0,
              background: profile.avatar_url
                ? `url(${profile.avatar_url}) center/cover`
                : K.honey,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, fontWeight: 800, color: K.ink, fontFamily: HEAD,
            }}>
              {!profile.avatar_url && initial}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: HEAD, letterSpacing: "-0.01em" }}>
                  {profile.account_type === "business" && profile.company_name ? profile.company_name : (profile.display_name || profile.username)}
                </h1>
                {/* Hierarchie: Gruendungsmitglied ist das Statussymbol, der
                    Level-Badge (Sammler etc.) tritt eine Stufe zurueck */}
                <AccountBadge accountType={profile.account_type} size="lg" />
                <VerifiedSellerBadge profile={profile} size="lg" />
                <FounderBadge profile={profile} size="lg" />
                <span style={{ opacity: 0.75, transform: "scale(0.9)", transformOrigin: "left center", display: "inline-flex" }}>
                  <BeeLevelBadge xp={profile.xp_total} size="sm" />
                </span>
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
            <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: HEAD }}>{listings.length}</p>
                <p style={{ margin: 0, ...monoLabel }}>Inserate</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: HEAD, color: avgRating.avg >= 4 ? colors.green : K.ink }}>
                  {avgRating.count > 0 ? avgRating.avg.toFixed(1) : "–"}
                </p>
                <p style={{ margin: 0, ...monoLabel }}>{avgRating.count === 1 ? "1 Bewertung" : `${avgRating.count} Bewertungen`}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: HEAD, color: colors.green }}>
                  {(profile.blueten || 0).toLocaleString("de-CH")}
                </p>
                <p style={{ margin: 0, ...monoLabel }}>Blüten</p>
              </div>
            </div>

            {/* Favorite Seller Button */}
            {currentUser && currentUser.id !== params.id && (
              <button onClick={async () => {
                const result = await toggleFavoriteSeller(currentUser.id, params.id);
                setIsSellerFav(result);
              }} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 0,
                border: `1px solid ${K.ink}`,
                background: isSellerFav ? K.honey : "transparent",
                cursor: "pointer", fontFamily: fonts.body,
                fontSize: 13, fontWeight: 700, color: K.ink,
                flexShrink: 0,
              }}>
                <Heart size={16} fill={isSellerFav ? K.honey : "none"} color={isSellerFav ? K.honey : colors.muted} />
                {isSellerFav ? "Gemerkt" : "Verkäufer merken"}
              </button>
            )}
          </div>

          {/* Verkäufer-Statistiken: EINE kompakte Zeile statt Kachel-Dashboard.
              Die Verkaufsrate ist bewusst raus: fuer Kaeufer wertlos und
              unfair gegenueber Verkaeufern mit vielen aktiven Inseraten. */}
          {sellerStats && (sellerStats.completed_sales > 0 || sellerStats.avg_response_minutes != null) && (() => {
            const fmtResp = (m) => m == null ? null : m < 60 ? `${m} Min` : m < 1440 ? `${Math.round(m / 60)} Std` : `${Math.round(m / 1440)} Tg`;
            const teile = [];
            if (sellerStats.completed_sales > 0) teile.push(`${sellerStats.completed_sales} ${sellerStats.completed_sales === 1 ? "Verkauf" : "Verkäufe"}`);
            const resp = fmtResp(sellerStats.avg_response_minutes);
            if (resp) teile.push(`Ø ${resp} Antwortzeit`);
            return (
              <div style={{ marginTop: 16, fontSize: 13.5, fontWeight: 600, color: K.ink }}>
                {teile.join(" · ")}
              </div>
            );
          })()}

          {/* Private Notiz (nur für eingeloggte Nutzer, nicht beim eigenen Profil) */}
          {currentUser && currentUser.id !== params.id && (
            <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 0, background: K.sand, border: `1px solid ${K.ink}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <StickyNote size={15} color={K.ink} />
                <span style={{ ...monoLabel, color: K.ink }}>Private Notiz</span>
                <span style={{ fontSize: 11, color: colors.muted }}>nur für dich sichtbar</span>
              </div>
              <textarea
                value={note}
                onChange={(e) => { setNote(e.target.value); setNoteSaved(false); }}
                placeholder="z.B. Schnelle Antwort, faire Preise…"
                rows={2}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 0, border: `1px solid ${K.ink}`, background: "#fff", fontSize: 13, fontFamily: fonts.body, color: K.ink, resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <button
                  onClick={async () => { setNoteSaving(true); try { await saveUserNote(currentUser.id, params.id, note); setNoteSaved(true); } catch {} finally { setNoteSaving(false); } }}
                  disabled={noteSaving}
                  style={{ padding: "7px 16px", borderRadius: 0, border: `1px solid ${K.ink}`, background: K.petrol, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer", opacity: noteSaving ? 0.6 : 1 }}
                >
                  {noteSaving ? "Speichern…" : "Notiz speichern"}
                </button>
                {noteSaved && <span style={{ fontSize: 12, color: colors.green, fontWeight: 600 }}>Gespeichert</span>}
              </div>
            </div>
          )}

          {/* Rating Summary Bar: mobil Kurzform (X% positiv), die Detail-
              Verteilung nur am Desktop — sie lief rechts aus dem Bild und
              steht ohnehin im Bewertungen-Tab */}
          {avgRating.count > 0 && (
            <div style={{
              display: "flex", gap: "8px 16px", marginTop: 20, paddingTop: 16,
              borderTop: `1px solid ${colors.borderLt}`, alignItems: "center", flexWrap: "wrap",
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
              <span style={{ fontSize: 12, color: colors.muted }}>
                {avgRating.count === 1 ? "1 Bewertung" : `${avgRating.count} Bewertungen`}
                <span className="rating-pct" style={{ color: colors.green, fontWeight: 700 }}> · {Math.round((posCount / avgRating.count) * 100)}% positiv</span>
              </span>
              <div className="rating-detail" style={{ display: "flex", gap: 10, marginLeft: "auto", fontSize: 12 }}>
                <span style={{ color: colors.green, fontWeight: 600 }}>Positiv {posCount}</span>
                <span style={{ color: colors.muted, fontWeight: 600 }}>Neutral {neuCount}</span>
                <span style={{ color: colors.red, fontWeight: 600 }}>Negativ {negCount}</span>
              </div>
              <style>{`
                .rating-pct { display: none; }
                @media (max-width: 640px) {
                  .rating-detail { display: none !important; }
                  .rating-pct { display: inline; }
                }
              `}</style>
            </div>
          )}
        </div>

        {/* ── TABS ─────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 0, borderBottom: `1px solid ${K.ink}`,
          marginBottom: 24,
        }}>
          {TABS.map(t => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "12px 18px", background: "none", border: "none",
                borderBottom: active ? `3px solid ${K.honey}` : "3px solid transparent",
                marginBottom: -2, cursor: "pointer",
                fontSize: 11, fontWeight: 700, fontFamily: MONO, letterSpacing: ".1em", textTransform: "uppercase",
                color: active ? K.ink : colors.muted,
                display: "flex", alignItems: "center", gap: 6,
                whiteSpace: "nowrap", transition: "all .15s",
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
                    <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 0, background: "#fff", border: `1px solid ${K.ink}`, fontSize: 12.5, color: K.ink, fontFamily: fonts.body }}>
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
                      background: "#fff", borderRadius: 0,
                      border: `1px solid ${K.ink}`, padding: "18px 22px",
                      display: "flex", gap: 16, alignItems: "flex-start",
                    }}>
                      {/* Rater Avatar */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 0, border: `1px solid ${K.ink}`, flexShrink: 0,
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
