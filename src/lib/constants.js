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
  { pct: 5,  tier: "supporter", dbTier: "basic",    label: "Supporter",  desc: "Solider Beitrag" },
  { pct: 7,  tier: "impact",    dbTier: "plus",     label: "Impact",     desc: "Empfohlen: Top-Platzierung + Badge" },
  { pct: 10, tier: "hero",      dbTier: "pro",      label: "Bee Hero",   desc: "Maximale Power" },
];

// Einzige Quelle der Wahrheit für die Standard-Bee-Rate.
// Muss mit dem DB-Default von listings.fee_tier / fee_percentage übereinstimmen.
export const DEFAULT_FEE_TIER = "impact";
export const DEFAULT_FEE_TIER_CONFIG = FEE_TIERS.find((t) => t.tier === DEFAULT_FEE_TIER);
export const DEFAULT_FEE_PERCENT = DEFAULT_FEE_TIER_CONFIG.pct;

// Bagatellgrenze: Verkaeufe UNTER diesem Betrag sind komplett gebuehrenfrei
// (keine Gebuehr, kein Bee-Impact). Spart dem Verkaeufer Kleinbetraege und uns
// die Rechnungsverwaltung dafuer.
// ACHTUNG: Muss mit der Grenze im DB-Trigger create_fee_ledger_entry
// uebereinstimmen, sonst zeigt die UI 0 und die Rechnung kommt trotzdem.
export const FEE_FREE_BELOW = 20;

export function isFeeFree(price) {
  return (parseFloat(price) || 0) < FEE_FREE_BELOW;
}

// Gebuehren-Ranking: die Bee-Rate wirkt wie ein Frischevorsprung. Ein Inserat
// wird sortiert, als waere es um so viele Tage neuer erstellt worden.
// Bewusst keine harte Rangfolge, sonst waere der Fair-Tarif wertlos.
// ACHTUNG: Muss mit der generierten Spalte listings.rank_at uebereinstimmen.
export const FEE_RANK_BONUS_DAYS = { 3: 0, 5: 3, 7: 7, 10: 14 };

export function feeRankBonusDays(feePercent) {
  const p = parseFloat(feePercent) || 0;
  if (p >= 10) return FEE_RANK_BONUS_DAYS[10];
  if (p >= 7) return FEE_RANK_BONUS_DAYS[7];
  if (p >= 5) return FEE_RANK_BONUS_DAYS[5];
  return FEE_RANK_BONUS_DAYS[3];
}

// Gruendungsmitglieder: die ersten N Verkaeufer mit einem echten Verkauf.
// ACHTUNG: Muss mit der Obergrenze im DB-Trigger assign_founder_number
// uebereinstimmen, der die Nummern tatsaechlich vergibt.
export const FOUNDER_LIMIT = 500;

// Fremdgebuehren fuer den Auktionsvergleich. Bewusst EINE Stelle, weil es die
// einzige Aussage im Produkt ist, die von fremden Preisen abhaengt und darum
// veralten kann. Vergleichende Werbung ist in der Schweiz zulaessig, solange sie
// wahr und nicht herabsetzend ist, also muss das hier gepflegt werden.
//
// 8-12% ist der BASISSATZ laut Ricardos eigener Hilfeseite. Seit April 2026 gibt
// es Rabatte von bis zu 30%, effektiv sind also ca. 5.6% moeglich. Darum im Text
// immer als Basissatz kennzeichnen und den Rabatt erwaehnen: sonst waere die
// Aussage fuer Rabattnutzer irrefuehrend. Auch dann liegt der Vergleich noch
// klar ueber unseren 3% Einstieg.
// Drittquellen nennen teils 5-9%; die Zahl hier stammt vom Anbieter selbst.
// Zuletzt geprueft: 2026-07-06. Naechste Pruefung spaetestens in 6 Monaten.
export const MARKET_AUCTION_FEE = {
  anbieter: "Ricardo",
  min: 8,
  max: 12,
  rabattBisProzent: 30,
  geprueft: "2026-07-06",
  quelle: "https://help.ricardo.ch/hc/de/articles/8238144523036",
};

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
