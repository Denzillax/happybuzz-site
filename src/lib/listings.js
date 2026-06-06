// ═══════════════════════════════════════════════════════════════
// BEEDARO API — Barrel Export
// Alle Domain-Module werden hier re-exportiert.
// Bestehende Imports von "@/lib/listings" funktionieren weiterhin.
// ═══════════════════════════════════════════════════════════════

export * from "./api/listings";
export * from "./api/auctions";
export * from "./api/purchases";
export * from "./api/bookings";
export * from "./api/messages";
export * from "./api/favorites";
export * from "./api/profiles";
export * from "./api/categories";
export * from "./api/community";
export * from "./api/returns";

// Re-export constants (waren vorher dupliziert in listings.js)
export { FEE_TIERS, BEE_IMPACT_RATE } from "./constants";
