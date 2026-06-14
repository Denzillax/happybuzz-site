"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Package, Star, Gavel, Clock, Home, Gift, Flame, ShoppingBag, Wrench } from "lucide-react";
import { colors, fonts, radius, shadows } from "@/lib/theme";
import { getCoverUrl } from "@/lib/formatters";
import { PriceDisplay } from "./PriceDisplay";
import { FavoriteButton } from "./FavoriteButton";
import { AccountBadge } from "./AccountBadge";
import { useFavorite } from "@/hooks/useFavorite";

function AuctionCountdown({ endDate }) {
  const [text, setText] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    if (!endDate) return;
    const tick = () => {
      const now = new Date();
      const end = new Date(endDate);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) { setText("Beendet"); setUrgent(true); return; }
      const h24 = 24 * 60 * 60 * 1000;
      if (diff > h24) {
        setText(end.toLocaleDateString("de-CH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }));
        setUrgent(false);
      } else {
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        if (hrs > 0) setText(`${hrs}h ${mins}m`);
        else setText(`${mins}m ${secs}s`);
        setUrgent(diff < 3600000);
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [endDate]);

  if (!text) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: urgent ? "#c62828" : colors.muted }}>
      <Clock size={10} /> {text}
    </span>
  );
}

// Restlaufzeit (Laufzeit/expires_at) für Nicht-Auktionen — Tage, urgent < 3 Tage.
function formatRemaining(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { text: "Abgelaufen", urgent: true };
  const days = Math.floor(diff / 86400000);
  if (days >= 1) return { text: `noch ${days} ${days === 1 ? "Tag" : "Tage"}`, urgent: days <= 3 };
  const hrs = Math.max(1, Math.floor(diff / 3600000));
  return { text: `noch ${hrs} Std`, urgent: true };
}

export function ListingCard({ listing, userId, boost, onUnfavorite }) {
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
  const remaining = !isAuction ? formatRemaining(listing.expires_at) : null;

  return (
    <Link href={`/listing/${listing.id}`} style={{ textDecoration: "none", color: "inherit", height: "100%" }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: colors.surface, borderRadius: radius.md,
          border: hasSpotlight ? `2px solid ${colors.yellow}` : `1px solid ${colors.border}`,
          overflow: "hidden", transition: "box-shadow .2s, transform .2s",
          transform: hover ? "translateY(-2px)" : "none",
          boxShadow: hasSpotlight ? `0 0 0 3px ${colors.yellow}22` : (hover ? shadows.card : "none"),
          display: "flex", flexDirection: "column", height: "100%",
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", aspectRatio: "4/3", background: colors.warm, overflow: "hidden" }}>
          {cover
            ? <img src={cover} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={40} color="#ccc" /></div>
          }

          {/* Top-left: colored badges */}
          <div style={{ position: "absolute", top: 8, left: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {hasFeatured && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: "#E8A820", color: "#fff", textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 2 }}>
                <Star size={9} fill="#fff" /> Featured
              </span>
            )}
            {hasSpotlight && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: colors.yellow, color: colors.dark, textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 2 }}>
                <Star size={9} /> Gesponsert
              </span>
            )}
            {isNew && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: colors.yellow, color: colors.dark, textTransform: "uppercase", letterSpacing: ".04em" }}>Neu</span>
            )}
            {isPopular && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: "#FF6B35", color: "#fff", textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 2 }}>
                <Flame size={9} /> Beliebt
              </span>
            )}
            {endingSoon && !isPopular && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: "#c62828", color: "#fff", textTransform: "uppercase", letterSpacing: ".04em" }}>Endet bald</span>
            )}
          </div>

          {/* Top-right: colored type badge */}
          <div style={{ position: "absolute", top: 8, right: 8 }}>
            {isAuction && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: "#94B9C9", color: "#fff", display: "flex", alignItems: "center", gap: 3 }}>
                <Gavel size={10} /> Auktion
              </span>
            )}
            {isRent && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: "#8B6DB0", color: "#fff", display: "flex", alignItems: "center", gap: 3 }}>
                <Home size={10} /> Miete
              </span>
            )}
            {isFree && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: "#5B8C5A", color: "#fff", display: "flex", alignItems: "center", gap: 3 }}>
                <Gift size={10} /> Gratis
              </span>
            )}
            {isService && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: "#E67E22", color: "#fff", display: "flex", alignItems: "center", gap: 3 }}>
                <Wrench size={10} /> Service
              </span>
            )}
            {!isAuction && !isRent && !isFree && !isService && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: colors.yellow, color: colors.dark, display: "flex", alignItems: "center", gap: 3 }}>
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
        <div style={{ padding: "10px 14px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
          <p style={{
            fontSize: 14, fontWeight: 600, fontFamily: fonts.body,
            lineHeight: 1.35, margin: "0 0 4px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            color: colors.dark,
          }}>
            {listing.title}
          </p>

          {/* Price + Auction info */}
          <div style={{ marginTop: 2 }}>
            {isAuction ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 17, fontWeight: 900, fontFamily: fonts.head, color: colors.dark }}>
                    CHF {(listing.price || listing.start_price || 0).toFixed(2)}
                  </span>
                  {bidCount > 0 && <span style={{ fontSize: 11, color: colors.muted }}>{bidCount} {bidCount === 1 ? "Gebot" : "Gebote"}</span>}
                </div>
                {listing.buy_now_price > 0 && (
                  <div style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>
                    Sofortkauf: CHF {listing.buy_now_price.toFixed(2)}
                  </div>
                )}
                <div style={{ marginTop: 4 }}>
                  <AuctionCountdown endDate={listing.auction_end} />
                </div>
              </>
            ) : isRent ? (
              <>
                <span style={{ fontSize: 17, fontWeight: 900, fontFamily: fonts.head, color: colors.dark }}>
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
                <span style={{ fontSize: 17, fontWeight: 900, fontFamily: fonts.head, color: colors.dark }}>
                  CHF {(listing.rent_price || listing.price || 0).toFixed(2)}
                </span>
                <span style={{ fontSize: 11, color: colors.muted, marginLeft: 4 }}>
                  / {listing.rent_period === "hour" ? "Std" : listing.rent_period === "day" ? "Tag" : listing.rent_period === "week" ? "Woche" : "Monat"}
                </span>
              </>
            ) : isFree ? (
              <span style={{ fontSize: 17, fontWeight: 900, fontFamily: fonts.head, color: "#5B8C5A" }}>Gratis</span>
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
            {remaining && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginLeft: "auto", whiteSpace: "nowrap", color: remaining.urgent ? "#c62828" : colors.muted, fontWeight: remaining.urgent ? 700 : 400 }}>
                <Clock size={11} /> {remaining.text}
              </span>
            )}
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
