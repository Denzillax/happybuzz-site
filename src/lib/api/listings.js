import { supabase } from "@/lib/supabase/supabase";

import { FEE_TIERS, BEE_IMPACT_RATE } from "@/lib/constants";


function slugify(text) {
  return text.toString().toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    .substring(0, 80);
}


export async function checkProfileComplete(userId, action = "sell") {
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!profile) return { complete: false, missing: ["Profil nicht gefunden"], redirect: "/settings" };

  const missing = [];

  // Immer nötig
  if (!profile.display_name) missing.push("Benutzername");

  // Verkaufen oder Vermieten → IBAN nötig
  if ((action === "sell" || action === "rent_out") && !profile.iban) {
    missing.push("IBAN (für Zahlungsempfang)");
  }

  // Kaufen oder Mieten → Adresse nötig
  if ((action === "buy" || action === "rent") && (!profile.first_name || !profile.last_name)) {
    missing.push("Vorname & Nachname");
  }
  if ((action === "buy" || action === "rent") && (!profile.street || !profile.postal_code || !profile.city)) {
    missing.push("Lieferadresse (Strasse, PLZ, Ort)");
  }

  // Mieten → auch IBAN (für Kaution-Rückerstattung)
  if (action === "rent" && !profile.iban) {
    missing.push("IBAN (für Kaution-Rückerstattung)");
  }

  return {
    complete: missing.length === 0,
    missing,
    redirect: "/settings",
  };
}


export async function createListing(userId, formData) {
  const row = {
    user_id: userId,
    title: formData.title,
    slug: slugify(formData.title || "inserat") + "-" + Date.now().toString(36),
    description: formData.description || "",
    category_id: formData.category_id || null,
    listing_type: formData.listing_type || "sell",
    status: "draft",
    condition: formData.condition || "good",

    price: formData.price ? parseFloat(formData.price) : null,
    currency: formData.currency || "CHF",
    is_negotiable: formData.is_negotiable || false,

    shipping_available: formData.shipping_available || false,
    pickup_only: formData.pickup_only ?? true,
    shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : null,
    shipping_method: formData.shipping_method || null,
    shipping_payer: formData.shipping_payer || "buyer",
    ship_speed: formData.ship_speed || null,
    free_shipping: formData.free_shipping || false,

    city: formData.city || "",
    canton: formData.canton || "",
    postal_code: formData.postal_code || "",

    contact_chat: formData.contact_chat ?? true,
    contact_phone: formData.contact_phone || false,
    phone_number: formData.phone_number || null,

    pay_twint: formData.pay_twint || false,
    pay_bank: formData.pay_bank || false,
    pay_cash: formData.pay_cash || false,

    fee_percentage: formData.fee_percentage ? parseFloat(formData.fee_percentage) : 7,
    fee_tier: formData.fee_tier || "impact",
  };

  if (formData.listing_type === "auction") {
    row.start_price = formData.start_price ? parseFloat(formData.start_price) : null;
    row.buy_now_price = formData.buy_now_price ? parseFloat(formData.buy_now_price) : null;
    row.min_price = formData.min_price ? parseFloat(formData.min_price) : null;
    row.auction_duration = formData.auction_duration || null;
    if (formData.auction_duration) {
      const end = new Date();
      end.setDate(end.getDate() + parseInt(formData.auction_duration));
      row.auction_end = end.toISOString();
    } else {
      row.auction_end = null;
    }
  }
  if (formData.listing_type === "rent") {
    row.rent_price = formData.rent_price ? parseFloat(formData.rent_price) : null;
    row.rent_period = formData.rent_period || "day";
    row.deposit_amount = formData.deposit_amount ? parseFloat(formData.deposit_amount) : null;
    row.min_rent_days = formData.min_rent_days ? parseInt(formData.min_rent_days) : null;
    row.max_rent_days = formData.max_rent_days ? parseInt(formData.max_rent_days) : null;
  }
  if (formData.listing_type === "service") {
    row.rent_price = formData.rent_price ? parseFloat(formData.rent_price) : null;
    row.rent_period = formData.rent_period || "hour";
    row.shipping_available = false;
    row.pickup_only = true;
    row.condition = null;
  }

  const { data, error } = await supabase.from("listings").insert(row).select().single();
  if (error) throw error;
  return data;
}


export async function updateListing(listingId, formData) {
  const row = {
    title: formData.title,
    slug: slugify(formData.title || "inserat") + "-" + Date.now().toString(36),
    description: formData.description || "",
    category_id: formData.category_id || null,
    listing_type: formData.listing_type || "sell",
    condition: formData.condition || "good",
    price: formData.price ? parseFloat(formData.price) : null,
    currency: formData.currency || "CHF",
    is_negotiable: formData.is_negotiable || false,
    shipping_available: formData.shipping_available || false,
    pickup_only: formData.pickup_only ?? true,
    shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : null,
    shipping_method: formData.shipping_method || null,
    shipping_payer: formData.shipping_payer || "buyer",
    ship_speed: formData.ship_speed || null,
    free_shipping: formData.free_shipping || false,
    city: formData.city || "",
    canton: formData.canton || "",
    postal_code: formData.postal_code || "",
    contact_chat: formData.contact_chat ?? true,
    contact_phone: formData.contact_phone || false,
    phone_number: formData.phone_number || null,
    pay_twint: formData.pay_twint || false,
    pay_bank: formData.pay_bank || false,
    pay_cash: formData.pay_cash || false,
    fee_percentage: formData.fee_percentage ? parseFloat(formData.fee_percentage) : 7,
    fee_tier: formData.fee_tier || "impact",
  };
  if (formData.listing_type === "auction") {
    row.start_price = formData.start_price ? parseFloat(formData.start_price) : null;
    row.buy_now_price = formData.buy_now_price ? parseFloat(formData.buy_now_price) : null;
    row.min_price = formData.min_price ? parseFloat(formData.min_price) : null;
    row.auction_duration = formData.auction_duration || null;
    // Bei Update: auction_end nur setzen wenn noch nicht vorhanden
    if (formData.auction_end) {
      row.auction_end = formData.auction_end;
    } else if (formData.auction_duration && !formData.auction_end) {
      const end = new Date();
      end.setDate(end.getDate() + parseInt(formData.auction_duration));
      row.auction_end = end.toISOString();
    }
  } else { row.start_price = null; row.buy_now_price = null; row.min_price = null; row.auction_duration = null; row.auction_end = null; }
  if (formData.listing_type === "rent") {
    row.rent_price = formData.rent_price ? parseFloat(formData.rent_price) : null;
    row.rent_period = formData.rent_period || "day";
    row.deposit_amount = formData.deposit_amount ? parseFloat(formData.deposit_amount) : null;
    row.min_rent_days = formData.min_rent_days ? parseInt(formData.min_rent_days) : null;
    row.max_rent_days = formData.max_rent_days ? parseInt(formData.max_rent_days) : null;
  } else { row.rent_price = null; row.rent_period = null; row.deposit_amount = null; row.min_rent_days = null; row.max_rent_days = null; }

  const { data, error } = await supabase.from("listings").update(row).eq("id", listingId).select().single();
  if (error) throw error;
  return data;
}


export async function updateListingStatus(listingId, status) {
  const updates = { status };
  if (status === "active") updates.published_at = new Date().toISOString();
  const { error } = await supabase.from("listings").update(updates).eq("id", listingId);
  if (error) throw error;
}


export async function deleteListing(listingId) {
  const { error } = await supabase.from("listings").update({ status: "deleted" }).eq("id", listingId);
  if (error) throw error;
}


export async function hardDeleteListing(listingId) {
  const { data: images } = await supabase.from("listing_images").select("id, storage_path").eq("listing_id", listingId);
  if (images?.length) {
    const paths = images.map(i => i.storage_path).filter(Boolean);
    if (paths.length) await supabase.storage.from("listing-images").remove(paths);
    await supabase.from("listing_images").delete().eq("listing_id", listingId);
  }
  const { error } = await supabase.from("listings").delete().eq("id", listingId);
  if (error) throw error;
}


export async function getListing(listingId) {
  const { data, error } = await supabase.from("listings").select("*, listing_images(*)").eq("id", listingId).single();
  if (error) throw error;
  return data;
}


export async function getListingPublic(listingId) {
  const { data, error } = await supabase.from("listings")
    .select("*, category:categories(id, name, slug, parent_id, icon), listing_images(*), seller:profiles!listings_user_id_fkey(id, display_name, avatar_url, created_at, bee_impact_total, bee_level, avg_rating, rating_count)")
    .eq("id", listingId).not("status", "eq", "deleted").single();
  if (error) throw error;

  // Bilder sortieren — DB: sort_order, url (NICHT image_url, position)
  const images = (data?.listing_images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const result = {
    ...data,
    images,                        // sorted images array
    listing_images: images,        // backward compat
    cover_image: images[0]?.url || null,
    categoryName: data.category?.name || null,
    categorySlug: data.category?.slug || null,
    categoryPath: [],
    parentCategoryName: null,
    sellerName: data.seller?.display_name || "Benutzer",
    sellerAvatar: data.seller?.avatar_url || null,
    sellerSince: data.seller?.created_at || null,
    sellerBeeImpact: data.seller?.bee_impact_total || 0,
  };

  // Kategorie-Breadcrumb-Pfad aufbauen (Bottom-up)
  if (data.category?.id) {
    const path = [];
    let currentId = data.category.parent_id;
    const visited = new Set([data.category.id]);
    path.push({ id: data.category.id, name: data.category.name, slug: data.category.slug });
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const { data: parent } = await supabase.from("categories").select("id, name, slug, parent_id").eq("id", currentId).single();
      if (!parent) break;
      path.unshift(parent);
      currentId = parent.parent_id;
    }
    result.categoryPath = path;
  }

  return result;
}


export async function getUserListings(userId) {
  const { data, error } = await supabase.from("listings").select("*, listing_images(*)").eq("user_id", userId).neq("status", "deleted").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(listing => {
    const sorted = (listing.listing_images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return { ...listing, cover_image: sorted[0]?.url || null };
  });
}


export async function searchListings({
  query = "", category_id = null, parent_category_id = null,
  listing_type = null, condition = null,
  min_price = null, max_price = null,
  city = null, canton = null, delivery = null,
  sort = "relevanz", page = 1, per_page = 24,
} = {}) {
  // ── ART-/BEE-/Hex Prefix-Suche (UUID-Range statt text cast) ──
  const upperQ = (query || "").trim().toUpperCase();
  const selectRef = "*, listing_images(*), category:categories(id, name, slug, icon, parent_id), seller:profiles!listings_user_id_fkey(id, display_name, avatar_url, bee_impact_total, bee_level, avg_rating, rating_count)";
  const mapListings = (data) => (data || []).map(listing => {
    const sorted = (listing.listing_images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return { ...listing, cover_image: sorted[0]?.url || null, categoryName: listing.category?.name || null, sellerName: listing.seller?.display_name || "Benutzer" };
  });
  // UUID prefix → range query (first 8 chars = first UUID group)
  const uuidRange = (prefix) => ({
    gte: `${prefix}-0000-0000-0000-000000000000`,
    lte: `${prefix}-ffff-ffff-ffff-ffffffffffff`,
  });

  if (upperQ.startsWith("ART-")) {
    const idPrefix = upperQ.replace("ART-", "").toLowerCase();
    const range = uuidRange(idPrefix);
    const { data, count } = await supabase.from("listings")
      .select(selectRef, { count: "exact" })
      .gte("id", range.gte).lte("id", range.lte);
    return { listings: mapListings(data), total: count || 0, page: 1, per_page, total_pages: 1 };
  }
  if (upperQ.startsWith("BEE-")) {
    const idPrefix = upperQ.replace("BEE-", "").toLowerCase();
    const range = uuidRange(idPrefix);
    const { data: purchases } = await supabase.from("purchases").select("listing_id").gte("id", range.gte).lte("id", range.lte);
    const listingIds = (purchases || []).map(p => p.listing_id).filter(Boolean);
    if (listingIds.length > 0) {
      const { data, count } = await supabase.from("listings").select(selectRef, { count: "exact" }).in("id", listingIds);
      return { listings: mapListings(data), total: count || 0, page: 1, per_page, total_pages: 1 };
    }
    return { listings: [], total: 0, page: 1, per_page, total_pages: 0 };
  }
  // ── Nackte Hex-Nummer (8 Zeichen, z.B. "D6A6D640") ──
  const hexQ = (query || "").trim();
  if (/^[0-9a-fA-F]{8}$/i.test(hexQ)) {
    const idPrefix = hexQ.toLowerCase();
    const range = uuidRange(idPrefix);
    // Try as listing ID first
    const { data: listingData, count: listingCount } = await supabase.from("listings")
      .select(selectRef, { count: "exact" }).gte("id", range.gte).lte("id", range.lte);
    if (listingData && listingData.length > 0) {
      return { listings: mapListings(listingData), total: listingCount || 0, page: 1, per_page, total_pages: 1 };
    }
    // Fallback: try as purchase ID
    const { data: purchases } = await supabase.from("purchases").select("listing_id").gte("id", range.gte).lte("id", range.lte);
    const listingIds = (purchases || []).map(p => p.listing_id).filter(Boolean);
    if (listingIds.length > 0) {
      const { data, count } = await supabase.from("listings").select(selectRef, { count: "exact" }).in("id", listingIds);
      return { listings: mapListings(data), total: count || 0, page: 1, per_page, total_pages: 1 };
    }
  }

  let q = supabase.from("listings")
    .select("*, listing_images(*), category:categories(id, name, slug, icon, parent_id), seller:profiles!listings_user_id_fkey(id, display_name, avatar_url, bee_impact_total, bee_level, avg_rating, rating_count)", { count: "exact" })
    .eq("status", "active");

  if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);

  // Kategorie: Entweder direkte ID oder alle Kinder einer Eltern-Kategorie (rekursiv)
  if (category_id) {
    // Auch hier: alle Unterkategorien dieser Kategorie einschliessen
    const { data: allCats } = await supabase.from("categories").select("id, parent_id");
    const descendants = [category_id];
    const findChildren = (parentId) => {
      (allCats || []).filter(c => c.parent_id === parentId).forEach(c => {
        descendants.push(c.id);
        findChildren(c.id);
      });
    };
    findChildren(category_id);
    q = q.in("category_id", descendants);
  } else if (parent_category_id) {
    // Finde ALLE Unterkategorien rekursiv
    const { data: allCats } = await supabase.from("categories").select("id, parent_id");
    const descendants = [parent_category_id];
    const findChildren = (parentId) => {
      (allCats || []).filter(c => c.parent_id === parentId).forEach(c => {
        descendants.push(c.id);
        findChildren(c.id);
      });
    };
    findChildren(parent_category_id);
    q = q.in("category_id", descendants);
  }

  if (listing_type) q = q.eq("listing_type", listing_type);
  if (condition) q = q.eq("condition", condition);
  if (min_price !== null && min_price !== "") q = q.gte("price", parseFloat(min_price));
  if (max_price !== null && max_price !== "") q = q.lte("price", parseFloat(max_price));
  if (city) q = q.ilike("city", `%${city}%`);
  if (canton) q = q.eq("canton", canton);
  if (delivery === "shipping") q = q.eq("shipping_available", true);
  if (delivery === "pickup") q = q.eq("pickup_only", true);

  switch (sort) {
    case "relevanz":   q = q.order("fee_percentage", { ascending: false }).order("created_at", { ascending: false }); break;
    case "price_asc":  q = q.order("price", { ascending: true, nullsFirst: false }); break;
    case "price_desc": q = q.order("price", { ascending: false }); break;
    case "oldest":     q = q.order("created_at", { ascending: true }); break;
    case "endet_bald": q = q.order("auction_end", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false }); break;
    case "meiste_gebote": q = q.order("bid_count", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }); break;
    default:           q = q.order("created_at", { ascending: false }); break;
  }

  const from = (page - 1) * per_page;
  q = q.range(from, from + per_page - 1);

  const { data, error, count } = await q;
  if (error) throw error;

  const listings = (data || []).map(listing => {
    const sorted = (listing.listing_images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return {
      ...listing,
      cover_image: sorted[0]?.url || null,
      categoryName: listing.category?.name || null,
      sellerName: listing.seller?.display_name || "Benutzer",
    };
  });

  return { listings, total: count || 0, page, per_page, total_pages: Math.ceil((count || 0) / per_page) };
}


export async function uploadListingImages(listingId, files) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const fileObj = files[i];
    const file = fileObj.file;
    const sortOrder = fileObj.sortOrder ?? i;
    const isCover = sortOrder === 0;
    const ext = file.name.split(".").pop();
    const path = `${listingId}/${Date.now()}_${i}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("listing-images").upload(path, file, { upsert: false });
    if (uploadErr) { console.error("Upload error:", uploadErr); continue; }

    const { data: { publicUrl } } = supabase.storage.from("listing-images").getPublicUrl(path);

    const { data, error: dbErr } = await supabase.from("listing_images")
      .insert({ listing_id: listingId, url: publicUrl, storage_path: path, sort_order: sortOrder, is_cover: isCover })
      .select().single();
    if (dbErr) { console.error("DB error:", dbErr); continue; }
    results.push(data);
  }
  return results;
}


export async function deleteListingImage(imageId, storagePath) {
  if (storagePath) await supabase.storage.from("listing-images").remove([storagePath]);
  const { error } = await supabase.from("listing_images").delete().eq("id", imageId);
  if (error) throw error;
}


export async function getListingStats(listingId) {
  const { data, error } = await supabase.from("listings").select("view_count, favorite_count").eq("id", listingId).single();
  if (error) return { views: 0, favorites: 0 };
  return { views: data.view_count || 0, favorites: data.favorite_count || 0 };
}
