import type { BeeRateCalculation, BeeRateTier } from '@/types/database'

// Gestaffelte Bee-Rates
const BEE_RATES: Record<BeeRateTier, { seller: number; buyer: number }> = {
  starter: { seller: 3,  buyer: 20 },
  basic:   { seller: 5,  buyer: 25 },
  plus:    { seller: 7,  buyer: 30 },
  pro:     { seller: 10, buyer: 35 },
}

/**
 * Berechnet die Bee-Rate Aufschlüsselung für einen gegebenen Preis
 */
export function calculateBeeRate(
  itemPrice: number,
  tier: BeeRateTier = 'starter'
): BeeRateCalculation {
  const rates = BEE_RATES[tier]

  const sellerFeePct = rates.seller
  const buyerFeePct = rates.buyer

  const sellerFee = round(itemPrice * (sellerFeePct / 100))
  const buyerFee = round(itemPrice * (buyerFeePct / 100))

  return {
    item_price: itemPrice,
    seller_fee_pct: sellerFeePct,
    buyer_fee_pct: buyerFeePct,
    seller_fee: sellerFee,
    buyer_fee: buyerFee,
    total_buyer_pays: round(itemPrice + buyerFee),
    seller_receives: round(itemPrice - sellerFee),
    platform_revenue: round(sellerFee + buyerFee),
  }
}

/**
 * Formatiert CHF-Beträge
 */
export function formatCHF(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
  }).format(amount)
}

/**
 * Gibt das Bee-Rate Label zurück
 */
export function getBeeRateLabel(tier: BeeRateTier): string {
  const labels: Record<BeeRateTier, string> = {
    starter: '🐝 Starter Bee',
    basic:   '🐝 Basic Bee',
    plus:    '🐝 Plus Bee',
    pro:     '🐝 Pro Bee',
  }
  return labels[tier]
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}


