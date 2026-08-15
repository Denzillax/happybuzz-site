"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Package, Star, Gavel, Clock, Home, Gift, Flame, ShoppingBag, Wrench } from "lucide-react";
import { colors, fonts } from "@/lib/theme";
import { getCoverUrl, conditionLabel } from "@/lib/formatters";
import { makeArtRef } from "@/lib/fees";
import { PriceDisplay } from "./PriceDisplay";
import { FavoriteButton } from "./FavoriteButton";
import { AccountBadge } from "./AccountBadge";
import { VerifiedSellerBadge } from "./VerifiedSellerBadge";
import { useFavorite } from "@/hooks/useFavorite";

// ── Katalog-Design-Tokens (Hero/CommunityImpact-konsistent) ──
const INK = "#14110D";
const SAND = "#ECE3D2";
const PAPER = "#FBF8F2";
const HONEY = "#F4C03F";
const MONO = "'Space Mono', ui-monospace, monospace";

// Zeitangabe für alle Inserattypen: > 24h -> Datum + Uhrzeit ("bis 14. Juni, 15:00"),
// < 24h -> Live-Countdown ("3h 5m" / "12m 9s"), abgelaufen -> endedLabel.
// Live-Intervall nur bei < 24h (Performance bei vielen Karten im Grid).
function Countdown({ endDate, endedLabel = "Beendet" }) {
  const [text, setText] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    if (!endDate) { setText(""); return; }
    let iv;
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) {
        setText(endedLabel); setUrgent(true);
        if (iv) { clearInterval(iv); iv = null; }
        return;
      }
      if (diff > 86400000) {
        const end = new Date(endDate);
        const d = end.toLocaleDateString("de-CH", { day: "numeric", month: "short" });
        const t = end.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
        setText(`bis ${d}, ${t}`);
        setUrgent(false);
      } else {
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setText(hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m ${secs}s`);
        setUrgent(true);
      }
    };
    tick();
    if (new Date(endDate).getTime() - Date.now() <= 86400000) iv = setInterval(tick, 1000);
    return () => { if (iv) clearInterval(iv); };
  }, [endDate, endedLabel]);

  if (!text) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: urgent ? 700 : 400, color: urgent ? "#c62828" : colors.muted, whiteSpace: "nowrap" }}>
      <Clock size={10} /> {text}
    </span>
  );
}

export function ListingCard(props) {
  const { listing, userId = null, boost = null, onUnfavorite = null } = props;
  const [hover, setHover] = useState(false);
  const { isFav, toggleFav } = useFavorite(userId, listing.id);
  const cover = getCoverUrl(listing);

  // Optional: Eltern benachrichtigen, wenn ein Favorit entfernt wurde
  // (z.B. Favoriten-Seite entfernt die Karte aus der Liste).
  const handleToggleFav = async () => {
    const wasFav = isFav;
    await toggleFav();
    if (wasFav && onUnfavorite) onUnfavorite(listing.id);
  };

  const isAuction = listing.listing_type === "auction";
  const isRent = listing.listing_type === "rent";
  const isFree = listing.listing_type === "free";
  const isService = listing.listing_type === "service";
  // Hover-Border passend zum Inserattyp (gleiche Farbe wie das Typ-Badge)
  const accent = isAuction ? "#94B9C9" : isRent ? "#8B6DB0" : isFree ? colors.nature : isService ? "#E67E22" : colors.yellow;

  const createdAt = listing.created_at ? new Date(listing.created_at) : null;
  const isNew = createdAt && (Date.now() - createdAt.getTime()) < 24 * 60 * 60 * 1000;
  const bidCount = listing.bid_count || 0;
  const viewCount = listing.view_count || 0;
  const favCount = listing.favorite_count || 0;
  const isPopular = (isAuction && bidCount > 5) || favCount > 3 || viewCount > 100;
  const boosts = boost || listing.boost || [];
  const hasSpotlight = boosts.includes("spotlight") || boosts.includes("mega_boost");
  const hasFeatured = boosts.includes("golden_stamp") || boosts.includes("mega_boost");
  const endingSoon = isAuction && listing.auction_end && (new Date(listing.auction_end).getTime() - Date.now()) < 24 * 60 * 60 * 1000 && (new Date(listing.auction_end).getTime() - Date.now()) > 0;
  const endDate = isAuction ? (listing.auction_end || listing.expires_at) : listing.expires_at;

  return (
    <Link href={`/listing/${listing.id}`} style={{ textDecoration: "none", color: "inherit", height: "100%" }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: colors.surface, borderRadius: 0,
          border: hasSpotlight ? `1.5px solid ${HONEY}` : `1px solid ${INK}`,
          overflow: "hidden",
          transition: "transform .2s ease, box-shadow .2s ease",
          transform: hover ? "translateY(-3px)" : "translateY(0)",
          boxShadow: hasSpotlight
            ? `0 0 0 3px ${HONEY}33, 0 12px 26px rgba(20,17,13,.13)`
            : hover ? "0 12px 26px rgba(20,17,13,.13)" : "none",
          display: "flex", flexDirection: "column", height: "100%",
        }}
      >
        {/* Image — Katalog-Tafel mit Trennlinie */}
        <div style={{ position: "relative", aspectRatio: "4/3", background: SAND, overflow: "hidden", borderBottom: `1px solid ${INK}` }}>
          {cover
            ? <img src={cover} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.04)" : "scale(1)", transition: "transform .3s ease" }} loading="lazy" />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={40} color="#ccc" /></div>
          }

          {/* Top-left: colored badges */}
          <div style={{ position: "absolute", top: 8, left: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {hasFeatured && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 0, background: "#E8A820", color: "#fff", textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 2 }}>
                <Star size={9} fill="#fff" /> Featured
              </span>
            )}
            {hasSpotlight && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 0, background: colors.yellow, color: colors.dark, textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 2 }}>
                <Star size={9} /> Gesponsert
              </span>
            )}
            {isNew && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 0, background: colors.yellow, color: colors.dark, textTransform: "uppercase", letterSpacing: ".04em" }}>Neu</span>
            )}
            {isPopular && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 0, background: "#FF6B35", color: "#fff", textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 2 }}>
                <Flame size={9} /> Beliebt
              </span>
            )}
            {endingSoon && !isPopular && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 0, background: "#c62828", color: "#fff", textTransform: "uppercase", letterSpacing: ".04em" }}>Endet bald</span>
            )}
          </div>

          {/* Top-right: colored type badge */}
          <div style={{ position: "absolute", top: 8, right: 8 }}>
            {isAuction && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 0, background: "#94B9C9", color: "#fff", display: "flex", alignItems: "center", gap: 3 }}>
                <Gavel size={10} /> Auktion
              </span>
            )}
            {isRent && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 0, background: "#8B6DB0", color: "#fff", display: "flex", alignItems: "center", gap: 3 }}>
                <Home size={10} /> Miete
              </span>
            )}
            {isFree && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 0, background: colors.nature, color: "#fff", display: "flex", alignItems: "center", gap: 3 }}>
                <Gift size={10} /> Gratis
              </span>
            )}
            {isService && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 0, background: "#E67E22", color: "#fff", display: "flex", alignItems: "center", gap: 3 }}>
                <Wrench size={10} /> Service
              </span>
            )}
            {!isAuction && !isRent && !isFree && !isService && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 0, background: colors.yellow, color: colors.dark, display: "flex", alignItems: "center", gap: 3 }}>
                <ShoppingBag size={10} /> Festpreis
              </span>
            )}
          </div>

          {/* Bottom-right: favorite heart */}
          <div style={{ position: "absolute", bottom: 8, right: 8 }}>
            <FavoriteButton isFav={isFav} onToggle={handleToggleFav} />
          </div>
        </div>

        {/* Info — flex-grow for equal height */}
        <div style={{ padding: "11px 14px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Katalog-Kopf: Referenznummer + Zustands-Stempel */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 7 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".04em", color: colors.muted, whiteSpace: "nowrap" }}>
              {makeArtRef(listing.id)}
            </span>
            {listing.condition && (
              <span style={{
                fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                color: INK, border: `1px solid ${INK}`, borderRadius: 0, padding: "2px 6px",
                whiteSpace: "nowrap", flexShrink: 0,
              }}>
                {conditionLabel(listing.condition)}
              </span>
            )}
          </div>

          <p style={{
            fontSize: 14.5, fontWeight: 600, fontFamily: fonts.head,
            lineHeight: 1.3, margin: "0 0 4px", letterSpacing: "-0.01em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            color: INK,
          }}>
            {listing.title}
          </p>

          {/* Price + Auction info */}
          <div style={{ marginTop: 2 }}>
            {isAuction ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, fontFamily: fonts.head, color: INK, letterSpacing: "-0.01em" }}>
                    CHF {(listing.price || listing.start_price || 0).toFixed(2)}
                  </span>
                  {bidCount > 0 && <span style={{ fontSize: 11, color: colors.muted }}>{bidCount} {bidCount === 1 ? "Gebot" : "Gebote"}</span>}
                </div>
                {listing.buy_now_price > 0 && (
                  <div style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>
                    Sofortkauf: CHF {listing.buy_now_price.toFixed(2)}
                  </div>
                )}
              </>
            ) : isRent ? (
              <>
                <span style={{ fontSize: 18, fontWeight: 800, fontFamily: fonts.head, color: INK, letterSpacing: "-0.01em" }}>
                  CHF {(listing.rent_price || listing.price || 0).toFixed(2)}
                </span>
                <span style={{ fontSize: 11, color: colors.muted, marginLeft: 4 }}>
                  / {listing.rent_period === "hour" ? "Std" : listing.rent_period === "day" ? "Tag" : listing.rent_period === "week" ? "Woche" : "Monat"}
                </span>
                {listing.deposit_amount > 0 && (
                  <div style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>Kaution: CHF {listing.deposit_amount.toFixed(2)}</div>
                )}
              </>
            ) : isService ? (
              <>
                <span style={{ fontSize: 18, fontWeight: 800, fontFamily: fonts.head, color: INK, letterSpacing: "-0.01em" }}>
                  CHF {(listing.rent_price || listing.price || 0).toFixed(2)}
                </span>
                <span style={{ fontSize: 11, color: colors.muted, marginLeft: 4 }}>
                  / {listing.rent_period === "hour" ? "Std" : listing.rent_period === "day" ? "Tag" : listing.rent_period === "week" ? "Woche" : "Monat"}
                </span>
              </>
            ) : isFree ? (
              <span style={{ fontSize: 18, fontWeight: 800, fontFamily: fonts.head, color: colors.nature, letterSpacing: "-0.01em" }}>Gratis</span>
            ) : (
              <PriceDisplay listing={listing} size="md" />
            )}
          </div>

          {/* Spacer to push location to bottom */}
          <div style={{ flex: 1 }} />

          {/* Location + Restlaufzeit */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginTop: 8,
            fontSize: 12, fontFamily: fonts.body, color: colors.muted,
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, minWidth: 0 }}>
              <MapPin size={11} style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing.city || "–"}</span>
            </span>
            <span style={{ marginLeft: "auto", flexShrink: 0 }}>
              <Countdown endDate={endDate} endedLabel={isAuction ? "Beendet" : "Abgelaufen"} />
            </span>
          </div>

          {/* Seller */}
          {listing.seller && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
              <span style={{ fontSize: 11, color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {listing.seller.account_type === "business" && listing.seller.company_name
                  ? listing.seller.company_name
                  : listing.seller.display_name}
              </span>
              <AccountBadge accountType={listing.seller.account_type} />
              <VerifiedSellerBadge profile={listing.seller} size="sm" label={false} />
              {listing.seller.avg_rating > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 2, marginLeft: "auto", fontSize: 11, color: colors.muted }}>
                  <Star size={10} fill={colors.yellow} color={colors.yellow} />
                  {parseFloat(listing.seller.avg_rating).toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
