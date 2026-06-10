// Zuletzt angesehene Inserate — clientseitig in localStorage (kein DB-Roundtrip).
// Speichert einen schlanken Snapshot, der für ListingCard ausreicht.
import { getCoverUrl } from "@/lib/formatters";

const KEY = "beedaro_recent_views";
const MAX = 12;

export function getRecentlyViewed() {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function recordView(listing) {
  if (typeof window === "undefined" || !listing?.id) return;
  try {
    const snap = {
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      listing_type: listing.listing_type,
      price: listing.price,
      rent_price: listing.rent_price,
      rent_period: listing.rent_period,
      start_price: listing.start_price,
      buy_now_price: listing.buy_now_price,
      condition: listing.condition,
      city: listing.city,
      created_at: listing.created_at,
      auction_end: listing.auction_end,
      cover_image: getCoverUrl(listing),
      seller: listing.seller
        ? {
            display_name: listing.seller.display_name,
            account_type: listing.seller.account_type,
            company_name: listing.seller.company_name,
          }
        : null,
    };
    const rest = getRecentlyViewed().filter((x) => x.id !== listing.id);
    localStorage.setItem(KEY, JSON.stringify([snap, ...rest].slice(0, MAX)));
  } catch {}
}
