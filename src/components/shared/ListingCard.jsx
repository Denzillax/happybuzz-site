"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Star, Clock, Flame, ScanSearch } from "lucide-react";
import { colors, fonts } from "@/lib/theme";
import { getCoverUrl, chf } from "@/lib/formatters";
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
  const [ms, setMs] = useState(null); // letzte Stunde pulsiert, letzte Minute tickt rot

  useEffect(() => {
    if (!endDate) { setText(""); return; }
    let iv;
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      setMs(diff);
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
      <Clock size={10} /> <span key={ms !== null && ms > 0 && ms < 60000 ? text : "ruhig"} className={ms !== null && ms > 0 ? (ms < 60000 ? "bd-fx-tick" : ms < 3600000 ? "bd-fx-urgent" : undefined) : undefined}>{text}</span>
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

  const router = useRouter();
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
      className="bd-fx-reveal"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%", minWidth: 0, opacity: statusOverlay ? 0.75 : 1 }}
    >
      {/* Bild: Quadrat 1:1 (Denis, 16.09.): fairer Mittelweg fuer gemischte Hoch- und Querfotos, jedes Foto verliert nur 25% */}
      <div style={{ position: "relative", aspectRatio: "1/1", background: colors.cream, overflow: "hidden", borderRadius: 12 }}>
        {cover
          ? <img src={cover} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.06)" : "scale(1)", transition: "transform .6s cubic-bezier(.2,.7,.2,1)", filter: statusOverlay ? "grayscale(1)" : "none" }} loading="lazy" />
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

        {/* Unten rechts: Sofortkauf-Chip (Denis 16.09.: der Textblock bleibt so bei
            allen Karten gleich, und der Preis ist nirgends abgeschnitten) */}
        {isAuction && listing.buy_now_price > 0 && !statusOverlay && (
          <span className="sofort-chip" style={{ position: "absolute", bottom: 8, right: 8, fontSize: 11, fontWeight: 700, color: INK, background: "rgba(255,255,255,.92)", borderRadius: 999, padding: "4px 9px", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", boxShadow: "0 1px 4px rgba(25,22,21,.15)" }}>
            {/* Ganze Beträge ohne .00, sonst wird der Chip am Handy zu breit (Denis 16.09.) */}
            Sofort CHF {Number.isInteger(listing.buy_now_price) ? listing.buy_now_price.toLocaleString("de-CH") : chf(listing.buy_now_price)}
          </span>
        )}
        {/* Unten links: Bildersuche-Lupe (oeffnet das Inserat und startet die
            KI-Bildersuche), daneben Endet bald / Hot */}
        <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
          {!statusOverlay && (
            <button type="button" aria-label="Ähnliche per Bild finden" title="Ähnliche per Bild finden"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/listing/${listing.id}?bild=1`); }}
              style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.92)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(25,22,21,.18)", flexShrink: 0 }}>
              <ScanSearch size={15} color="#0B5E5C" />
            </button>
          )}
          {(endetBald || istHot) && (<>
            {endetBald && <span style={chip("#C62828", "#fff")}>Endet bald</span>}
            {istHot && (
              <span style={{ ...chip("#E8590C", "#fff"), display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Flame size={10} fill="#fff" /> Hot
              </span>
            )}
          </>)}
        </div>
      </div>

      {/* Textblock "Zwei Bloecke" (Denis, 15.09.): oben Titel + Preis eng
          beieinander, unten das Kleingedruckte als eigener Block hinter einer
          feinen Linie, immer am Kartenboden (marginTop auto). */}
      <div style={{ padding: "8px 2px 0", flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <p style={{
          fontSize: 14.5, fontWeight: 600, fontFamily: fonts.body,
          lineHeight: 1.35, margin: 0, color: INK,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", minHeight: "2.7em",
        }}>
          {listing.title}
        </p>

        {/* Preis als Anker, Gebote grau daneben */}
        <div style={{ marginTop: 4, minHeight: 22, display: "flex", alignItems: "baseline", gap: 6, overflow: "hidden", whiteSpace: "nowrap" }}>
          {isAuction ? (
            <>
              <span style={{ fontSize: 17, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums" }}>
                CHF {chf(listing.price || listing.start_price || 0)}
              </span>
              <span style={{ fontSize: 12, color: colors.muted }}>({bidCount} {bidCount === 1 ? "Gebot" : "Gebote"})</span>
            </>
          ) : isRent || isService ? (
            <span style={{ fontSize: 17, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums" }}>
              CHF {chf(listing.rent_price || listing.price || 0)}
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.muted }}> / {PERIOD_LABEL[listing.rent_period] || "Tag"}</span>
            </span>
          ) : isFree ? (
            <span style={{ fontSize: 17, fontWeight: 800, color: colors.nature }}>Gratis</span>
          ) : (
            <>
              {/* Festpreis gleich gesetzt wie der Auktionspreis (Denis 16.09.: die
                  Kopfschrift wirkte dicker), daneben grau "(Festpreis)" wie "(n Gebote)" */}
              <span style={{ fontSize: 17, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums" }}>
                CHF {chf(listing.price || 0)}
              </span>
              <span style={{ fontSize: 12, color: colors.muted }}>({listing.is_negotiable ? "Verhandelbar" : "Festpreis"})</span>
            </>
          )}
        </div>

        {/* Kleingedrucktes: eigener Block mit Luft und Linie, am Kartenboden */}
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <div style={{ borderTop: "1px solid #EEEBE5", paddingTop: 8, fontSize: 12, lineHeight: 1.5, color: colors.muted }}>
            {/* Zeile 1: nur der Ort (Denis 16.09.: der Zustand "Gut" davor ist weg,
                er steht im Inserat selbst) */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", overflow: "hidden" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: "1 1 auto" }}>{listing.city || "Schweiz"}</span>
            </div>
            {/* Zeile 2: Laufzeit links, bei Auktionen Sofortpreis rechts */}
            {/* Zeile 2: Laufzeit */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", overflow: "hidden", marginTop: 1 }}>
              {statusOverlay ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "#c62828", whiteSpace: "nowrap" }}>
                  <Clock size={10} /> {statusOverlay}
                </span>
              ) : (
                <Countdown endDate={endDate} endedLabel={isAuction ? "Beendet" : "Abgelaufen"} />
              )}
            </div>
            {/* Zeile 3: Verkaeufer mit Stern */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, marginTop: 1, whiteSpace: "nowrap" }}>
              {listing.seller && (
                <span
                  onClick={(e) => {
                    if (!listing.user_id) return;
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = "/user/" + listing.user_id;
                  }}
                  title="Verkäuferprofil ansehen"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, minWidth: 0, cursor: listing.user_id ? "pointer" : "default" }}
                >
                  <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {listing.seller.account_type === "business" && listing.seller.company_name
                      ? listing.seller.company_name
                      : listing.seller.display_name}
                  </span>
                  <AccountBadge accountType={listing.seller.account_type} />
                  <VerifiedSellerBadge profile={listing.seller} size="sm" label={false} />
                  {listing.seller.avg_rating > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                      <Star size={11} fill={colors.yellow} color={colors.yellow} />
                      {parseFloat(listing.seller.avg_rating).toFixed(1)}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
