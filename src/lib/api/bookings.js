import { supabase } from "@/lib/supabase/supabase";


// Notification helper (stub — wird später durch echtes System ersetzt)
async function createNotification(userId, type, title, message, link) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId, type, title, message, link, read: false
    });
  } catch (e) { /* notifications table may not exist yet */ }
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

  // When owner confirms → create a purchase so the payment/order flow kicks in
  if (status === "confirmed") {
    const { data: booking } = await supabase.from("rental_bookings")
      .select("*, listing:listings(id, title, price, rent_price, fee_percentage, fee_tier)")
      .eq("id", bookingId).single();
    if (booking) {
      const price = parseFloat(booking.total_price || 0);
      const feePerc = parseFloat(booking.listing?.fee_percentage || 5);
      const feeAmount = price * feePerc / 100;
      const beeImpact = feeAmount * 0.20;
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


export async function submitServiceInvoice(purchaseId, sellerId, hours, hourlyRate, period) {
  const total = Math.round(parseFloat(hours) * parseFloat(hourlyRate) * 100) / 100;
  const periodLabel = period === "hour" ? "Stunden" : period === "day" ? "Tage" : period === "week" ? "Wochen" : "Monate";
  const notes = `${hours} ${periodLabel} x CHF ${parseFloat(hourlyRate).toFixed(2)} = CHF ${total.toFixed(2)}`;

  // RPC bypasses RLS (SECURITY DEFINER)
  const { error } = await supabase.rpc("submit_service_invoice", {
    p_purchase_id: purchaseId,
    p_price: total,
    p_service_hours: parseFloat(hours),
    p_notes: notes,
  });
  if (error) throw error;

  try {
    const { data: p } = await supabase.from("purchases").select("buyer_id, listing:listings(title)").eq("id", purchaseId).maybeSingle();
    if (p) await createNotification(p.buyer_id, "purchase", "Rechnung erhalten", `${p.listing?.title}: ${notes}`, `/order/${purchaseId}`);
  } catch (e) { console.error("Invoice notification:", e); }

  return { total, notes };
}
