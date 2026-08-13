// ═══════════════════════════════════════════════════════════════
// BEEDARO Fees — Zentrale Gebühren- & Referenz-Logik
// Alle Seiten importieren von hier, keine Inline-Berechnungen!
// ═══════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabase/supabase";
import { BEE_IMPACT_RATE, DEFAULT_FEE_PERCENT, DEFAULT_FEE_TIER } from "@/lib/constants";

// ─── Konstanten ──────────────────────────────────────────────
// Gebührensätze und Bee-Impact-Anteil leben in constants.js (eine Quelle der
// Wahrheit); hier nur weiterreichen, damit bestehende Importe gültig bleiben.
export { BEE_IMPACT_RATE, DEFAULT_FEE_PERCENT, DEFAULT_FEE_TIER };
export const PAYMENT_DAYS = 30;

// ─── Fee-Berechnung ──────────────────────────────────────────
export function calcFee(price, feePercent = DEFAULT_FEE_PERCENT) {
  return parseFloat(price || 0) * (feePercent || DEFAULT_FEE_PERCENT) / 100;
}

export function calcBeeImpact(feeAmount) {
  return parseFloat(feeAmount || 0) * BEE_IMPACT_RATE;
}

export function calcFeeFromPrice(price, feePercent = DEFAULT_FEE_PERCENT) {
  const fee = calcFee(price, feePercent);
  return { fee, beeImpact: calcBeeImpact(fee) };
}

// ─── Referenzen ──────────────────────────────────────────────
export function makeBeeRef(purchaseId) {
  return `BEE-${(purchaseId || "").substring(0, 8).toUpperCase()}`;
}

export function makeArtRef(listingId) {
  return `ART-${(listingId || "").substring(0, 8).toUpperCase()}`;
}

// "ART-1A2B3C4D" oder nackte "1a2b3c4d" (4–8 Hex) → Hex-Präfix (lowercase), sonst null.
// Verhindert Hijack normaler Suchen: verlangt "ART-"-Präfix ODER exakt 8 Hex.
export function parseArtRef(q) {
  const m = (q || "").trim().toLowerCase().match(/^art-?([0-9a-f]{4,8})$|^([0-9a-f]{8})$/);
  return m ? (m[1] || m[2]) : null;
}

// Hex-Präfix (4–8) → UUID-Bereich, der exakt alle IDs mit diesem Präfix umfasst.
export function artIdRange(prefix) {
  if (!prefix) return null;
  return {
    lo: `${prefix.padEnd(8, "0")}-0000-0000-0000-000000000000`,
    hi: `${prefix.padEnd(8, "f")}-ffff-ffff-ffff-ffffffffffff`,
  };
}

// Treffer im bereits geladenen Bestand (Teilstring der ART-Nr).
export function artRefMatches(id, q) {
  const qq = (q || "").toLowerCase().trim();
  return !!qq && makeArtRef(id).toLowerCase().includes(qq);
}

export function makeFeeRef(yearOrInvoiceRef, month) {
  if (month !== undefined) return `FEE-${yearOrInvoiceRef}-${String(month).padStart(2, "0")}`;
  return `FEE-${(yearOrInvoiceRef || "").substring(0, 8).toUpperCase()}`;
}

// ─── Fälligkeitsdatum ────────────────────────────────────────
export function calcDueDate(purchaseDate) {
  const d = new Date(purchaseDate);
  d.setDate(d.getDate() + PAYMENT_DAYS);
  return d;
}

// ─── Fee-Daten aus DB laden (statt inline berechnen) ─────────
export async function getFeeForPurchase(purchaseId) {
  const { data } = await supabase
    .from("fee_ledger")
    .select("fee_amount, bee_impact, fee_percent")
    .eq("purchase_id", purchaseId)
    .maybeSingle();
  return data;
}

export async function getFeesForSeller(sellerId) {
  const { data } = await supabase
    .from("fee_ledger")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getInvoicesForSeller(sellerId) {
  const { data } = await supabase
    .from("fee_invoices")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  return data || [];
}

// ─── Status-Konfiguration ────────────────────────────────────
export const FEE_STATUS = {
  open:            { color: "#E65100", bg: "#FFF3E0", label: "Offen" },
  pending_payment: { color: "#1565C0", bg: "#E3F2FD", label: "Gemeldet" },
  paid:            { color: "#2E7D32", bg: "#E8F5E9", label: "Bezahlt" },
  overdue:         { color: "#c62828", bg: "#FFEBEE", label: "Überfällig" },
};

export const LISTING_STATUS = {
  active:        { color: "#2E7D32", bg: "#E8F5E9", label: "Aktiv" },
  draft:         { color: "#666",    bg: "#f5f5f5", label: "Entwurf" },
  paused:        { color: "#E65100", bg: "#FFF3E0", label: "Pausiert" },
  sold:          { color: "#1565C0", bg: "#E3F2FD", label: "Verkauft" },
  rented:        { color: "#1565C0", bg: "#E3F2FD", label: "Vermietet" },
  inactive:      { color: "#666",    bg: "#f5f5f5", label: "Inaktiv" },
  pending_pause: { color: "#c62828", bg: "#FFEBEE", label: "Wird pausiert" },
};

export const ORDER_STATUS = {
  confirmed:  { color: "#2E7D32", bg: "#E8F5E9", label: "Bestätigt" },
  cancelled:  { color: "#c62828", bg: "#FFEBEE", label: "Storniert" },
  completed:  { color: "#1565C0", bg: "#E3F2FD", label: "Abgeschlossen" },
  disputed:   { color: "#E65100", bg: "#FFF3E0", label: "Streitfall" },
  refunded:   { color: "#666",    bg: "#f5f5f5", label: "Erstattet" },
};

// ─── BEEDARO Zahlungsinfos (für QR-Rechnungen) ───────────────
export const BEEDARO_PAYMENT = {
  name: "BEEDARO",
  street: "Gemeindehausstrasse 11B",
  plz: "6010",
  city: "Kriens",
  country: "CH",
  iban: "CH12 3456 7890 1234 5678 9",
  ibanClean: "CH1234567890123456789",
  email: "noreply@beedaro.ch",
};
