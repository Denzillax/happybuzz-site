// ═══════════════════════════════════════════════════════════════
// BEEDARO Formatters — Preise, Bilder, Zeit, Labels
// ═══════════════════════════════════════════════════════════════

import { CONDITION_LABELS, LISTING_TYPE_LABELS, RENT_PERIOD_SHORT } from "./constants";

// ─── Preis ───────────────────────────────────────────────────
export function formatPrice(amount, currency = "CHF") {
  if (amount == null || amount === 0) return "Gratis";
  return `${currency} ${Number(amount).toLocaleString("de-CH", { minimumFractionDigits: amount % 1 ? 2 : 0 })}`;
}

// ─── Listing-Preis mit Kontext ───────────────────────────────
export function getDisplayPrice(listing) {
  if (listing.listing_type === "free") return { text: "GRATIS", prefix: "", suffix: "" };
  if (listing.listing_type === "auction") return { text: formatPrice(listing.start_price), prefix: "ab ", suffix: "" };
  if (listing.listing_type === "rent") return { text: formatPrice(listing.rent_price), prefix: "", suffix: `/${RENT_PERIOD_SHORT[listing.rent_period] || "Tag"}` };
  return { text: formatPrice(listing.price), prefix: "", suffix: "" };
}

// ─── Cover-Bild URL ──────────────────────────────────────────
// listing_images: url (NICHT image_url), sort_order (NICHT position)
export function getCoverUrl(listing) {
  if (listing.cover_image) return listing.cover_image;
  const imgs = listing.listing_images || listing.images || [];
  const sorted = [...imgs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return sorted[0]?.url || null;
}

// ─── Sortierte Bilder ────────────────────────────────────────
export function getSortedImages(listing) {
  const imgs = listing.listing_images || listing.images || [];
  return [...imgs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

// ─── Zeit ────────────────────────────────────────────────────
export function timeAgo(dateStr) {
  if (!dateStr) return "–";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Heute";
  if (days === 1) return "Gestern";
  if (days < 7) return `Vor ${days} Tagen`;
  if (days < 30) return `Vor ${Math.floor(days / 7)} Wo.`;
  return new Date(dateStr).toLocaleDateString("de-CH");
}

export function memberSince(dateStr) {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("de-CH", { month: "long", year: "numeric" });
}

// ─── Labels ──────────────────────────────────────────────────
export function conditionLabel(value) { return CONDITION_LABELS[value] || value; }
export function listingTypeLabel(value) { return LISTING_TYPE_LABELS[value] || value; }

// ─── Kurzformate (ersetzen alle inline fmt/fmtDate Definitionen) ──
// Verwende diese statt überall `const fmt = ...` neu zu definieren!
export function fmtCHF(amount) {
  return parseFloat(amount || 0).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(dateStr) {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateLong(dateStr) {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" });
}

export function fmtDateTime(dateStr) {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Formeller Name für Rechnungen (first_name + last_name, Fallback display_name)
export function fullName(profile) {
  if (!profile) return "—";
  const fn = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return fn || profile.display_name || "—";
}

// ─── Zahlungsarten ───────────────────────────────────────────
export function getPaymentMethods(listing) {
  return [
    listing.pay_twint && "TWINT",
    listing.pay_bank && "Banküberweisung",
    listing.pay_cash && "Barzahlung",
  ].filter(Boolean);
}

export const fmtPrice = fmtCHF;
