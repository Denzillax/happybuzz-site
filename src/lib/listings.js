import { supabase } from "@/lib/supabase/supabase";
import { createNotification } from "@/lib/notifications";
import { DEFAULT_FEE_PERCENT, DEFAULT_FEE_TIER } from "@/lib/constants";
import { calcFee, calcBeeImpact } from "@/lib/fees";

// ─── Slug ────────────────────────────────────────────────────
function slugify(text) {
  return text.toString().toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    .substring(0, 80);
}

// ─── Fee Config ──────────────────────────────────────────────
// FEE_TIERS und BEE_IMPACT_RATE leben in @/lib/constants (eine Quelle der
// Wahrheit). Die frueheren Duplikate hier waren tot und drohten zu driften.

// ─── Profile Completeness Check ──────────────────────────────
// Returns { complete: boolean, missing: string[], redirect: string }
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

// ─── Categories ──────────────────────────────────────────────
export async function getCategories() {
  // Picker/Filter: deaktivierte Kategorien ausblenden (bestehende Inserate
  // behalten ihre Kategorie, nur Neuauswahl ist gesperrt)
  const { data, error } = await supabase
    .from("categories").select("*")
    .neq("is_active", false)
    .order("sort_order");
  if (error) throw error;
  return data || [];
}

// ─── Create Listing ──────────────────────────────────────────
// listing_type ENUM: sell, auction, rent, free
// condition ENUM condition_type: new, like_new, good, fair, poor
// listing_images: url (NICHT image_url), sort_order (NICHT position)
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
    fee_tier: formData.fee_tier || DEFAULT_FEE_TIER,
  };

  if (formData.listing_type === "auction") {
    row.start_price = formData.start_price ? parseFloat(formData.start_price) : null;
    row.buy_now_price = formData.buy_now_price ? parseFloat(formData.buy_now_price) : null;
    row.min_price = formData.min_price ? parseFloat(formData.min_price) : null;
    row.auction_duration = formData.auction_duration || null;
    row.auction_end = formData.auction_end || null;
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
  // XP/Achievements werden serverseitig per DB-Trigger vergeben (bei Publish → active).
  return data;
}

// ─── Update Listing ──────────────────────────────────────────
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
    fee_tier: formData.fee_tier || DEFAULT_FEE_TIER,
  };
  if (formData.listing_type === "auction") {
    row.start_price = formData.start_price ? parseFloat(formData.start_price) : null;
    row.buy_now_price = formData.buy_now_price ? parseFloat(formData.buy_now_price) : null;
    row.min_price = formData.min_price ? parseFloat(formData.min_price) : null;
    row.auction_duration = formData.auction_duration || null;
    row.auction_end = formData.auction_end || null;
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

// ─── Update Status ───────────────────────────────────────────
export async function updateListingStatus(listingId, status) {
  const updates = { status };
  if (status === "active") updates.published_at = new Date().toISOString();
  const { error } = await supabase.from("listings").update(updates).eq("id", listingId);
  if (error) throw error;
}

// ─── Freigabe-Queue ──────────────────────────────────────────
// Inserat zur Admin-Freigabe einreichen (statt direkt active).
export async function submitForReview(listingId) {
  const { error } = await supabase
    .from("listings")
    .update({ status: "pending_review", submitted_at: new Date().toISOString() })
    .eq("id", listingId);
  if (error) throw error;
}

// Admin: Inserat freigeben / ablehnen (RPC umgeht owner-RLS).
export async function reviewListing(listingId, decision, reason = null) {
  const { data, error } = await supabase.rpc("admin_review_listing", {
    p_listing_id: listingId, p_decision: decision, p_reason: reason,
  });
  if (error) throw error;
  return data;
}

// ─── Laufzeit verlängern ─────────────────────────────────────
// Setzt expires_at auf 60 Tage ab jetzt und reaktiviert abgelaufene Inserate.
export async function renewListing(listingId) {
  const expires = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("listings")
    .update({ expires_at: expires, status: "active" })
    .eq("id", listingId);
  if (error) throw error;
  return expires;
}

// ─── Soft Delete ─────────────────────────────────────────────
// Setzt status auf 'deleted' statt echtem Löschen — Daten bleiben erhalten
export async function deleteListing(listingId) {
  const { error } = await supabase.from("listings").update({ status: "deleted" }).eq("id", listingId);
  if (error) throw error;
}

// Hard Delete — nur für Admin oder endgültige Bereinigung
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

// ─── Get Single (owner) ─────────────────────────────────────
export async function getListing(listingId) {
  const { data, error } = await supabase.from("listings").select("*, listing_images(*)").eq("id", listingId).single();
  if (error) throw error;
  return data;
}

// ─── Get Single (public + seller) ────────────────────────────
export async function getListingPublic(listingId) {
  const { data, error } = await supabase.from("listings")
    .select("*, category:categories(id, name, slug, parent_id, icon), listing_images(*), seller:profiles!listings_user_id_fkey(id, display_name, avatar_url, created_at, account_type, company_name, bee_impact_total, bee_level, xp_total, avg_rating, rating_count, is_verified, id_verified)")
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
    sellerXp: data.seller?.xp_total || 0,
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

// ─── Get User's Listings ─────────────────────────────────────
export async function getUserListings(userId) {
  const { data, error } = await supabase.from("listings").select("*, listing_images(*)").eq("user_id", userId).neq("status", "deleted").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(listing => {
    const sorted = (listing.listing_images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return { ...listing, cover_image: sorted[0]?.url || null };
  });
}

// ─── Search Listings ─────────────────────────────────────────
export async function searchListings({
  query = "", category_id = null, parent_category_id = null,
  listing_type = null, condition = null,
  min_price = null, max_price = null,
  city = null, canton = null, delivery = null,
  verified_only = false,
  sort = "relevanz", page = 1, per_page = 24,
} = {}) {
  // ── ART-/BEE-/Hex Prefix-Suche (UUID-Range statt text cast) ──
  const upperQ = (query || "").trim().toUpperCase();
  const selectRef = "*, listing_images(*), category:categories(id, name, slug, icon, parent_id), seller:profiles!listings_user_id_fkey(id, display_name, avatar_url, account_type, company_name, bee_impact_total, bee_level, avg_rating, rating_count, is_verified, id_verified)";
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
      .gte("id", range.gte).lte("id", range.lte)
      .neq("status", "deleted");
    return { listings: mapListings(data), total: count || 0, page: 1, per_page, total_pages: 1 };
  }
  if (upperQ.startsWith("BEE-")) {
    const idPrefix = upperQ.replace("BEE-", "").toLowerCase();
    const range = uuidRange(idPrefix);
    const { data: purchases } = await supabase.from("purchases").select("listing_id").gte("id", range.gte).lte("id", range.lte);
    const listingIds = (purchases || []).map(p => p.listing_id).filter(Boolean);
    if (listingIds.length > 0) {
      const { data, count } = await supabase.from("listings").select(selectRef, { count: "exact" }).in("id", listingIds).neq("status", "deleted");
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
      .select(selectRef, { count: "exact" }).gte("id", range.gte).lte("id", range.lte).neq("status", "deleted");
    if (listingData && listingData.length > 0) {
      return { listings: mapListings(listingData), total: listingCount || 0, page: 1, per_page, total_pages: 1 };
    }
    // Fallback: try as purchase ID
    const { data: purchases } = await supabase.from("purchases").select("listing_id").gte("id", range.gte).lte("id", range.lte);
    const listingIds = (purchases || []).map(p => p.listing_id).filter(Boolean);
    if (listingIds.length > 0) {
      const { data, count } = await supabase.from("listings").select(selectRef, { count: "exact" }).in("id", listingIds).neq("status", "deleted");
      return { listings: mapListings(data), total: count || 0, page: 1, per_page, total_pages: 1 };
    }
  }

  let q = supabase.from("listings")
    .select("*, listing_images(*), category:categories(id, name, slug, icon, parent_id), seller:profiles!listings_user_id_fkey(id, display_name, avatar_url, account_type, company_name, bee_impact_total, bee_level, avg_rating, rating_count, is_verified, id_verified)", { count: "exact" })
    .eq("status", "active");

  // Abgelaufene Inserate ausblenden (expires_at überschritten, Status noch nicht umgestellt)
  q = q.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

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

  // Nur verifizierte Verkäufer (E-Mail + Ausweis geprüft) — zweistufig,
  // da PostgREST auf eingebettete Relationen nicht zuverlässig filtert.
  if (verified_only) {
    const { data: vids } = await supabase.from("profiles").select("id").eq("is_verified", true).eq("id_verified", true);
    q = q.in("user_id", (vids || []).map(v => v.id));
  }

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

// ─── Upload Images ───────────────────────────────────────────
// listing_images: url (NICHT image_url), sort_order (NICHT position)
export const ALLOWED_IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB pro Bild

export async function uploadListingImages(listingId, files) {
  // Validierung VOR dem Upload: keine Teil-Uploads bei ungültigen Dateien
  for (const fileObj of files) {
    const f = fileObj.file;
    const fext = (f.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_IMAGE_EXT.includes(fext) || !(f.type || "").startsWith("image/")) {
      throw new Error(`"${f.name}" ist kein unterstütztes Bildformat (JPG, PNG, WEBP oder GIF).`);
    }
    if (f.size > MAX_IMAGE_BYTES) {
      throw new Error(`"${f.name}" ist zu gross (max. 5 MB pro Bild).`);
    }
  }

  const results = [];
  for (let i = 0; i < files.length; i++) {
    const fileObj = files[i];
    const file = fileObj.file;
    const sortOrder = fileObj.sortOrder ?? i;
    const isCover = sortOrder === 0;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
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

// ─── Favorites ───────────────────────────────────────────────
// favorites: user_id + listing_id (composite PK, KEIN id-Feld)
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
    .select("listing_id, listing:listings(*, listing_images(*), seller:profiles!listings_user_id_fkey(id, display_name, avatar_url, account_type, company_name, bee_impact_total, bee_level, avg_rating, rating_count, is_verified, id_verified))")
    .eq("user_id", userId);
  if (error) throw error;
  return (data || []).map(fav => {
    if (!fav.listing) return null;
    const sorted = (fav.listing.listing_images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return { ...fav.listing, cover_image: sorted[0]?.url || null, sellerName: fav.listing.seller?.display_name || "Benutzer" };
  }).filter(Boolean);
}

// Beide Namen exportieren — Detailseite importiert isListingFavorited
export async function isFavorited(userId, listingId) {
  const { data } = await supabase.from("favorites").select("user_id").eq("user_id", userId).eq("listing_id", listingId).maybeSingle();
  return !!data;
}
export const isListingFavorited = isFavorited;


// ─── View Count ──────────────────────────────────────────────
// WICHTIG: Die RPC-Funktion increment_view_count muss in Supabase
// mit SECURITY DEFINER erstellt sein, damit auch anonyme User zählen.
// SQL siehe PROJECT.md oder unten.
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

// ─── Get Listing Stats ──────────────────────────────────────
export async function getListingStats(listingId) {
  const { data, error } = await supabase.from("listings").select("view_count, favorite_count").eq("id", listingId).single();
  if (error) return { views: 0, favorites: 0 };
  return { views: data.view_count || 0, favorites: data.favorite_count || 0 };
}

// ═════════════════════════════════════════════════════════════
// PURCHASES (Phase 5 — Sofortkauf)
// ═════════════════════════════════════════════════════════════

// Sofortkauf via RPC (atomar: purchase + listing → sold)
export async function createPurchase(buyerId, listingId) {
  const { data, error } = await supabase.rpc("create_purchase", {
    p_listing_id: listingId,
    p_buyer_id: buyerId,
  });
  if (error) throw new Error(error.message);
  return data; // purchase ID
}

// Meine Käufe laden (als Käufer)
// Kauf mit vereinbartem Preis (akzeptierter Preisvorschlag).
export async function createPurchaseAtPrice(buyerId, listingId, price) {
  const { data, error } = await supabase.rpc("create_purchase", {
    p_listing_id: listingId, p_buyer_id: buyerId, p_price: price,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function getMyPurchases(userId) {
  const { data, error } = await supabase
    .from("purchases")
    .select(`
      *,
      listing:listings (
        id, title, price, listing_type, slug,
        listing_images ( url, sort_order ),
        profiles!listings_user_id_fkey ( display_name, avatar_url, bee_impact_total, bee_level )
      )
    `)
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((p) => ({
    ...p,
    listingTitle: p.listing?.title || "–",
    listingImage: p.listing?.listing_images?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))?.[0]?.url || null,
    sellerName: p.listing?.profiles?.display_name || "Verkäufer",
  }));
}

// Meine Verkäufe laden (als Verkäufer)
export async function getMySales(userId) {
  const { data, error } = await supabase
    .from("purchases")
    .select(`
      *,
      listing:listings (
        id, title, price, listing_type, slug,
        listing_images ( url, sort_order )
      )
    `)
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Buyer-Profile separat laden (kein FK von purchases → profiles)
  const buyerIds = [...new Set(data.map((p) => p.buyer_id))];
  const { data: buyers } = buyerIds.length
    ? await supabase.from("profiles").select("id, display_name, bee_impact_total, bee_level").in("id", buyerIds)
    : { data: [] };
  const buyerMap = Object.fromEntries((buyers || []).map((b) => [b.id, b]));

  return (data || []).map((p) => ({
    ...p,
    listingTitle: p.listing?.title || "–",
    listingImage: p.listing?.listing_images?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))?.[0]?.url || null,
    buyerName: buyerMap[p.buyer_id]?.display_name || "Käufer",
  }));
}

// Purchase Details (einzeln)
export async function getPurchase(purchaseId) {
  const { data, error } = await supabase
    .from("purchases")
    .select(`
      *,
      listing:listings ( id, title, price, listing_type, city, canton, shipping_available, pickup_only )
    `)
    .eq("id", purchaseId)
    .single();
  if (error) throw error;

  // Seller + Buyer Profile separat laden
  const ids = [data.seller_id, data.buyer_id].filter(Boolean);
  const { data: profiles } = await supabase.from("profiles").select("id, display_name, bee_impact_total, bee_level").in("id", ids);
  const pMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  return {
    ...data,
    sellerName: pMap[data.seller_id]?.display_name || "Verkäufer",
    buyerName: pMap[data.buyer_id]?.display_name || "Käufer",
  };
}

// ═════════════════════════════════════════════════════════════
// ORDER MANAGEMENT (Phase 5b)
// ═════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════
// BEE-IMPACT GAMIFICATION
// ═════════════════════════════════════════════════════════════

// Impact-Summe + Anzahl geretteter Artikel (fuer die Homepage-Section).
export async function getCommunityImpactStats() {
  const { data, error } = await supabase.rpc("get_community_impact_stats");
  if (error) return { impact: 0, unterwegs: 0, articles: 0 };
  return data || { impact: 0, unterwegs: 0, articles: 0 };
}

// Mein Impact-Profil laden
export async function getMyBeeProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("bee_impact_total, bee_level, display_name, avatar_url")
    .eq("id", userId)
    .single();
  if (error) return { bee_impact_total: 0, bee_level: "starter" };
  return data;
}

// ═════════════════════════════════════════════════════════════
// PUBLIC PROFILE
// ═════════════════════════════════════════════════════════════

// Öffentliches Profil laden
export async function getPublicProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, bio, city, canton, created_at, account_type, company_name, bee_impact_total, blueten, bee_level, xp_total, is_verified, id_verified")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

// Aktive Inserate eines Users laden (öffentlich)
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

// Bewertungen für einen User laden (öffentlich)
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

// Durchschnittsbewertung berechnen
export async function getUserAvgRating(userId) {
  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("rated_id", userId);
  if (error || !data?.length) return { avg: 0, count: 0 };
  const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
  return { avg: Math.round(avg * 10) / 10, count: data.length };
}

// ─── Favorite Sellers ────────────────────────────────────────
export async function isSellerFavorited(userId, sellerId) {
  if (!userId || !sellerId) return false;
  const { data } = await supabase
    .from("favorite_sellers")
    .select("seller_id")
    .eq("user_id", userId)
    .eq("seller_id", sellerId)
    .maybeSingle();
  return !!data;
}

// Toggle: gibt true zurück wenn jetzt favorisiert, false wenn entfernt
export async function toggleFavoriteSeller(userId, sellerId) {
  if (!userId || !sellerId) return false;
  const favorited = await isSellerFavorited(userId, sellerId);
  if (favorited) {
    await supabase.from("favorite_sellers").delete().eq("user_id", userId).eq("seller_id", sellerId);
    return false;
  }
  await supabase.from("favorite_sellers").insert({ user_id: userId, seller_id: sellerId });
  return true;
}

// ─── Inserat-Aufruf protokollieren + Auswertung (Owner) ──────
export async function logListingView(listingId, source = "direct") {
  try { await supabase.from("listing_views").insert({ listing_id: listingId, source }); } catch {}
}
export async function getListingAnalytics(listingId) {
  const { data, error } = await supabase.rpc("get_listing_analytics", { p_listing_id: listingId });
  if (error) { console.error("get_listing_analytics:", error); return null; }
  return data;
}

// ─── Aggregierte Verkäufer-Statistiken (RPC) ─────────────────
export async function getSellerStats(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.rpc("get_seller_stats", { p_uid: userId });
  if (error) { console.error("get_seller_stats:", error); return null; }
  return data;
}

// ─── Private Verkäufer-Notizen ───────────────────────────────
export async function getUserNote(noterId, notedId) {
  if (!noterId || !notedId) return "";
  const { data } = await supabase
    .from("user_notes")
    .select("text")
    .eq("noter_id", noterId)
    .eq("noted_id", notedId)
    .maybeSingle();
  return data?.text || "";
}

export async function saveUserNote(noterId, notedId, text) {
  if (!noterId || !notedId) return;
  const trimmed = (text || "").trim();
  if (!trimmed) {
    await supabase.from("user_notes").delete().eq("noter_id", noterId).eq("noted_id", notedId);
    return;
  }
  const { error } = await supabase
    .from("user_notes")
    .upsert({ noter_id: noterId, noted_id: notedId, text: trimmed, updated_at: new Date().toISOString() }, { onConflict: "noter_id,noted_id" });
  if (error) throw error;
}

// ═════════════════════════════════════════════════════════════
// CATEGORIES
// ═════════════════════════════════════════════════════════════

// Alle Kategorien laden (mit Hierarchie)
export async function getAllCategories() {
  // MegaMenu: nur aktive Kategorien anzeigen
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, parent_id, sort_order")
    .neq("is_active", false)
    .order("sort_order");
  if (error) return [];
  return data || [];
}

// Subcategories für eine Hauptkategorie
export async function getSubcategories(parentId) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, parent_id, sort_order")
    .eq("parent_id", parentId)
    .order("sort_order");
  if (error) return [];
  return data || [];
}

// Kategorie-Suchvorschläge (für Autocomplete)
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

// Breadcrumb-Pfad für eine Kategorie (Bottom-up)
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

// Ähnliche Artikel laden (gleiche Kategorie, Fallback auf Parent)
export async function getSimilarListings(listingId, categoryId, limit = 6) {
  if (!categoryId) return [];

  // Erst gleiche Kategorie versuchen
  let { data, error } = await supabase
    .from("listings")
    .select("*, listing_images(*), seller:profiles!listings_user_id_fkey(id, display_name, avatar_url, account_type, company_name, bee_impact_total, bee_level, avg_rating, rating_count, is_verified, id_verified)")
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
        .select("*, listing_images(*), seller:profiles!listings_user_id_fkey(id, display_name, avatar_url, account_type, company_name, bee_impact_total, bee_level, avg_rating, rating_count, is_verified, id_verified)")
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

// ═════════════════════════════════════════════════════════════
// PHASE 8: CHAT/MESSAGING
// ═════════════════════════════════════════════════════════════

export async function getOrCreateConversation(listingId, buyerId, sellerId) {
  const { data, error } = await supabase.rpc("get_or_create_conversation", {
    p_listing_id: listingId, p_buyer_id: buyerId, p_seller_id: sellerId
  });
  if (error) throw error;
  return data;
}

export async function getMyConversations(userId) {
  // Messages verschachtelt laden (vorher 2 Queries pro Conversation -> N+1).
  // Unread-Status + letzte Nachricht werden in JS abgeleitet.
  const { data, error } = await supabase
    .from("conversations")
    .select("*, listing:listings(id, title, listing_images(*)), buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url), seller:profiles!conversations_seller_id_fkey(id, display_name, avatar_url), messages(content, sender_id, is_read, created_at)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });
  if (error) return [];

  return (data || []).map((c) => {
    const msgs = c.messages || [];
    let last = null;
    for (const m of msgs) { if (!last || new Date(m.created_at) > new Date(last.created_at)) last = m; }
    const hasUnread = msgs.some((m) => m.sender_id !== userId && !m.is_read);
    const imgs = (c.listing?.listing_images || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return {
      ...c,
      listingTitle: c.listing?.title || "Gelöschtes Inserat",
      listingImage: imgs[0]?.url || null,
      otherUser: c.buyer_id === userId ? c.seller : c.buyer,
      hasUnread,
      lastMessagePreview: last?.content || "",
    };
  });
}

export async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function sendMessage(conversationId, senderId, content, opts = {}) {
  const row = { conversation_id: conversationId, sender_id: senderId, content };
  if (opts.imageUrl) { row.image_url = opts.imageUrl; row.message_type = "image"; }
  if (opts.messageType) row.message_type = opts.messageType;
  if (opts.offerAmount != null) row.offer_amount = opts.offerAmount;
  const { data, error } = await supabase
    .from("messages")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
  return data;
}

// Chat-Bild hochladen (nutzt den listing-images Bucket unter chat/<conv>/).
export async function uploadChatImage(conversationId, file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `chat/${conversationId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("listing-images").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from("listing-images").getPublicUrl(path);
  return publicUrl;
}

export async function markMessagesRead(conversationId, userId) {
  await supabase.from("messages").update({ is_read: true })
    .eq("conversation_id", conversationId).neq("sender_id", userId).eq("is_read", false);
  // Header-Badge sofort aktualisieren
  if (typeof window !== "undefined") window.dispatchEvent(new Event("beedaro:messages-read"));
}

export async function getUnreadCount(userId) {
  const { data, error } = await supabase.rpc("get_unread_count_for_user", { p_user_id: userId });
  if (error) return 0;
  return data || 0;
}

// ═════════════════════════════════════════════════════════════
// PHASE 6: AUKTIONEN
// ═════════════════════════════════════════════════════════════

// Erhöhungsschritte + Gebotsverlauf leben serverseitig in der proxy_bid-RPC
// (bid_increment SQL-Funktion) — hier gibt es keine Bietlogik mehr.

// Entthronten Bieter benachrichtigen (Einstellung: buy_outbid). Fire-and-forget.
function notifyOutbid(outbidUserId, newBidderId, listingId, title, amount) {
  if (!outbidUserId || outbidUserId === newBidderId) return;
  createNotification(outbidUserId, "bid", "Du wurdest überboten",
    `Bei "${title || "einem Inserat"}" liegt das Höchstgebot jetzt bei CHF ${Number(amount).toFixed(2)}.`,
    `/listing/${listingId}`, "buy_outbid").catch(() => {});
}

export async function placeBid(listingId, bidderId, maxAmount) {
  // ── PROXY BIDDING (Ricardo-Style) — läuft komplett serverseitig ──
  // Die proxy_bid-RPC (SECURITY DEFINER) prüft Identität via auth.uid(),
  // sperrt das Inserat (keine Races), führt Auto-Bid/Preis/Verlauf/Timer-
  // Verlängerung atomar aus. maxAmount = geheimes Preislimit des Bieters.
  const { data, error } = await supabase.rpc("proxy_bid", {
    p_listing_id: listingId,
    p_max_amount: maxAmount,
  });
  if (error) throw new Error(error.message);

  // Entthronten Bieter benachrichtigen (Kanal-Einstellungen in notifications.js)
  if (data?.outbid_user_id) {
    notifyOutbid(data.outbid_user_id, bidderId, listingId, data.listing_title, Number(data.display_price));
  }

  return {
    displayPrice: Number(data.display_price),
    isTopBidder: !!data.is_top_bidder,
    message: data.message || "",
  };
}

// ─── Auktion abschliessen (wird beim Laden der Seite geprüft) ──
export async function finalizeAuction(listingId) {
  // 1. Listing prüfen
  const { data: listing } = await supabase.from("listings")
    .select("id, user_id, title, listing_type, status, auction_end, price, start_price, fee_percentage")
    .eq("id", listingId)
    .single();

  if (!listing) return null;
  if (listing.listing_type !== "auction") return null;
  if (listing.status !== "active") return null;
  if (!listing.auction_end) return null;

  const now = new Date();
  const endTime = new Date(listing.auction_end);
  if (now < endTime) return null; // Noch nicht abgelaufen

  // Check if purchase already exists (prevent duplicates)
  const { data: existingPurchase } = await supabase.from("purchases")
    .select("id").eq("listing_id", listingId).limit(1).maybeSingle();
  if (existingPurchase) return { status: "already_sold", purchaseId: existingPurchase.id };

  // 2. Höchstes Gebot finden (public_bids: öffentliche Sicht ohne max_amount)
  const { data: topBid } = await supabase.from("public_bids")
    .select("bidder_id, amount")
    .eq("listing_id", listingId)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!topBid) {
    // Keine Gebote → Auktion abgelaufen ohne Verkauf
    await supabase.from("listings").update({ status: "expired" }).eq("id", listingId);
    return { status: "expired", winner: null };
  }

  // 3. Purchase erstellen
  const finalPrice = topBid.amount;
  const feePct = listing.fee_percentage || DEFAULT_FEE_PERCENT;
  const feeAmount = calcFee(finalPrice, feePct);   // beachtet die Bagatellgrenze
  const platformFee = feeAmount * 0.8;
  const beeImpact = calcBeeImpact(feeAmount);

  const { data: purchase, error: purchErr } = await supabase.from("purchases").insert({
    listing_id: listingId,
    buyer_id: topBid.bidder_id,
    seller_id: listing.user_id,
    price: finalPrice,
    fee_percentage: feePct,
    fee_amount: feeAmount,
    platform_fee: platformFee,
    bee_impact: beeImpact,
    status: "confirmed",
  }).select().single();

  if (purchErr) {
    console.error("Purchase creation failed:", purchErr);
    return { status: "error", error: purchErr.message };
  }

  // 4. Listing auf sold setzen + finalen Preis
  await supabase.from("listings").update({
    status: "sold",
    price: finalPrice,
  }).eq("id", listingId);

  // 5. Gewinner + Verkäufer benachrichtigen (Parität zur Cron-Finalisierung)
  try {
    const priceTxt = `CHF ${Number(finalPrice).toFixed(2)}`;
    await createNotification(topBid.bidder_id, "purchase", "Auktion gewonnen", `"${listing.title}" für ${priceTxt}. Jetzt bezahlen.`, `/order/${purchase.id}`);
    await createNotification(listing.user_id, "purchase", "Auktion verkauft", `"${listing.title}" für ${priceTxt} verkauft.`, `/order/${purchase.id}`);
  } catch (e) { console.error("Auktions-Benachrichtigung:", e); }

  return {
    status: "sold",
    winner: topBid.bidder_id,
    price: finalPrice,
    purchaseId: purchase.id,
  };
}

// ─── Eigenes Preislimit für ein Inserat abrufen ──
export async function getMyBid(listingId, userId) {
  if (!userId) return null;
  const { data } = await supabase.from("bids")
    .select("id, amount, max_amount, created_at")
    .eq("listing_id", listingId)
    .eq("bidder_id", userId)
    .maybeSingle();
  return data;
}

// ─── Preislimit senken (Validierung + Schreiben serverseitig in der RPC) ──
export async function adjustPreislimit(listingId, userId, newMax) {
  if (!userId) throw new Error("Nicht eingeloggt");
  const { data, error } = await supabase.rpc("set_bid_limit_down", {
    p_listing_id: listingId, p_new_max: newMax,
  });
  if (error) throw new Error(error.message);
  return { newMax: Number(data.new_max), amount: Number(data.amount) };
}

// ─── Preislimit entfernen (= auf aktuelles Gebot setzen, NICHT löschen) ──
export async function removePreislimit(listingId, userId) {
  if (!userId) throw new Error("Nicht eingeloggt");
  const myBid = await getMyBid(listingId, userId);
  if (!myBid) throw new Error("Du hast noch kein Gebot abgegeben");
  if (myBid.max_amount === myBid.amount) return { amount: myBid.amount }; // nichts zu tun
  const { error } = await supabase.rpc("set_bid_limit_down", {
    p_listing_id: listingId, p_new_max: myBid.amount,
  });
  if (error) throw new Error(error.message);
  return { amount: myBid.amount };
}

export async function getBids(listingId) {
  // Öffentliche Gebotsliste via View (ohne geheimes max_amount)
  const { data, error } = await supabase
    .from("public_bids")
    .select("id, listing_id, bidder_id, amount, created_at, bidder_name")
    .eq("listing_id", listingId)
    .order("amount", { ascending: false })
    .limit(20);
  if (error) return [];
  // Shape kompatibel zu bisherigen Aufrufern (b.bidder.display_name)
  return (data || []).map((b) => ({
    ...b,
    bidder: { id: b.bidder_id, display_name: b.bidder_name },
  }));
}

// ═════════════════════════════════════════════════════════════
// ORDER FLOW — Bestellablauf nach Kauf
// ═════════════════════════════════════════════════════════════

export async function getPurchaseDetail(purchaseId) {
  const { data, error } = await supabase.from("purchases")
    .select(`*, listing:listings(id, title, price, listing_type, rent_price, rent_period, deposit_amount, shipping_available, pickup_only, shipping_method, shipping_cost, free_shipping, ship_speed, listing_images(url, sort_order))`)
    .eq("id", purchaseId)
    .single();
  if (error) throw error;

  // Load buyer + seller profiles separately (FK points to auth.users, not profiles)
  // Use select("*") to get all available fields without breaking on missing columns
  const [{ data: buyer }, { data: seller }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", data.buyer_id).maybeSingle(),
    supabase.from("profiles").select("*").eq("id", data.seller_id).maybeSingle(),
  ]);

  return { ...data, buyer, seller };
}

export async function getPurchaseByListing(listingId) {
  const { data } = await supabase.from("purchases")
    .select("id, status")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getPurchaseEvents(purchaseId) {
  const { data } = await supabase.from("purchase_events")
    .select("*")
    .eq("purchase_id", purchaseId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function addPurchaseEvent(purchaseId, eventType, message, trackingNumber, userId) {
  const { error } = await supabase.from("purchase_events").insert({
    purchase_id: purchaseId,
    event_type: eventType,
    message: message || null,
    tracking_number: trackingNumber || null,
    created_by: userId,
  });
  if (error) throw error;
}

export async function updatePurchaseStatus(purchaseId, newStatus) {
  const { error } = await supabase.from("purchases")
    .update({ status: newStatus })
    .eq("id", purchaseId);
  if (error) throw error;
}

// Käufer: "Ich habe bezahlt"
export async function markAsPaid(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "payment_marked");
  await addPurchaseEvent(purchaseId, "payment_marked", "Käufer hat die Zahlung als erledigt markiert.", null, userId);
  try {
    const { data: p } = await supabase.from("purchases").select("seller_id, listing:listings(title)").eq("id", purchaseId).maybeSingle();
    if (p) await createNotification(p.seller_id, "purchase", "Zahlung markiert", `Zahlung für "${p.listing?.title}" wurde als erledigt markiert. Bitte prüfen.`, `/order/${purchaseId}`);
  } catch (e) { console.error("Notification:", e); }
}

// Verkäufer: "Zahlung erhalten"
export async function confirmPayment(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "paid");
  await addPurchaseEvent(purchaseId, "payment_confirmed", "Verkäufer hat den Zahlungseingang bestätigt.", null, userId);
  try {
    const { data: p } = await supabase.from("purchases").select("buyer_id, listing:listings(title)").eq("id", purchaseId).maybeSingle();
    if (p) await createNotification(p.buyer_id, "purchase", "Zahlung bestätigt", `Deine Zahlung für "${p.listing?.title}" wurde bestätigt.`, `/order/${purchaseId}`);
  } catch (e) { console.error("Notification:", e); }
}

// Verkäufer: "Als versendet markieren"
export async function markAsShipped(purchaseId, userId, trackingNumber) {
  await updatePurchaseStatus(purchaseId, "shipped");
  await addPurchaseEvent(purchaseId, "shipped", "Artikel wurde versendet.", trackingNumber, userId);
  try {
    const { data: p } = await supabase.from("purchases").select("buyer_id, listing:listings(title)").eq("id", purchaseId).maybeSingle();
    if (p) await createNotification(p.buyer_id, "purchase", "Versendet", `"${p.listing?.title}" wurde versendet.${trackingNumber ? " Tracking: " + trackingNumber : ""}`, `/order/${purchaseId}`);
  } catch (e) { console.error("Notification:", e); }
}

// Verkäufer: "Als übergeben markieren" (Abholung)
export async function markAsPickedUp(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "picked_up");
  await addPurchaseEvent(purchaseId, "picked_up", "Artikel wurde übergeben.", null, userId);
  try {
    const { data: p } = await supabase.from("purchases").select("buyer_id, listing:listings(title)").eq("id", purchaseId).maybeSingle();
    if (p) await createNotification(p.buyer_id, "purchase", "Übergeben", `"${p.listing?.title}" wurde übergeben. Bitte Empfang bestätigen.`, `/order/${purchaseId}`);
  } catch (e) { console.error("Notification:", e); }
}

// Käufer: "Empfang bestätigen"
export async function confirmDelivery(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "delivered");
  await addPurchaseEvent(purchaseId, "delivered", "Käufer hat den Empfang bestätigt.", null, userId);
  try {
    const { data: p } = await supabase.from("purchases").select("seller_id, listing:listings(title)").eq("id", purchaseId).maybeSingle();
    if (p) await createNotification(p.seller_id, "purchase", "Empfang bestätigt", `Käufer hat den Empfang von "${p.listing?.title}" bestätigt.`, `/order/${purchaseId}`);
  } catch (e) { console.error("Notification:", e); }
}

// Beide: "Bewertung abgeben" → completed
export async function completeTransaction(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "completed");
  await addPurchaseEvent(purchaseId, "completed", "Transaktion abgeschlossen.", null, userId);
  // XP/Achievements (Verkäufer fee-skaliert + Käufer) werden serverseitig per
  // DB-Trigger auf den Status-Wechsel nach 'completed' vergeben.
}

// ═════════════════════════════════════════════════════════════
// RENTAL RETURN & DEPOSIT FLOW
// ═════════════════════════════════════════════════════════════

// Mieter: "Ich habe zurückgegeben"
export async function markAsReturned(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "return_pending");
  await addPurchaseEvent(purchaseId, "return_marked", "Rückgabe markiert.", null, userId);
  try {
    const { data: p } = await supabase.from("purchases").select("seller_id, listing:listings(title)").eq("id", purchaseId).maybeSingle();
    if (p) await createNotification(p.seller_id, "rental", "Rückgabe markiert", `Mieter hat "${p.listing?.title}" als zurückgegeben markiert. Bitte prüfen.`, `/order/${purchaseId}`);
  } catch (e) { console.error("Notification:", e); }
}

// Vermieter: "Rückgabe OK — Kaution zurückerstatten" (volle Kaution)
export async function confirmReturn(purchaseId, userId, depositAmount) {
  await updatePurchaseStatus(purchaseId, "returned");
  await addPurchaseEvent(purchaseId, "return_confirmed", `Rückgabe bestätigt. Kaution CHF ${parseFloat(depositAmount || 0).toFixed(2)} wird zurückerstattet.`, null, userId);
  // Listing reaktivieren nach Rückgabe
  const { data: purchase } = await supabase.from("purchases").select("listing_id").eq("id", purchaseId).maybeSingle();
  if (purchase?.listing_id) {
    await supabase.from("listings").update({ status: "active" }).eq("id", purchase.listing_id);
  }
}

// Vermieter: "Schaden melden" (Teil-Kaution)
export async function reportDamage(purchaseId, userId, damageAmount, description, photoUrls = []) {
  await updatePurchaseStatus(purchaseId, "damage_reported");
  await supabase.from("purchases").update({ damage_amount: damageAmount, damage_photos: photoUrls }).eq("id", purchaseId);
  await addPurchaseEvent(purchaseId, "damage_reported", `Schaden gemeldet: CHF ${parseFloat(damageAmount).toFixed(2)}. ${description}`, null, userId);
  try {
    const { data: p } = await supabase.from("purchases").select("buyer_id, listing:listings(title)").eq("id", purchaseId).maybeSingle();
    if (p) await createNotification(p.buyer_id, "rental", "Schaden gemeldet", `Vermieter hat bei "${p.listing?.title}" einen Schaden von CHF ${parseFloat(damageAmount).toFixed(2)} gemeldet.`, `/order/${purchaseId}`);
  } catch (e) { console.error("Notification:", e); }
}

// Upload damage photos to Supabase Storage
export async function uploadDamagePhotos(purchaseId, files) {
  const urls = [];
  for (const file of files) {
    const ext = file.name.split(".").pop();
    const path = `${purchaseId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("damage-photos").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("damage-photos").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
  }
  return urls;
}

// Mieter: Schaden akzeptieren
export async function acceptDamage(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "returned");
  await addPurchaseEvent(purchaseId, "damage_accepted", "Schadensmeldung akzeptiert.", null, userId);
}

// Vermieter: Kaution zurückerstattet markieren → abgeschlossen
export async function confirmDepositReturned(purchaseId, userId, refundAmount) {
  await updatePurchaseStatus(purchaseId, "completed");
  await addPurchaseEvent(purchaseId, "deposit_returned", `Kaution CHF ${parseFloat(refundAmount).toFixed(2)} zurückerstattet.`, null, userId);
}

export async function createBooking(listingId, renterId, ownerId, startDate, endDate, totalPrice, depositAmount) {
  const { data, error } = await supabase
    .from("rental_bookings")
    .insert({ listing_id: listingId, renter_id: renterId, owner_id: ownerId, start_date: startDate, end_date: endDate, total_price: totalPrice, deposit_amount: depositAmount })
    .select()
    .single();
  if (error) throw error;

  // Notification an den Eigentümer
  try {
    const { data: listing } = await supabase.from("listings").select("title, listing_type").eq("id", listingId).maybeSingle();
    const label = listing?.listing_type === "service" ? "Service-Anfrage" : "Buchungsanfrage";
    await createNotification(ownerId, "rental", label, `Neue Anfrage für "${listing?.title}" am ${new Date(startDate).toLocaleDateString("de-CH", { day: "numeric", month: "long" })}`, "/bookings");
  } catch (e) { console.error("Booking notification:", e); }

  return data;
}

export async function getBookingsForListing(listingId) {
  const { data, error } = await supabase
    .from("rental_bookings")
    .select("*, renter:profiles!rental_bookings_renter_id_fkey(id, display_name)")
    .eq("listing_id", listingId)
    .order("start_date");
  if (error) return [];
  return data || [];
}

export async function getMyBookings(userId) {
  const { data, error } = await supabase
    .from("rental_bookings")
    .select("*, listing:listings(id, title, listing_type, listing_images(*)), owner:profiles!rental_bookings_owner_id_fkey(id, display_name)")
    .eq("renter_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

// ─── Public Q&A on Listings ──────────────────────────────────
export async function getListingQuestions(listingId) {
  // RLS handles visibility: public für alle, private nur für Beteiligte.
  // Messages verschachtelt in EINER Query laden (vorher N+1: 1 Query pro Thread).
  const { data, error } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, is_public, created_at, buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url), messages(*, sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url))")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data || []).map((conv) => ({
    ...conv,
    messages: (conv.messages || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  }));
}

export async function askPublicQuestion(listingId, buyerId, sellerId, content) {
  // Öffentliche Conversation erstellen oder finden
  let { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", buyerId)
    .eq("is_public", true)
    .maybeSingle();

  let convId;
  if (existing) {
    convId = existing.id;
  } else {
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId, is_public: true })
      .select()
      .single();
    if (error) throw error;
    convId = newConv.id;
  }

  const { error: msgErr } = await supabase.from("messages").insert({ conversation_id: convId, sender_id: buyerId, content });
  if (msgErr) throw msgErr;
  await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", convId);
  return convId;
}

export async function replyToQuestion(conversationId, senderId, content) {
  const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: senderId, content });
  if (error) throw error;
  await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
}

// ─── Booking Management ──────────────────────────────────────
export async function getMyRentalRequests(userId) {
  const { data, error } = await supabase
    .from("rental_bookings")
    .select("*, listing:listings(id, title, listing_type, listing_images(*)), renter:profiles!rental_bookings_renter_id_fkey(id, display_name, avatar_url)")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function updateBookingStatus(bookingId, status) {
  const { error } = await supabase
    .from("rental_bookings")
    .update({ status })
    .eq("id", bookingId);
  if (error) throw error;

  // Notify renter about status change
  try {
    const { data: bk } = await supabase.from("rental_bookings").select("renter_id, listing:listings(title, listing_type)").eq("id", bookingId).maybeSingle();
    if (bk) {
      const label = bk.listing?.listing_type === "service" ? "Service" : "Buchung";
      if (status === "confirmed") {
        await createNotification(bk.renter_id, "rental", `${label} bestätigt`, `Deine Anfrage für "${bk.listing?.title}" wurde bestätigt.`, "/bookings");
      } else if (status === "rejected" || status === "cancelled") {
        await createNotification(bk.renter_id, "rental", `${label} abgelehnt`, `Deine Anfrage für "${bk.listing?.title}" wurde leider abgelehnt.`, "/bookings");
      }
    }
  } catch (e) { console.error("Booking notification:", e); }

  // When owner confirms → create a purchase so the payment/order flow kicks in
  if (status === "confirmed") {
    const { data: booking } = await supabase.from("rental_bookings")
      .select("*, listing:listings(id, title, price, rent_price, fee_percentage, fee_tier)")
      .eq("id", bookingId).single();
    if (booking) {
      const price = parseFloat(booking.total_price || 0);
      const feePerc = parseFloat(booking.listing?.fee_percentage || DEFAULT_FEE_PERCENT);
      const feeAmount = calcFee(price, feePerc);   // beachtet die Bagatellgrenze
      const beeImpact = calcBeeImpact(feeAmount);
      const { data: purchase } = await supabase.from("purchases").insert({
        listing_id: booking.listing_id,
        buyer_id: booking.renter_id,
        seller_id: booking.owner_id,
        price: price,
        fee_percentage: feePerc,
        fee_amount: feeAmount,
        bee_impact: beeImpact,
        status: "confirmed",
        shipping_method: "pickup",
        shipping_cost: 0,
      }).select().single();
      // Link booking to purchase
      if (purchase) {
        await supabase.from("rental_bookings").update({ purchase_id: purchase.id }).eq("id", bookingId);
      }
      return purchase?.id || null;
    }
  }
  return null;
}

// ═════════════════════════════════════════════════════════════
// SERVICE INVOICE — Anbieter loggt Stunden und erstellt Rechnung
// ═════════════════════════════════════════════════════════════

export async function submitServiceInvoice(purchaseId, sellerId, hours, hourlyRate, period) {
  const total = parseFloat(hours) * parseFloat(hourlyRate);
  const periodLabel = period === "hour" ? "Stunden" : period === "day" ? "Tage" : period === "week" ? "Wochen" : "Monate";
  const notes = `${hours} ${periodLabel} x CHF ${parseFloat(hourlyRate).toFixed(2)} = CHF ${total.toFixed(2)}`;

  const { error } = await supabase.from("purchases").update({
    price: total,
    service_hours: parseFloat(hours),
    notes,
    status: "payment_pending",
  }).eq("id", purchaseId);
  if (error) throw error;

  await addPurchaseEvent(purchaseId, "service_invoiced", notes, null, sellerId);

  try {
    const { data: p } = await supabase.from("purchases").select("buyer_id, listing:listings(title)").eq("id", purchaseId).maybeSingle();
    if (p) await createNotification(p.buyer_id, "purchase", "Rechnung erhalten", `${p.listing?.title}: ${notes}`, `/order/${purchaseId}`);
  } catch (e) { console.error("Invoice notification:", e); }

  return { total, notes };
}

// ═════════════════════════════════════════════════════════════
// BID HISTORY — Detaillierter Gebotsverlauf (Ricardo-Stil)
// ═════════════════════════════════════════════════════════════

export async function getBidHistory(listingId) {
  const { data, error } = await supabase
    .from("bid_history")
    .select("id, listing_id, bidder_id, amount, bid_type, created_at, bidder:profiles(id, display_name)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) { console.error("getBidHistory error:", error); return []; }
  return data || [];
}
