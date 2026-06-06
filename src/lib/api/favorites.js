import { supabase } from "@/lib/supabase/supabase";


export async function toggleFavorite(userId, listingId) {
  const { data: existing } = await supabase.from("favorites").select("user_id").eq("user_id", userId).eq("listing_id", listingId).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("listing_id", listingId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("favorites").insert({ user_id: userId, listing_id: listingId });
    if (error) throw error;
  }
  // favorite_count auf listing aktualisieren (RPC mit SECURITY DEFINER)
  try {
    await supabase.rpc("update_favorite_count", { listing_id_input: listingId });
  } catch {
    // Fallback: direkt updaten (klappt nur wenn RLS es erlaubt)
    try {
      const { count } = await supabase.from("favorites").select("*", { count: "exact", head: true }).eq("listing_id", listingId);
      await supabase.from("listings").update({ favorite_count: count || 0 }).eq("id", listingId);
    } catch {}
  }
  return !existing;
}


export async function getUserFavorites(userId) {
  const { data, error } = await supabase.from("favorites")
    .select("listing_id, listing:listings(*, listing_images(*), seller:profiles!listings_user_id_fkey(id, display_name, avatar_url, bee_impact_total, bee_level, avg_rating, rating_count))")
    .eq("user_id", userId);
  if (error) throw error;
  return (data || []).map(fav => {
    if (!fav.listing) return null;
    const sorted = (fav.listing.listing_images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return { ...fav.listing, cover_image: sorted[0]?.url || null, sellerName: fav.listing.seller?.display_name || "Benutzer" };
  }).filter(Boolean);
}


export async function isFavorited(userId, listingId) {
  const { data } = await supabase.from("favorites").select("user_id").eq("user_id", userId).eq("listing_id", listingId).maybeSingle();
  return !!data;
}


export const isListingFavorited = isFavorited;


export async function incrementViewCount(listingId) {
  try {
    const { error } = await supabase.rpc("increment_view_count", { listing_id_input: listingId });
    if (!error) return;
  } catch {}
  // Fallback: read + write (funktioniert nur wenn RLS es erlaubt)
  try {
    const { data } = await supabase.from("listings").select("view_count").eq("id", listingId).single();
    await supabase.from("listings").update({ view_count: (data?.view_count || 0) + 1 }).eq("id", listingId);
  } catch {}
}
