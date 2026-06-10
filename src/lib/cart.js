// Warenkorb — clientseitig in localStorage. Snapshots reichen fuer Anzeige.
const KEY = "beedaro_cart";

export function getCart() {
  if (typeof window === "undefined") return [];
  try { const a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; }
  catch { return []; }
}

function save(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  if (typeof window !== "undefined") window.dispatchEvent(new Event("beedaro:cart"));
}

export function isInCart(id) { return getCart().some((i) => i.id === id); }

export function addToCart(item) {
  const items = getCart();
  if (items.some((i) => i.id === item.id)) return items;
  const next = [...items, item];
  save(next);
  return next;
}

export function removeFromCart(id) {
  const next = getCart().filter((i) => i.id !== id);
  save(next);
  return next;
}

export function clearCartForSeller(sellerId) {
  const next = getCart().filter((i) => i.seller_id !== sellerId);
  save(next);
  return next;
}

export function clearCart() { save([]); }
export function cartCount() { return getCart().length; }
