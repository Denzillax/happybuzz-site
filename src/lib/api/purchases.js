import { supabase } from "@/lib/supabase/supabase";


export async function createPurchase(buyerId, listingId) {
  const { data, error } = await supabase.rpc("create_purchase", {
    p_listing_id: listingId,
    p_buyer_id: buyerId,
  });
  if (error) throw new Error(error.message);
  return data; // purchase ID
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


export async function markAsPaid(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "payment_pending");
  await addPurchaseEvent(purchaseId, "payment_marked", "Käufer hat die Zahlung als erledigt markiert.", null, userId);
}


export async function confirmPayment(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "paid");
  await addPurchaseEvent(purchaseId, "payment_confirmed", "Verkäufer hat den Zahlungseingang bestätigt.", null, userId);
}


export async function markAsShipped(purchaseId, userId, trackingNumber) {
  await updatePurchaseStatus(purchaseId, "shipped");
  await addPurchaseEvent(purchaseId, "shipped", "Artikel wurde versendet.", trackingNumber, userId);
}


export async function markAsPickedUp(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "picked_up");
  await addPurchaseEvent(purchaseId, "picked_up", "Artikel wurde übergeben.", null, userId);
}


export async function confirmDelivery(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "delivered");
  await addPurchaseEvent(purchaseId, "delivered", "Käufer hat den Empfang bestätigt.", null, userId);
}


export async function completeTransaction(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "completed");
  await addPurchaseEvent(purchaseId, "completed", "Transaktion abgeschlossen.", null, userId);
}
