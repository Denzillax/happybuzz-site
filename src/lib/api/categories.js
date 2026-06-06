import { supabase } from "@/lib/supabase/supabase";


export async function getCategories() {
  const { data, error } = await supabase
    .from("categories").select("*")
    .order("sort_order");
  if (error) throw error;
  return data || [];
}


export async function getAllCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, parent_id, sort_order")
    .order("sort_order");
  if (error) return [];
  return data || [];
}


export async function getSubcategories(parentId) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, parent_id, sort_order")
    .eq("parent_id", parentId)
    .order("sort_order");
  if (error) return [];
  return data || [];
}


export async function searchCategories(query) {
  if (!query || query.length < 2) return [];
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, parent_id")
    .ilike("name", `%${query}%`)
    .limit(8);
  if (error) return [];
  return data || [];
}


export async function getCategoryBreadcrumb(categoryId) {
  const path = [];
  let currentId = categoryId;
  const maxDepth = 5;
  for (let i = 0; i < maxDepth && currentId; i++) {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, icon, parent_id")
      .eq("id", currentId)
      .single();
    if (!data) break;
    path.unshift(data);
    currentId = data.parent_id;
  }
  return path;
}


export async function getSimilarListings(listingId, categoryId, limit = 6) {
  if (!categoryId) return [];

  // Erst gleiche Kategorie versuchen
  let { data, error } = await supabase
    .from("listings")
    .select("*, listing_images(*), seller:profiles!listings_user_id_fkey(id, display_name, avatar_url, bee_impact_total, bee_level, avg_rating, rating_count)")
    .eq("status", "active")
    .eq("category_id", categoryId)
    .neq("id", listingId)
    .limit(limit)
    .order("created_at", { ascending: false });

  // Fallback: Parent-Kategorie wenn zu wenig Ergebnisse
  if ((!data || data.length < 3)) {
    const { data: cat } = await supabase.from("categories").select("parent_id").eq("id", categoryId).single();
    if (cat?.parent_id) {
      // Alle Geschwister-Kategorien finden
      const { data: siblings } = await supabase.from("categories").select("id").eq("parent_id", cat.parent_id);
      const sibIds = (siblings || []).map(s => s.id);
      sibIds.push(cat.parent_id);
      const { data: parentData } = await supabase
        .from("listings")
        .select("*, listing_images(*), seller:profiles!listings_user_id_fkey(id, display_name, avatar_url, bee_impact_total, bee_level, avg_rating, rating_count)")
        .eq("status", "active")
        .in("category_id", sibIds)
        .neq("id", listingId)
        .limit(limit)
        .order("created_at", { ascending: false });
      if (parentData?.length > (data?.length || 0)) data = parentData;
    }
  }

  return (data || []).map((l) => ({
    ...l,
    cover_image: (l.listing_images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url || null,
  }));
}
