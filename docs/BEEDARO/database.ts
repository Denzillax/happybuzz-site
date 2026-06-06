// ============================================================
// BEEDARO – TypeScript Types (mirrors Supabase schema)
// ============================================================

// --- Enums ---

export type ListingType = 'sell' | 'rent'
export type ListingStatus = 'draft' | 'active' | 'paused' | 'sold' | 'rented' | 'expired' | 'deleted'
export type ConditionType = 'new' | 'like_new' | 'good' | 'fair' | 'poor'
export type RentPeriod = 'hour' | 'day' | 'week' | 'month'
export type TransactionStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'disputed' | 'refunded' | 'cancelled'
export type MessageType = 'text' | 'image' | 'offer' | 'system'
export type BeeRateTier = 'starter' | 'basic' | 'plus' | 'pro'
export type ReportReason = 'spam' | 'fraud' | 'inappropriate' | 'counterfeit' | 'other'
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed'

// --- Models ---

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  phone: string | null
  city: string | null
  canton: string | null
  postal_code: string | null
  stripe_account_id: string | null
  stripe_onboarded: boolean
  bee_rate_tier: BeeRateTier
  rating_avg: number
  rating_count: number
  listings_count: number
  sales_count: number
  is_verified: boolean
  is_banned: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  parent_id: string | null
  sort_order: number
  is_active: boolean
  children?: Category[]
}

export interface Listing {
  id: string
  user_id: string
  title: string
  slug: string
  description: string | null
  listing_type: ListingType
  status: ListingStatus
  condition: ConditionType | null
  category_id: string | null
  price: number | null
  currency: string
  is_negotiable: boolean
  rent_price: number | null
  rent_period: RentPeriod | null
  deposit_amount: number | null
  min_rent_days: number | null
  max_rent_days: number | null
  city: string | null
  canton: string | null
  postal_code: string | null
  shipping_available: boolean
  shipping_cost: number | null
  pickup_only: boolean
  seller_fee_pct: number
  buyer_fee_pct: number
  view_count: number
  favorite_count: number
  published_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  // Relations (optional, je nach Query)
  images?: ListingImage[]
  category?: Category
  user?: Profile
}

export interface ListingImage {
  id: string
  listing_id: string
  url: string
  storage_path: string
  alt_text: string | null
  sort_order: number
  is_cover: boolean
  width: number | null
  height: number | null
}

export interface Favorite {
  user_id: string
  listing_id: string
  created_at: string
  listing?: Listing
}

export interface Conversation {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  last_message_at: string | null
  last_message_preview: string | null
  buyer_unread: number
  seller_unread: number
  is_archived: boolean
  created_at: string
  // Relations
  listing?: Listing
  buyer?: Profile
  seller?: Profile
  messages?: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  message_type: MessageType
  content: string
  offer_amount: number | null
  image_url: string | null
  is_read: boolean
  created_at: string
  sender?: Profile
}

export interface Transaction {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  listing_type: ListingType
  status: TransactionStatus
  item_price: number
  seller_fee: number
  buyer_fee: number
  shipping_cost: number
  total_amount: number
  seller_payout: number
  platform_revenue: number
  rent_start: string | null
  rent_end: string | null
  deposit_amount: number | null
  deposit_returned: boolean
  stripe_payment_intent_id: string | null
  tracking_number: string | null
  shipping_address: Record<string, unknown> | null
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  listing?: Listing
  buyer?: Profile
  seller?: Profile
}

export interface Review {
  id: string
  transaction_id: string
  reviewer_id: string
  reviewed_id: string
  listing_id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer?: Profile
}

export interface BeeRateConfig {
  tier: BeeRateTier
  seller_fee_pct: number
  buyer_fee_pct: number
  label: string
  description: string | null
  is_default: boolean
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

// --- API / Search ---

export interface SearchFilters {
  query?: string
  category?: string
  listing_type?: ListingType
  condition?: ConditionType[]
  price_min?: number
  price_max?: number
  city?: string
  canton?: string
  radius_km?: number
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
  page?: number
  per_page?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// --- Bee-Rate Berechnung ---

export interface BeeRateCalculation {
  item_price: number
  seller_fee_pct: number
  buyer_fee_pct: number
  seller_fee: number
  buyer_fee: number
  total_buyer_pays: number
  seller_receives: number
  platform_revenue: number
}


