"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Star, Clock, Flame } from "lucide-react";
import { colors, fonts } from "@/lib/theme";
import { getCoverUrl, conditionLabel } from "@/lib/formatters";
import { PriceDisplay } from "./PriceDisplay";
import { FavoriteButton } from "./FavoriteButton";
import { AccountBadge } from "./AccountBadge";
import { VerifiedSellerBadge } from "./VerifiedSellerBadge";
import { useFavorite } from "@/hooks/useFavorite";

// ── Klar-Look: flache Karte ohne Rahmen, grosses 3:4-Bild, ruhige Meta ──
const INK = "#191615";

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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: urgent ? 700 : 500, color: urgent ? "#c62828" : colors.muted, whiteSpace: "nowrap" }}>
      <Clock size={10} /> {text}
    </span>
  );
}

// Stempeltext fuer nicht mehr verfuegbare Inserate; null = kein Stempel.
// Bewusst konservativ: pending_review/paused u.ae. werden NICHT gestempelt.
export function listingInactiveLabel(listing) {
  if (!listing) return null;
  if (listing.status === "sold") return "Verkauft";
  if (listing.status === "expired") return "Beendet";
  if (listing.listing_type === "auction" && listing.auction_end
      && new Date(listing.auction_end).getTime() < Date.now()) return "Beendet";
  return null;
}

// Typ-Kennzeichnung: farbige Pille pro Inserattyp (BEEDARO-Typfarben)
const TYP_CHIP = {
  sell: { label: "Festpreis", bg: "#F4C03F", color: INK },
  auction: { label: "Auktion", bg: "#94B9C9", color: INK },
  rent: { label: "Miete", bg: "#8B6DB0", color: "#fff" },
  free: { label: "Gratis", bg: "#5B8C5A", color: "#fff" },
  service: { label: "Service", bg: "#E67E22", color: "#fff" },
};
const PERIOD_LABEL = { hour: "Std", day: "Tag", week: "Woche", month: "Monat" };

// Bild-Chip: weisse Pille auf dem Foto (Typ, Neu, Featured)
const chip = (bg = "#FFFFFF", color = INK) => ({
  fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
  background: bg, color, whiteSpace: "nowrap", lineHeight: 1.5,
  boxShadow: "0 1px 4px rgba(25,22,21,.12)",
});

export function ListingCard(props) {
  // statusOverlay: optionaler Status-Override. Ohne Prop erkennt die Karte
  // selbst, ob das Inserat verkauft/beendet ist: dann gedimmt + entsaettigt,
  // und der Status ersetzt unten den Countdown.
  const { listing, userId = null, boost = null, onUnfavorite = null, statusOverlay: statusOverlayProp = null } = props;
  const statusOverlay = statusOverlayProp ?? listingInactiveLabel(listing);
  const [hover, setHover] = useState(false);
  const { isFav, toggleFav } = useFavorite(userId, listing.id);
  const cover = getCoverUrl(listing);

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
  const boosts = boost || listing.boost || [];
  const hasSpotlight = boosts.includes("spotlight") || boosts.includes("mega_boost");
  const hasFeatured = boosts.includes("golden_stamp") || boosts.includes("mega_boost");
  const endDate = isAuction ? (listing.auction_end || listing.expires_at) : listing.expires_at;
  // "Endet bald"-Chip: laeuft in weniger als 24h ab (und ist noch aktiv)
  const msLeft = endDate ? new Date(endDate).getTime() - Date.now() : null;
  const endetBald = !statusOverlay && msLeft !== null && msLeft > 0 && msLeft < 86400000;
  // "Hot"-Chip: gemessen an Aufrufen PRO TAG online, damit alte Inserate
  // nicht allein durchs Altern hot werden. Schwellen sind fuers Beta-Publikum
  // niedrig angesetzt — beim oeffentlichen Launch auf ~20 total / 8 pro Tag erhoehen.
  const HOT_MIN_VIEWS = 15, HOT_VIEWS_PRO_TAG = 2;
  const tageOnline = createdAt ? Math.max(1, (Date.now() - createdAt.getTime()) / 86400000) : null;
  const istHot = !statusOverlay && tageOnline !== null
    && (listing.view_count || 0) >= HOT_MIN_VIEWS
    && (listing.view_count / tageOnline) >= HOT_VIEWS_PRO_TAG;

  return (
    <Link
      href={`/listing/${listing.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%", minWidth: 0, opacity: statusOverlay ? 0.75 : 1 }}
    >
      {/* Bild: Querformat 4:3 wie fotografiert (Ricardo-Mass), weich gerundet */}
      <div style={{ position: "relative", aspectRatio: "4/3", background: colors.cream, overflow: "hidden", borderRadius: 12 }}>
        {cover
          ? <img src={cover} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.03)" : "scale(1)", transition: "transform .3s ease", filter: statusOverlay ? "grayscale(1)" : "none" }} loading="lazy" />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={36} color="#ccc" /></div>
        }

        {/* Oben links: farbiger Typ-Chip + Hinweise */}
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
          {TYP_CHIP[listing.listing_type] && (
            <span style={chip(TYP_CHIP[listing.listing_type].bg, TYP_CHIP[listing.listing_type].color)}>
              {TYP_CHIP[listing.listing_type].label}
            </span>
          )}
          {hasFeatured && <span style={{ ...chip("#E8A820", "#fff") }}><Star size={9} fill="#fff" style={{ verticalAlign: "-1px", marginRight: 3 }} />Featured</span>}
          {hasSpotlight && !hasFeatured && <span style={chip()}>Gesponsert</span>}
          {isNew && !hasFeatured && !hasSpotlight && <span style={chip()}>Neu</span>}
        </div>

        {/* Oben rechts: Merken-Herz */}
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <FavoriteButton isFav={isFav} onToggle={handleToggleFav} />
        </div>

        {/* Unten links: Endet bald (unter 24h Restzeit) und/oder Hot (viele Aufrufe/Tag) */}
        {(endetBald || istHot) && (
          <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
            {endetBald && <span style={chip("#C62828", "#fff")}>Endet bald</span>}
            {istHot && (
              <span style={{ ...chip("#E8590C", "#fff"), display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Flame size={10} fill="#fff" /> Hot
              </span>
            )}
          </div>
        )}
      </div>

      {/* Text unterm Bild, ohne Kartenrahmen */}
      <div style={{ padding: "8px 2px 0", flex: 1, display: "flex", flexDirection: "column" }}>
        <p style={{
          fontSize: 13.5, fontWeight: 600, fontFamily: fonts.body,
          lineHeight: 1.35, margin: 0, color: INK,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", minHeight: "2.7em",
        }}>
          {listing.title}
        </p>

        {/* Preis: feste Zeilenplaetze, damit alle Karten buendig sind */}
        <div style={{ marginTop: 4, minHeight: 22, display: "flex", alignItems: "baseline", overflow: "hidden", whiteSpace: "nowrap" }}>
          {isAuction ? (
            <span style={{ fontSize: 15.5, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums" }}>
              CHF {(listing.price || listing.start_price || 0).toFixed(2)}
            </span>
          ) : isRent || isService ? (
            <span style={{ fontSize: 15.5, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums" }}>
              CHF {(listing.rent_price || listing.price || 0).toFixed(2)}
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.muted }}> / {PERIOD_LABEL[listing.rent_period] || "Tag"}</span>
            </span>
          ) : isFree ? (
            <span style={{ fontSize: 15.5, fontWeight: 800, color: colors.nature }}>Gratis</span>
          ) : (
            <PriceDisplay listing={listing} size="md" />
          )}
        </div>
        {/* Sekundaerzeile: Sofortpreis (Auktion) oder leerer Platzhalter */}
        <div style={{ minHeight: 17, fontSize: 12, fontWeight: 600, color: colors.muted, fontVariantNumeric: "tabular-nums", overflow: "hidden", whiteSpace: "nowrap" }}>
          {isAuction && listing.buy_now_price > 0 ? `Sofort CHF ${listing.buy_now_price.toFixed(2)}` : ""}
        </div>

        {/* Meta: Gebote · Zustand · Ort, rechts Countdown/Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, fontSize: 12, color: colors.muted, whiteSpace: "nowrap", overflow: "hidden", minHeight: 18 }}>
          {isAuction && bidCount > 0 && (
            <>
              <span style={{ whiteSpace: "nowrap" }}>{bidCount} {bidCount === 1 ? "Gebot" : "Gebote"}</span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: colors.mutedLt, flexShrink: 0 }} />
            </>
          )}
          {listing.condition && (
            <>
              <span style={{ whiteSpace: "nowrap" }}>{conditionLabel(listing.condition)}</span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: colors.mutedLt, flexShrink: 0 }} />
            </>
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: "1 1 auto" }}>{listing.city || "Schweiz"}</span>
        </div>

        {/* Restzeit/Status: eigene Zeile, immer rechtsbuendig */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2, minHeight: 16 }}>
          {statusOverlay ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "#c62828", whiteSpace: "nowrap" }}>
              <Clock size={10} /> {statusOverlay}
            </span>
          ) : (
            <Countdown endDate={endDate} endedLabel={isAuction ? "Beendet" : "Abgelaufen"} />
          )}
        </div>

        {/* Verkäufer: dezent, klickbar (stoppt den Karten-Link) */}
        {listing.seller && (
          <div
            onClick={(e) => {
              if (!listing.user_id) return;
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/user/${listing.user_id}`;
            }}
            title="Verkäuferprofil ansehen"
            style={{ display: "flex", alignItems: "center", gap: 5, marginTop: "auto", paddingTop: 6, cursor: listing.user_id ? "pointer" : "default", minWidth: 0 }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {listing.seller.account_type === "business" && listing.seller.company_name
                ? listing.seller.company_name
                : listing.seller.display_name}
            </span>
            <AccountBadge accountType={listing.seller.account_type} />
            <VerifiedSellerBadge profile={listing.seller} size="sm" label={false} />
            {listing.seller.avg_rating > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 2, marginLeft: "auto", fontSize: 12, color: colors.muted }}>
                <Star size={11} fill={colors.yellow} color={colors.yellow} />
                {parseFloat(listing.seller.avg_rating).toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
