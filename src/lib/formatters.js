// ═══════════════════════════════════════════════════════════════
// BEEDARO Formatters — Preise, Bilder, Zeit, Labels
// ═══════════════════════════════════════════════════════════════

import { CONDITION_LABELS, LISTING_TYPE_LABELS, RENT_PERIOD_SHORT } from "./constants";

// ─── Preis ───────────────────────────────────────────────────
// Betrag mit Tausendertrennung und zwei Nachkommastellen, ohne Waehrung:
// 300000 -> "300'000.00" (Denis 17.09.: Stanzmaschine zeigte 300000.00)
export function chf(amount) {
  return (Number(amount) || 0).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// "Preis gesenkt" (19.09.2026): price_before pflegt ein DB-Trigger (Migration
// 20260919_preis_gesenkt.sql), nur bei Festpreis. Gezeigt wird ab 5 % Senkung,
// darunter wäre das Rauschen. Rückgabe: { alt, prozent } oder null.
export function preisGesenkt(listing) {
  if (!listing || listing.listing_type !== "sell") return null;
  const alt = parseFloat(listing.price_before), neu = parseFloat(listing.price);
  if (!(alt > 0) || !(neu > 0) || neu >= alt) return null;
  const prozent = Math.round((1 - neu / alt) * 100);
  return prozent >= 5 ? { alt, prozent } : null;
}

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

// ─── Lieferart ───────────────────────────────────────────────
// Schluessel -> deutsches Label. Aeltere Kaeufe enthalten teils schon fertige
// Labels ("Paket A-Post") — die gehen unveraendert durch.
const SHIPPING_METHOD_LABELS = {
  pickup: "Abholung",
  paket: "Paket",
  brief: "Brief",
  sperrgut: "Sperrgut",
  kurier: "Kurier",
  spediteur: "Spediteur",
  einschreiben: "Einschreiben",
  lieferung_verkaeufer: "Lieferung durch Verkäufer",
};
export function shippingMethodLabel(value) {
  if (!value) return "";
  return SHIPPING_METHOD_LABELS[value] || value;
}

// ─── Lieferfrist (listings.handling_days) ────────────────────
export const HANDLING_OPTIONS = [
  { value: 2, label: "1–2 Tagen" },
  { value: 5, label: "3–5 Tagen" },
  { value: 7, label: "1 Woche" },
  { value: 14, label: "2 Wochen" },
];
export function handlingLabel(days) {
  return HANDLING_OPTIONS.find((o) => o.value === Number(days))?.label || "1–2 Tagen";
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

// Lieferung einer Bestellung: Abholung oder Versand, und was der Versand kostet.
// Einzige Quelle für Bestellseite, Rechnung und QR-Betrag (19.09.2026). Vorher las jede Stelle
// das Inserat direkt, mit zwei Fehlern:
//  - listings.pickup_only heisst so, bedeutet aber "Abholung möglich". Inserate mit Versand UND
//    Abholung standen auf der Rechnung als "Abholung".
//  - Die Versandkosten des Inserats kamen immer ins Total, auch wenn abgeholt wird (Mieten).
// Zuerst zählt die Wahl in der Bestellung, erst dann das Inserat.
export function lieferung(order, listing) {
  const l = listing || order?.listing || {};
  const bezahlt = parseFloat(order?.shipping_cost || 0);
  const abholung = order?.shipping_method === "pickup" || (!(bezahlt > 0) && !l.shipping_available);
  if (abholung) return { abholung: true, kosten: 0 };
  if (bezahlt > 0) return { abholung: false, kosten: bezahlt };
  return { abholung: false, kosten: l.free_shipping ? 0 : parseFloat(l.shipping_cost || 0) };
}
