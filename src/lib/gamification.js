// ═══════════════════════════════════════════════════════════════
// BEEDARO Gamification System
// Währung: POLLEN (Erfahrung, automatisch gesammelt → bestimmt Bee-Level)
// Bee-Levels: Entdecker → Sammler → Hive Builder → Queen Bee → Legende
// (intern weiterhin xp_total/xp_log — UI-Begriff ist "Pollen")
// ═══════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabase/supabase";

// Bee-Level Definitionen (minXp = Pollen-Schwelle)
export const BEE_LEVELS = [
  { key: "starter",      name: "Entdecker",    minXp: 0,    color: "#9E9E9E", perk: "Willkommen im Schwarm" },
  { key: "busy",         name: "Sammler",      minXp: 100,  color: "#CD7F32", perk: "Sammler-Badge + bessere Platzierung" },
  { key: "hive_builder", name: "Hive Builder", minXp: 500,  color: "#9FB1BC", perk: "Verified-Badge + Ranking-Boost" },
  { key: "queen",        name: "Queen Bee",    minXp: 2000, color: "#E8A820", perk: "Shop-Name + Top-Platzierung" },
  { key: "legend",       name: "Legende",      minXp: 5000, color: "#04151F", perk: "Animiertes Badge + Homepage-Feature" },
];

export function getLevelByKey(key) {
  return BEE_LEVELS.find(l => l.key === key) || BEE_LEVELS[0];
}

// XP bis zum nächsten Level (0 wenn max)
export function xpToNext(xp) {
  const cur = calculateLevel(xp);
  const idx = BEE_LEVELS.indexOf(cur);
  if (idx >= BEE_LEVELS.length - 1) return 0;
  return BEE_LEVELS[idx + 1].minXp - xp;
}

// Level berechnen basierend auf XP
export function calculateLevel(xp) {
  let level = BEE_LEVELS[0];
  for (const l of BEE_LEVELS) {
    if (xp >= l.minXp) level = l;
  }
  return level;
}

// Fortschritt zum nächsten Level (0 bis 1)
export function levelProgress(xp) {
  const current = calculateLevel(xp);
  const currentIdx = BEE_LEVELS.indexOf(current);
  if (currentIdx >= BEE_LEVELS.length - 1) return 1;
  const next = BEE_LEVELS[currentIdx + 1];
  const range = next.minXp - current.minXp;
  const progress = xp - current.minXp;
  return Math.min(progress / range, 1);
}

// Achievement-Definitionen
export const ACHIEVEMENTS = {
  first_listing: { name: "Erster Schritt", desc: "Dein erstes Inserat erstellt", xp: 50 },
  first_sale: { name: "Erster Verkauf", desc: "Dein erster erfolgreicher Verkauf", xp: 100 },
  first_purchase: { name: "Schnäppchenjäger", desc: "Dein erster Kauf", xp: 50 },
  ten_sales: { name: "Profi-Verkäufer", desc: "10 Verkäufe abgeschlossen", xp: 200 },
  fifty_sales: { name: "Marktplatz-Legende", desc: "50 Verkäufe abgeschlossen", xp: 500 },
  five_star_rating: { name: "Traumpartner", desc: "5-Sterne-Bewertung erhalten", xp: 25 },
  ten_ratings: { name: "Verlässlich", desc: "10 Bewertungen erhalten", xp: 100 },
  profile_complete: { name: "Vollständig", desc: "Profil vollständig verifiziert", xp: 30 },
  bee_hero: { name: "Bee Hero", desc: "Inserat mit 10% Bee-Rate erstellt", xp: 50 },
  first_rental: { name: "Teilen ist Caring", desc: "Erstes Miet-Inserat erstellt", xp: 50 },
  community_25: { name: "Community Supporter", desc: "250 Blüten gesammelt", xp: 150 },
};

// Achievement freischalten UND zugehörige XP vergeben (idempotent, serverseitig via RPC)
export async function grantAchievement(userId, achievementKey) {
  const def = ACHIEVEMENTS[achievementKey];
  const { data, error } = await supabase.rpc("grant_achievement", {
    p_user_id: userId, p_key: achievementKey, p_xp: def?.xp || 0,
  });
  if (error) { console.error("grant_achievement:", error); return false; }
  const unlocked = data === true;
  if (unlocked && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("beedaro:achievement", { detail: { userId, key: achievementKey, name: def?.name || achievementKey, xp: def?.xp || 0 } }));
  }
  return unlocked;
}

// User-Achievements laden
export async function getUserAchievements(userId) {
  const { data } = await supabase.from("user_achievements")
    .select("*").eq("user_id", userId).order("unlocked_at", { ascending: false });
  return data || [];
}

// User-XP-History laden
export async function getXPHistory(userId, limit = 20) {
  const { data } = await supabase.from("xp_log")
    .select("*").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(limit);
  return data || [];
}

// ── NEKTAR (einlösbare Belohnung) ───────────────────────────────
// Verdient wird Nektar serverseitig per Trigger (Verkaufs-Meilensteine,
// Bee-Rate-Bonus, 5-Sterne, Level-Up). Speicher: profiles.nektar + nektar_log.

// Nektar-Einlöse-Katalog. needsListing = Inserat-Picker nötig; durationHours = Boost-Dauer.
export const NEKTAR_CATALOG = [
  { key: "spotlight",      name: "Spotlight",            cost: 50,   group: "Sichtbarkeit", desc: "Dein Inserat 24h zuoberst in der Kategorie.",         needsListing: true,  durationHours: 24 },
  { key: "golden_stamp",   name: "Goldener Stempel",     cost: 100,  group: "Sichtbarkeit", desc: "Featured-Badge auf deinem Inserat für 3 Tage.",       needsListing: true,  durationHours: 72 },
  { key: "showcase",       name: "Schaufenster",         cost: 200,  group: "Sichtbarkeit", desc: "Dein Profil 1 Woche auf der Homepage.",               needsListing: false, durationHours: 168, confirm: "Dein Profil wird 1 Woche auf der Homepage gezeigt." },
  { key: "mega_boost",     name: "Mega-Boost",           cost: 300,  group: "Sichtbarkeit", desc: "Alle Inserate 48h zuoberst + Featured-Badge.",        needsListing: false, durationHours: 48 },
  { key: "bluehpatenschaft", name: "Blühpatenschaft",    cost: 250,  group: "Impact",       desc: "5m² Wildblumenwiese in deinem Namen.",                needsListing: false, durationHours: 0, confirm: "Dein Name erscheint auf dem Projekt (Bee-Impact-Seite)." },
  { key: "wildbienen",     name: "Wildbienen-Patenschaft", cost: 500, group: "Impact",      desc: "Ein Wildbienenhotel mit deinem Namen.",               needsListing: false, durationHours: 0, confirm: "Dein Name erscheint auf dem Wildbienenhotel." },
  { key: "naturschutz_held", name: "Naturschutz-Held",   cost: 1000, group: "Impact",       desc: "Urkunde + Name auf der Wall of Impact.",              needsListing: false, durationHours: 0, confirm: "Dein Name erscheint auf der Wall of Impact." },
  { key: "custom_badge",   name: "Custom Badge",         cost: 150,  group: "Exklusiv",     desc: "Eigenes Badge-Icon für 30 Tage.",                     needsListing: false, durationHours: 720 },
  { key: "shop_color",     name: "Shop-Farbe",           cost: 200,  group: "Exklusiv",     desc: "Akzentfarbe für deinen Shop.",                        needsListing: false, durationHours: 0 },
  { key: "early_access",   name: "Early Access",         cost: 100,  group: "Exklusiv",     desc: "Neue Features 2 Wochen früher.",                      needsListing: false, durationHours: 0 },
];

// Nektar einlösen (atomar serverseitig). Gibt {ok, new_balance, error} zurück.
export async function redeemNektar(reward, cost, listingId = null, durationHours = 0) {
  const { data, error } = await supabase.rpc("redeem_nektar", {
    p_reward: reward, p_cost: cost, p_listing_id: listingId, p_duration_hours: durationHours,
  });
  if (error) { console.error("redeem_nektar:", error); return { ok: false, error: "rpc" }; }
  return data || { ok: false, error: "unknown" };
}

// Blüten -> Pollen Umwandlungsrate (100 Blüten = 1 Pollen).
export const BLUETEN_PER_POLLEN = 100;

// Blüten manuell in Pollen umwandeln (serverseitig, RLS-sicher, 100er-Schritte).
// Gibt { ok, blueten, pollen_gained, xp_total } oder { ok:false, error } zurück.
export async function convertBlueten(amount) {
  const { data, error } = await supabase.rpc("convert_blueten_to_pollen", { p_amount: amount });
  if (error) { console.error("convert_blueten_to_pollen:", error); return { ok: false, error: "rpc" }; }
  return data || { ok: false, error: "unknown" };
}

// Aktive Boosts für eine Liste von Inseraten (Badge-Anzeige auf Cards).
export async function getActiveBoosts(listingIds) {
  if (!listingIds?.length) return {};
  const nowIso = new Date().toISOString();
  const { data } = await supabase.from("nektar_redemptions")
    .select("listing_id, reward_type, expires_at")
    .in("listing_id", listingIds).eq("status", "active");
  const map = {};
  (data || []).forEach((r) => {
    if (r.expires_at && r.expires_at < nowIso) return;
    (map[r.listing_id] = map[r.listing_id] || []).push(r.reward_type);
  });
  return map;
}

// Verkäufer mit aktivem "Schaufenster" (showcase) für die Homepage.
// Lädt Profil + bis zu 3 aktive Inserate je Verkäufer. Älteste Einlösung zuerst.
export async function getShowcaseSellers(maxSellers = 6) {
  const nowIso = new Date().toISOString();
  const { data: reds } = await supabase.from("nektar_redemptions")
    .select("user_id, created_at, expires_at")
    .eq("reward_type", "showcase").eq("status", "active")
    .order("created_at", { ascending: true });
  const active = (reds || []).filter((r) => !r.expires_at || r.expires_at > nowIso);
  if (!active.length) return [];

  // Pro Verkäufer nur die früheste aktive Einlösung behalten.
  const seen = new Set();
  const userIds = [];
  for (const r of active) {
    if (seen.has(r.user_id)) continue;
    seen.add(r.user_id);
    userIds.push(r.user_id);
    if (userIds.length >= maxSellers) break;
  }

  const { data: profiles } = await supabase.from("profiles")
    .select("id, display_name, avatar_url, account_type, company_name, avg_rating, rating_count")
    .in("id", userIds);
  const profMap = {};
  (profiles || []).forEach((p) => { profMap[p.id] = p; });

  const { data: listings } = await supabase.from("listings")
    .select("id, title, price, rent_price, rent_period, listing_type, user_id, listing_images(url, sort_order)")
    .in("user_id", userIds).eq("status", "active")
    .order("created_at", { ascending: false });
  const byUser = {};
  (listings || []).forEach((l) => {
    if ((byUser[l.user_id]?.length || 0) >= 3) return;
    const imgs = (l.listing_images || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    (byUser[l.user_id] = byUser[l.user_id] || []).push({ id: l.id, title: l.title, price: l.price, rent_price: l.rent_price, rent_period: l.rent_period, listing_type: l.listing_type, cover: imgs[0]?.url || null });
  });

  return userIds
    .map((id) => profMap[id] ? { ...profMap[id], listings: byUser[id] || [] } : null)
    .filter(Boolean);
}

const NEKTAR_REASON_LABEL = {
  level_up: "Neues Level erreicht",
  five_star_nektar: "5-Sterne-Bewertung",
  bee_rate_bonus: "Bee-Rate-Bonus",
  sales_milestone_10: "10 Verkäufe",
  sales_milestone_25: "25 Verkäufe",
  sales_milestone_50: "50 Verkäufe",
  nektar_redeemed: "Belohnung eingelöst",
};
export const nektarReasonLabel = (r) => NEKTAR_REASON_LABEL[r] || r;

// Nektar-History laden
export async function getNektarHistory(userId, limit = 20) {
  const { data } = await supabase.from("nektar_log")
    .select("*").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(limit);
  return data || [];
}

// Aktive Challenges laden (inkl. Kategorie-Name fuer Kategorie-Challenges)
export async function getActiveChallenges() {
  const now = new Date().toISOString();
  const { data } = await supabase.from("challenges")
    .select("*, category:categories(id, name)").eq("active", true)
    .eq("is_template", false)   // Vorlagen rotieren nur, sie erscheinen nie selbst
    .lte("starts_at", now).gte("ends_at", now)
    .order("ends_at", { ascending: true });
  return data || [];
}

// Kategorie + alle Unterkategorien als Id-Liste (Spiegel der SQL-Funktion
// category_tree_ids; die Einloese-Pruefung laeuft ohnehin serverseitig).
async function categoryTreeIds(categoryId) {
  const { data } = await supabase.from("categories").select("id, parent_id");
  const all = data || [];
  const ids = [categoryId];
  let added = true;
  while (added) {
    added = false;
    for (const c of all) {
      if (c.parent_id && ids.includes(c.parent_id) && !ids.includes(c.id)) { ids.push(c.id); added = true; }
    }
  }
  return ids;
}

// Wochen-Rotation anstossen (idempotent; der erste Aufrufer der Woche
// instanziert die Vorlagen). Fehler sind still: ohne Rotation zeigt der
// Hive schlimmstenfalls die alte Woche.
export async function ensureWeeklyChallenges() {
  const { error } = await supabase.rpc("ensure_weekly_challenges");
  if (error) console.error("ensure_weekly_challenges:", error);
}

// Challenge einloesen. Serverseitig verifiziert; Rueckgabe
// {ok, amount} oder {ok:false, reason: 'incomplete'|'already_claimed'|...}.
export async function claimChallenge(challengeId) {
  const { data, error } = await supabase.rpc("claim_challenge", { p_challenge_id: challengeId });
  if (error) { console.error("claim_challenge:", error); return { ok: false, reason: "error" }; }
  return data || { ok: false, reason: "empty" };
}

// User-Challenge-Fortschritt laden
export async function getUserChallengeProgress(userId) {
  const { data } = await supabase.from("user_challenges")
    .select("*, challenge:challenges(*)").eq("user_id", userId);
  return data || [];
}

// ─── Streak / Leaderboard / Community / Live-Challenges ──────────

function startOfWeekISO() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Montag = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.toISOString();
}

// Tages-Streak ticken (idempotent pro Tag, serverseitig)
export async function touchStreak(userId) {
  const { data, error } = await supabase.rpc("touch_streak", { p_user_id: userId });
  if (error) { console.error("touch_streak:", error); return null; }
  return data;
}

// Wochen-Leaderboard nach XP dieser Woche (aus xp_log)
export async function getWeeklyLeaderboard(limit = 10) {
  const { data } = await supabase.from("xp_log")
    .select("user_id, amount").gte("created_at", startOfWeekISO());
  const totals = {};
  (data || []).forEach(r => { totals[r.user_id] = (totals[r.user_id] || 0) + r.amount; });
  const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, limit);
  const ids = ranked.map(([id]) => id);
  if (!ids.length) return [];
  const { data: profs } = await supabase.from("profiles")
    .select("id, display_name, avatar_url, bee_level, xp_total").in("id", ids);
  const pMap = Object.fromEntries((profs || []).map(p => [p.id, p]));
  return ranked.map(([id, xp], i) => ({ rank: i + 1, userId: id, weekXp: xp, ...(pMap[id] || {}) }));
}

// Community-Aggregat (Wir-Gefühl)
export async function getCommunityStats() {
  const [{ data: impact }, { count: members }, { data: weekXp }] = await Promise.all([
    supabase.from("profiles").select("bee_impact_total"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gt("xp_total", 0),
    supabase.from("xp_log").select("amount").gte("created_at", startOfWeekISO()),
  ]);
  return {
    totalImpact: (impact || []).reduce((s, p) => s + parseFloat(p.bee_impact_total || 0), 0),
    hiveMembers: members || 0,
    weekXp: (weekXp || []).reduce((s, r) => s + r.amount, 0),
  };
}

// Aktive Challenges mit Live-Fortschritt für einen User
export async function getChallengesWithProgress(userId) {
  const challenges = await getActiveChallenges();
  // Bereits eingeloeste markieren (user_challenges schreibt nur die claim-RPC)
  const { data: claims } = await supabase.from("user_challenges")
    .select("challenge_id").eq("user_id", userId);
  const claimedSet = new Set((claims || []).map(r => r.challenge_id));
  const out = [];
  for (const c of challenges) {
    let progress = 0;
    if (c.target_action === "listing_created") {
      let q = supabase.from("listings").select("id", { count: "exact", head: true })
        .eq("user_id", userId).neq("status", "deleted").gte("created_at", c.starts_at);
      if (c.category_id) q = q.in("category_id", await categoryTreeIds(c.category_id));
      const { count } = await q;
      progress = count || 0;
    } else if (c.target_action === "sale_completed") {
      const { count } = await supabase.from("purchases").select("id", { count: "exact", head: true })
        .eq("seller_id", userId).eq("status", "completed").gte("created_at", c.starts_at);
      progress = count || 0;
    } else if (c.target_action === "five_star") {
      const { count } = await supabase.from("ratings").select("id", { count: "exact", head: true })
        .eq("rated_id", userId).eq("rating", 5).gte("created_at", c.starts_at);
      progress = count || 0;
    } else if (c.target_action === "buy_completed") {
      const { count } = await supabase.from("purchases").select("id", { count: "exact", head: true })
        .eq("buyer_id", userId).eq("status", "completed").gte("created_at", c.starts_at);
      progress = count || 0;
    } else if (c.target_action === "rating_given") {
      const { count } = await supabase.from("ratings").select("id", { count: "exact", head: true })
        .eq("rater_id", userId).gte("created_at", c.starts_at);
      progress = count || 0;
    } else if (c.target_action === "distinct_categories") {
      const { data: rows } = await supabase.from("listings").select("category_id")
        .eq("user_id", userId).neq("status", "deleted").gte("created_at", c.starts_at)
        .not("category_id", "is", null);
      progress = new Set((rows || []).map(r => r.category_id)).size;
    }
    out.push({ ...c, progress: Math.min(progress, c.target_value), done: progress >= c.target_value, claimed: claimedSet.has(c.id) });
  }
  return out;
}

// Aktive Startseiten-Challenge (featured) — null, wenn keine laeuft
export async function getFeaturedChallenge() {
  const now = new Date().toISOString();
  const { data } = await supabase.from("challenges")
    .select("*, category:categories(id, name)")
    .eq("active", true).eq("is_template", false).eq("featured", true)
    .lte("starts_at", now).gte("ends_at", now)
    .order("ends_at", { ascending: true })
    .limit(1).maybeSingle();
  return data || null;
}
