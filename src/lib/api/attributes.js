import { supabase } from "@/lib/supabase/supabase";

/**
 * Get all attributes for a category (including parent category attributes)
 */
export async function getCategoryAttributes(categoryId) {
  if (!categoryId) return [];

  // Get the category to check for parent
  const { data: cat } = await supabase
    .from("categories")
    .select("id, parent_id")
    .eq("id", categoryId)
    .maybeSingle();

  if (!cat) return [];

  // Collect category IDs to query (this category + all ancestors)
  const categoryIds = [cat.id];
  let currentParentId = cat.parent_id;

  // Walk up the tree to get parent attributes too
  while (currentParentId) {
    categoryIds.push(currentParentId);
    const { data: parent } = await supabase
      .from("categories")
      .select("id, parent_id")
      .eq("id", currentParentId)
      .maybeSingle();
    currentParentId = parent?.parent_id || null;
  }

  const { data, error } = await supabase
    .from("category_attributes")
    .select("*")
    .in("category_id", categoryIds)
    .order("sort_order");

  if (error) { console.error("getCategoryAttributes error:", error); return []; }

  // Parse options from JSON string if needed
  return (data || []).map(attr => ({
    ...attr,
    options: typeof attr.options === "string" ? JSON.parse(attr.options) : attr.options,
  }));
}

/**
 * Get filterable attributes for a category (for search filters)
 */
export async function getFilterableAttributes(categoryId) {
  const attrs = await getCategoryAttributes(categoryId);
  return attrs.filter(a => a.is_filterable);
}

/**
 * Get attribute values for a listing
 */
export async function getListingAttributes(listingId) {
  if (!listingId) return {};

  const { data, error } = await supabase
    .from("listing_attributes")
    .select("attribute_id, value, category_attributes(name, attribute_key, attribute_type, options, unit)")
    .eq("listing_id", listingId);

  if (error) { console.error("getListingAttributes error:", error); return {}; }

  // Return as key-value map: { attribute_key: value }
  const result = {};
  (data || []).forEach(item => {
    const key = item.category_attributes?.attribute_key;
    if (key) result[key] = item.value;
  });
  return result;
}

/**
 * Attributwerte mit Anzeigenamen fuer die Inserat-Seite (dedupliziert per Key)
 */
export async function getListingAttributesDetailed(listingId) {
  if (!listingId) return [];
  const { data, error } = await supabase
    .from("listing_attributes")
    .select("value, category_attributes(name, attribute_key, unit, sort_order)")
    .eq("listing_id", listingId);
  if (error) { console.error("getListingAttributesDetailed error:", error); return []; }
  const gesehen = new Set();
  return (data || [])
    .filter(r => r.category_attributes?.name && r.value?.toString().trim())
    .filter(r => (gesehen.has(r.category_attributes.attribute_key) ? false : (gesehen.add(r.category_attributes.attribute_key), true)))
    .sort((a, b) => (a.category_attributes.sort_order ?? 0) - (b.category_attributes.sort_order ?? 0))
    .map(r => ({ name: r.category_attributes.name, value: r.value, unit: r.category_attributes.unit || null }));
}

/**
 * Save attribute values for a listing (upsert).
 * categoryId begrenzt die Zuordnung auf die Kategorie-Ahnenkette des Inserats:
 * ohne den Filter wurden Werte per attribute_key ueber ALLE Kategorien
 * zugeordnet (Farbe = Kleidung + Handy + Haushalt...) und erzeugten Duplikate.
 */
export async function saveListingAttributes(listingId, attributeValues, categoryId = null) {
  if (!listingId || !attributeValues || Object.keys(attributeValues).length === 0) return;

  const keys = Object.keys(attributeValues);
  let attrs;
  if (categoryId) {
    const katAttrs = await getCategoryAttributes(categoryId);
    const gesehen = new Set();
    attrs = katAttrs.filter(a => {
      if (!keys.includes(a.attribute_key) || gesehen.has(a.attribute_key)) return false;
      gesehen.add(a.attribute_key);
      return true;
    });
  } else {
    const { data } = await supabase
      .from("category_attributes")
      .select("id, attribute_key")
      .in("attribute_key", keys);
    attrs = data;
  }

  if (!attrs || attrs.length === 0) return;

  // Build upsert rows
  const rows = attrs
    .filter(a => attributeValues[a.attribute_key]?.toString().trim())
    .map(a => ({
      listing_id: listingId,
      attribute_id: a.id,
      value: attributeValues[a.attribute_key].toString().trim(),
    }));

  if (rows.length === 0) return;

  const { error } = await supabase
    .from("listing_attributes")
    .upsert(rows, { onConflict: "listing_id,attribute_id" });

  if (error) console.error("saveListingAttributes error:", error);
}

/**
 * Delete all attributes for a listing (used before re-saving on category change)
 */
export async function clearListingAttributes(listingId) {
  if (!listingId) return;
  await supabase.from("listing_attributes").delete().eq("listing_id", listingId);
}

/**
 * Search listings filtered by attribute values
 * Returns listing IDs that match ALL given attribute filters
 */
export async function filterListingsByAttributes(attributeFilters) {
  // attributeFilters: { attribute_key: value, ... }
  if (!attributeFilters || Object.keys(attributeFilters).length === 0) return null;

  const entries = Object.entries(attributeFilters).filter(([_, v]) => v);
  if (entries.length === 0) return null;

  // Get attribute IDs
  const keys = entries.map(([k]) => k);
  const { data: attrs } = await supabase
    .from("category_attributes")
    .select("id, attribute_key")
    .in("attribute_key", keys);

  if (!attrs || attrs.length === 0) return null;

  // For each attribute filter, get matching listing IDs
  let matchingIds = null;

  for (const [key, value] of entries) {
    const attr = attrs.find(a => a.attribute_key === key);
    if (!attr) continue;

    const { data } = await supabase
      .from("listing_attributes")
      .select("listing_id")
      .eq("attribute_id", attr.id)
      .eq("value", value);

    const ids = (data || []).map(d => d.listing_id);

    if (matchingIds === null) {
      matchingIds = new Set(ids);
    } else {
      // Intersection: keep only IDs that match ALL filters
      matchingIds = new Set(ids.filter(id => matchingIds.has(id)));
    }
  }

  return matchingIds ? Array.from(matchingIds) : [];
}
