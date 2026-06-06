// ═══════════════════════════════════════════════════════════════
// BEEDARO Gamification System
// Bee-Levels: Starter → Busy Bee → Hive Builder → Queen Bee → Bee Legend
// ═══════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabase/supabase";

// Bee-Level Definitionen
export const BEE_LEVELS = [
  { key: "starter",      name: "Bee Starter",   minXp: 0,    icon: "seed" },
  { key: "busy",         name: "Busy Bee",      minXp: 100,  icon: "bee" },
  { key: "hive_builder", name: "Hive Builder",  minXp: 500,  icon: "hive" },
  { key: "queen",        name: "Queen Bee",     minXp: 2000, icon: "crown" },
  { key: "legend",       name: "Bee Legend",    minXp: 10000, icon: "star" },
];

// XP-Belohnungen pro Aktion
export const XP_REWARDS = {
  listing_created: 10,
  listing_published: 5,
  sale_completed: 25,
  purchase_completed: 15,
  rating_given: 10,
  rating_received_positive: 5,
  rental_completed: 20,
  first_listing: 50,
  first_sale: 100,
  profile_verified: 30,
  referral: 75,
};

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

// XP vergeben
export async function awardXP(userId, amount, reason, referenceId = null) {
  // XP Log erstellen
  await supabase.from("xp_log").insert({
    user_id: userId, amount, reason, reference_id: referenceId,
  });

  // Profil XP aktualisieren
  const { data: profile } = await supabase.from("profiles")
    .select("xp_total").eq("id", userId).maybeSingle();
  
  const newXp = (profile?.xp_total || 0) + amount;
  const newLevel = calculateLevel(newXp);

  await supabase.from("profiles").update({
    xp_total: newXp, bee_level: newLevel.key,
  }).eq("id", userId);

  return { newXp, newLevel };
}

// Achievement freischalten
export async function unlockAchievement(userId, achievementKey) {
  const { data: existing } = await supabase.from("user_achievements")
    .select("id").eq("user_id", userId).eq("achievement_key", achievementKey).maybeSingle();
  
  if (existing) return false; // Schon freigeschaltet

  await supabase.from("user_achievements").insert({
    user_id: userId, achievement_key: achievementKey,
  });

  return true;
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
  community_25: { name: "Community Supporter", desc: "CHF 25 Bee-Impact erreicht", xp: 150 },
};

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

// Aktive Challenges laden
export async function getActiveChallenges() {
  const now = new Date().toISOString();
  const { data } = await supabase.from("challenges")
    .select("*").eq("active", true)
    .lte("starts_at", now).gte("ends_at", now)
    .order("ends_at", { ascending: true });
  return data || [];
}

// User-Challenge-Fortschritt laden
export async function getUserChallengeProgress(userId) {
  const { data } = await supabase.from("user_challenges")
    .select("*, challenge:challenges(*)").eq("user_id", userId);
  return data || [];
}
