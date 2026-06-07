// ═══════════════════════════════════════════════════════════════
// BEEDARO Constants — Enums, Labels, Config
// Alle Werte die im Code UND in der DB vorkommen.
// ═══════════════════════════════════════════════════════════════

// ─── Listing Types ───────────────────────────────────────────
// DB ENUM listing_type: sell, auction, rent, free
export const LISTING_TYPES = [
  { value: "sell",    label: "Festpreis",    icon: null },
  { value: "auction", label: "Auktion",      icon: null },
  { value: "rent",    label: "Mieten",       icon: null },
  { value: "service", label: "Service",      icon: null },
  { value: "free",    label: "Gratis",       icon: null },
];
export const LISTING_TYPE_LABELS = Object.fromEntries(LISTING_TYPES.map(t => [t.value, t.label]));

// ─── Listing Status ──────────────────────────────────────────
// DB ENUM listing_status: draft, active, paused, sold, rented, expired, deleted
export const LISTING_STATUSES = [
  { value: "draft",   label: "Entwurf",   color: "#8A8279" },
  { value: "active",  label: "Aktiv",     color: "#5B8C5A" },
  { value: "paused",  label: "Pausiert",  color: "#E5A100" },
  { value: "sold",    label: "Verkauft",  color: "#94B9C9" },
  { value: "rented",  label: "Vermietet", color: "#94B9C9" },
  { value: "expired", label: "Abgelaufen",color: "#D94444" },
  { value: "deleted", label: "Gelöscht",  color: "#D94444" },
];
export const STATUS_LABELS = Object.fromEntries(LISTING_STATUSES.map(s => [s.value, s.label]));

// ─── Condition ───────────────────────────────────────────────
// DB ENUM condition_type: new, like_new, good, fair, poor
export const CONDITIONS = [
  { value: "new",     label: "Neu",              desc: "Originalverpackt, nie benutzt" },
  { value: "like_new",label: "Wie neu",           desc: "Kaum benutzt, keine Spuren" },
  { value: "good",    label: "Gut",               desc: "Leichte Gebrauchsspuren" },
  { value: "fair",    label: "Gebrauchsspuren",   desc: "Deutlich benutzt, funktioniert" },
  { value: "poor",    label: "Defekt",            desc: "Beschädigt oder nicht funktionsfähig" },
];
export const CONDITION_LABELS = Object.fromEntries(CONDITIONS.map(c => [c.value, c.label]));

// ─── Fee Tiers ───────────────────────────────────────────────
// DB: fee_tier TEXT CHECK (fair, supporter, impact, hero)
// Bee-Impact: immer 20% der Gesamtgebühr
export const BEE_IMPACT_RATE = 0.20;

// ─── Bee-Impact Levels (Gamification) ────────────────────────
export const BEE_LEVELS = [
  { key: "starter",      label: "Bee Starter",   min: 0,   max: 10,  color: "#B5AFA8", maxListings: 5,  benefits: ["5 aktive Inserate"] },
  { key: "busy_bee",     label: "Busy Bee",      min: 10,  max: 50,  color: "#F4C03F", maxListings: 10, benefits: ["10 aktive Inserate", "Bee-Badge im Profil"] },
  { key: "hive_builder", label: "Hive Builder",  min: 50,  max: 150, color: "#E5922E", maxListings: 25, benefits: ["25 aktive Inserate", "Verified-Badge", "Inserate werden höher angezeigt"] },
  { key: "queen",        label: "Queen Bee",     min: 150, max: 500, color: "#5B8C5A", maxListings: 50, benefits: ["50 aktive Inserate", "Priority Support", "Profil-Highlight"] },
  { key: "legend",       label: "Bee Legend",    min: 500, max: Infinity, color: "#94B9C9", maxListings: -1, benefits: ["Unbegrenzte Inserate", "Early Access", "Community-Legende"] },
];

export function getBeeLevel(impactTotal) {
  const total = parseFloat(impactTotal) || 0;
  return BEE_LEVELS.find((l) => total >= l.min && total < l.max) || BEE_LEVELS[0];
}

export function getBeeLevelProgress(impactTotal) {
  const level = getBeeLevel(impactTotal);
  const total = parseFloat(impactTotal) || 0;
  if (level.max === Infinity) return 100;
  const range = level.max - level.min;
  return Math.min(100, Math.round(((total - level.min) / range) * 100));
}

export function getNextBeeLevel(impactTotal) {
  const current = getBeeLevel(impactTotal);
  const idx = BEE_LEVELS.indexOf(current);
  return idx < BEE_LEVELS.length - 1 ? BEE_LEVELS[idx + 1] : null;
}
export const FEE_TIERS = [
  { pct: 3,  tier: "fair",      dbTier: "starter",  label: "Fair",       desc: "Einstiegstarif" },
  { pct: 5,  tier: "supporter", dbTier: "basic",    label: "Supporter",  desc: "Empfohlener Beitrag" },
  { pct: 7,  tier: "impact",    dbTier: "plus",     label: "Impact",     desc: "Top-Platzierung + Badge" },
  { pct: 10, tier: "hero",      dbTier: "pro",      label: "Bee Hero",   desc: "Maximale Power" },
];

// ─── Rent Periods ────────────────────────────────────────────
// DB ENUM rent_period: hour, day, week, month
export const RENT_PERIODS = [
  { value: "hour",  label: "Stunde", short: "Std" },
  { value: "day",   label: "Tag",    short: "Tag" },
  { value: "week",  label: "Woche",  short: "Wo" },
  { value: "month", label: "Monat",  short: "Mt" },
];
export const RENT_PERIOD_LABELS = Object.fromEntries(RENT_PERIODS.map(r => [r.value, r.label]));
export const RENT_PERIOD_SHORT  = Object.fromEntries(RENT_PERIODS.map(r => [r.value, r.short]));

// ─── Schweizer Kantone ───────────────────────────────────────
export const CANTONS = [
  "AG","AI","AR","BE","BL","BS","FR","GE","GL","GR",
  "JU","LU","NE","NW","OW","SG","SH","SO","SZ","TG",
  "TI","UR","VD","VS","ZG","ZH",
];

// ─── Shipping ────────────────────────────────────────────────
// DB: shipping_payer CHECK (buyer, seller)
export const SHIPPING_PAYERS = [
  { value: "buyer",  label: "Käufer" },
  { value: "seller", label: "Verkäufer" },
];

// ─── Payment Methods ─────────────────────────────────────────
// DB: pay_twint, pay_bank, pay_cash (all boolean)
export const PAYMENT_METHODS = [
  { key: "pay_twint", label: "TWINT" },
  { key: "pay_bank",  label: "Banküberweisung" },
  { key: "pay_cash",  label: "Barzahlung" },
];

// ─── DB Field Reference ──────────────────────────────────────
// listing_images: url (NICHT image_url), sort_order (NICHT position)
// profiles: display_name (NICHT full_name)
// favorites: user_id + listing_id (KEIN id-Feld)
// FK hint: profiles!listings_user_id_fkey
