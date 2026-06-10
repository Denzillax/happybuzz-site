// Letzte Suchbegriffe — clientseitig in localStorage, max 5, dedupliziert.
const KEY = "beedaro_recent_searches";
const MAX = 5;

export function getRecentSearches() {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function recordSearch(q) {
  if (typeof window === "undefined") return;
  const term = (q || "").trim();
  if (!term) return;
  try {
    const rest = getRecentSearches().filter((x) => x.toLowerCase() !== term.toLowerCase());
    localStorage.setItem(KEY, JSON.stringify([term, ...rest].slice(0, MAX)));
  } catch {}
}

export function clearRecentSearches() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY); } catch {}
}
