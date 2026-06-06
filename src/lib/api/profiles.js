import { supabase } from "@/lib/supabase/supabase";


export async function getMyBeeProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("bee_impact_total, bee_level, display_name, avatar_url")
    .eq("id", userId)
    .single();
  if (error) return { bee_impact_total: 0, bee_level: "starter" };
  return data;
}


export async function getPublicProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, bio, city, canton, created_at, bee_impact_total, bee_level")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}


export async function getUserPublicListings(userId) {
  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_images(*), category:categories(id, name, slug, icon)")
    .eq("user_id", userId)
    .in("status", ["active"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}


export async function getUserRatings(userId) {
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("rated_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];

  // Rater-Profile laden
  const raterIds = [...new Set((data || []).map((r) => r.rater_id))];
  const { data: profiles } = raterIds.length
    ? await supabase.from("profiles").select("id, display_name, avatar_url, bee_impact_total").in("id", raterIds)
    : { data: [] };
  const pMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  return (data || []).map((r) => ({
    ...r,
    raterName: pMap[r.rater_id]?.display_name || "Benutzer",
    raterAvatar: pMap[r.rater_id]?.avatar_url || null,
    raterBeeImpact: pMap[r.rater_id]?.bee_impact_total || 0,
  }));
}


export async function getUserAvgRating(userId) {
  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("rated_id", userId);
  if (error || !data?.length) return { avg: 0, count: 0 };
  const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
  return { avg: Math.round(avg * 10) / 10, count: data.length };
}
