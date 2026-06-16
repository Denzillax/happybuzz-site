// Reine Analytics-Helfer (keine UI, kein Supabase).

// Buendelt Zeilen mit created_at in Tages-Buckets ueber die letzten rangeDays Tage (inkl. heute).
// valueFn(row) -> Zahl (z.B. () => 1 fuer Zaehlung, oder ein Betrag). Fehlende Tage = 0.
export function bucketDaily(rows, rangeDays, valueFn) {
  const DAY = 86400000;
  const start = new Date(Date.now() - (rangeDays - 1) * DAY);
  const map = {};
  for (let i = 0; i < rangeDays; i++) {
    const key = new Date(start.getTime() + i * DAY).toISOString().slice(0, 10);
    map[key] = 0;
  }
  (rows || []).forEach(r => {
    if (!r.created_at) return;
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    if (key in map) map[key] += valueFn(r);
  });
  return Object.keys(map).sort().map(k => ({ date: k, value: map[k] }));
}

// Zaehlt Inserate je Typ in fester Reihenfolge.
export function countByType(rows) {
  const order = ["sell", "auction", "rent", "free", "service"];
  const c = { sell: 0, auction: 0, rent: 0, free: 0, service: 0 };
  (rows || []).forEach(r => { if (r.listing_type in c) c[r.listing_type] += 1; });
  return order.map(k => ({ type: k, count: c[k] }));
}
