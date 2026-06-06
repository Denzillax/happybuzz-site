import { supabase } from "@/lib/supabase/supabase";


function getBidIncrement(price) {
  if (price < 10) return 0.50;
  if (price < 50) return 1;
  if (price < 100) return 2;
  if (price < 500) return 5;
  if (price < 1000) return 10;
  return 20;
}


async function extendAuctionIfNeeded(listingId, auctionEnd) {
  if (!auctionEnd) return;
  const endTime = new Date(auctionEnd);
  const now = new Date();
  const diffMs = endTime.getTime() - now.getTime();
  const threeMin = 3 * 60 * 1000;

  if (diffMs > 0 && diffMs < threeMin) {
    const newEnd = new Date(now.getTime() + threeMin);
    await supabase.from("listings").update({ auction_end: newEnd.toISOString() }).eq("id", listingId);
  }
}


export async function placeBid(listingId, bidderId, maxAmount) {
  // ── PROXY BIDDING (Ricardo-Style) ──
  const logBid = async (bid_bidder, bid_amount, bid_type) => {
    try { await supabase.from("bid_history").insert({ listing_id: listingId, bidder_id: bid_bidder, amount: bid_amount, bid_type }); } catch(e) {}
  };
  // maxAmount = Preislimit des Bieters (geheim)
  // System bietet automatisch das Minimum

  // 1. Listing holen
  const { data: listing } = await supabase.from("listings")
    .select("start_price, buy_now_price, price, auction_end")
    .eq("id", listingId).single();
  if (!listing) throw new Error("Inserat nicht gefunden");

  // Cap bei buy_now_price
  if (listing.buy_now_price > 0 && maxAmount >= listing.buy_now_price) {
    throw new Error(`Max. Preislimit: CHF ${(listing.buy_now_price - 1).toFixed(2)}. Nutze Sofortkauf.`);
  }

  // 2. Höchstes bestehendes Gebot holen (nach max_amount sortiert)
  const { data: topBids } = await supabase.from("bids")
    .select("id, bidder_id, amount, max_amount")
    .eq("listing_id", listingId)
    .order("max_amount", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1);

  const currentTop = topBids?.[0] || null;
  const startPrice = listing.start_price || 1;
  const currentDisplayPrice = listing.price || startPrice;

  // 3. Prüfe ob dieser Bieter schon ein Gebot hat
  const { data: existingBid } = await supabase.from("bids")
    .select("id, max_amount, amount")
    .eq("listing_id", listingId)
    .eq("bidder_id", bidderId)
    .maybeSingle();

  if (existingBid) {
    // ── Gleiches Preislimit erhöhen ──
    if (maxAmount <= existingBid.max_amount) {
      throw new Error(`Dein aktuelles Preislimit ist bereits CHF ${existingBid.max_amount.toFixed(2)}. Gib ein höheres ein.`);
    }
    // Update bestehendes Gebot
    await supabase.from("bids").update({ max_amount: maxAmount }).eq("id", existingBid.id);

    // Prüfe ob jetzt ein anderer Top-Bieter überboten wird
    if (currentTop && currentTop.bidder_id !== bidderId) {
      if (maxAmount > currentTop.max_amount) {
        // Wir überbieten den aktuellen Top-Bieter
        const inc = getBidIncrement(currentTop.max_amount);
        const newPrice = Math.min(maxAmount, currentTop.max_amount + inc);
        await supabase.from("bids").update({ amount: newPrice }).eq("id", existingBid.id);
        await logBid(bidderId, newPrice, "manual");
        await supabase.from("listings").update({ price: newPrice }).eq("id", listingId);
        await extendAuctionIfNeeded(listingId, listing.auction_end);
        return { displayPrice: newPrice, isTopBidder: true, message: "Du führst jetzt!" };
      } else {
        // Immer noch überboten — Auto-Bid des Top-Bieters
        const inc = getBidIncrement(maxAmount);
        const autoPrice = Math.min(currentTop.max_amount, maxAmount + inc);
        await supabase.from("bids").update({ amount: autoPrice }).eq("id", currentTop.id);
        await supabase.from("bids").update({ amount: maxAmount }).eq("id", existingBid.id);
        await logBid(bidderId, maxAmount, "manual");
        await logBid(currentTop.bidder_id, autoPrice, "auto");
        await supabase.from("listings").update({ price: autoPrice }).eq("id", listingId);
        await extendAuctionIfNeeded(listingId, listing.auction_end);
        return { displayPrice: autoPrice, isTopBidder: false, message: "Du wurdest automatisch überboten." };
      }
    }
    // Wir SIND der Top-Bieter — nur Maximum erhöht, Preis bleibt
    return { displayPrice: currentDisplayPrice, isTopBidder: true, message: "Preislimit erhöht." };
  }

  // ── Neuer Bieter ──
  let newDisplayPrice;
  let isTop = true;

  if (!currentTop) {
    // Erster Bieter
    newDisplayPrice = startPrice;
    await supabase.from("bids").upsert({ listing_id: listingId, bidder_id: bidderId, amount: newDisplayPrice, max_amount: maxAmount }, { onConflict: "listing_id,bidder_id" });
    await logBid(bidderId, newDisplayPrice, "manual");
  } else if (maxAmount > currentTop.max_amount) {
    // Neuer Bieter überbietet
    const inc = getBidIncrement(currentTop.max_amount);
    newDisplayPrice = Math.min(maxAmount, currentTop.max_amount + inc);
    await supabase.from("bids").upsert({ listing_id: listingId, bidder_id: bidderId, amount: newDisplayPrice, max_amount: maxAmount }, { onConflict: "listing_id,bidder_id" });
    await logBid(bidderId, newDisplayPrice, "manual");
  } else {
    // Bestehender Bieter bleibt vorne
    const inc = getBidIncrement(maxAmount);
    const autoPrice = Math.min(currentTop.max_amount, maxAmount + inc);
    await supabase.from("bids").upsert({ listing_id: listingId, bidder_id: bidderId, amount: maxAmount, max_amount: maxAmount }, { onConflict: "listing_id,bidder_id" });
    await supabase.from("bids").update({ amount: autoPrice }).eq("id", currentTop.id);
    await logBid(bidderId, maxAmount, "manual");
    await logBid(currentTop.bidder_id, autoPrice, "auto");
    newDisplayPrice = autoPrice;
    isTop = false;
  }

  // 4. Listing-Preis aktualisieren
  await supabase.from("listings").update({ price: newDisplayPrice }).eq("id", listingId);

  // 5. Timer-Verlängerung prüfen
  await extendAuctionIfNeeded(listingId, listing.auction_end);

  // 6. bid_count aktualisieren
  const { count } = await supabase.from("bids").select("*", { count: "exact", head: true }).eq("listing_id", listingId);
  await supabase.from("listings").update({ bid_count: count || 0 }).eq("id", listingId);

  return {
    displayPrice: newDisplayPrice,
    isTopBidder: isTop,
    message: isTop ? "Du führst!" : "Du wurdest automatisch überboten.",
  };
}


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

  // 2. Höchstes Gebot finden
  const { data: topBid } = await supabase.from("bids")
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
  const feePct = listing.fee_percentage || 5;
  const feeAmount = finalPrice * feePct / 100;
  const platformFee = feeAmount * 0.8;
  const beeImpact = feeAmount * 0.2;

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

  return {
    status: "sold",
    winner: topBid.bidder_id,
    price: finalPrice,
    purchaseId: purchase.id,
  };
}


export async function getMyBid(listingId, userId) {
  if (!userId) return null;
  const { data } = await supabase.from("bids")
    .select("id, amount, max_amount, created_at")
    .eq("listing_id", listingId)
    .eq("bidder_id", userId)
    .maybeSingle();
  return data;
}


export async function adjustPreislimit(listingId, userId, newMax) {
  if (!userId) throw new Error("Nicht eingeloggt");
  
  const { data: myBid } = await supabase.from("bids")
    .select("id, amount, max_amount")
    .eq("listing_id", listingId)
    .eq("bidder_id", userId)
    .maybeSingle();
  
  if (!myBid) throw new Error("Du hast noch kein Gebot abgegeben");
  if (newMax < myBid.amount) throw new Error(`Preislimit kann nicht unter dein aktuelles Gebot von CHF ${myBid.amount.toFixed(2)} gesenkt werden.`);
  if (newMax === myBid.max_amount) throw new Error("Das ist bereits dein aktuelles Preislimit.");

  const { data: listing } = await supabase.from("listings")
    .select("buy_now_price").eq("id", listingId).single();
  if (listing?.buy_now_price > 0 && newMax >= listing.buy_now_price) {
    throw new Error(`Preislimit muss unter dem Sofortkauf-Preis von CHF ${listing.buy_now_price.toFixed(2)} liegen.`);
  }

  await supabase.from("bids").update({ max_amount: newMax }).eq("id", myBid.id);
  return { newMax, amount: myBid.amount };
}


export async function removePreislimit(listingId, userId) {
  if (!userId) throw new Error("Nicht eingeloggt");
  
  const { data: myBid } = await supabase.from("bids")
    .select("id, amount")
    .eq("listing_id", listingId)
    .eq("bidder_id", userId)
    .maybeSingle();
  
  if (!myBid) throw new Error("Du hast noch kein Gebot abgegeben");

  // max_amount = amount → kein Auto-Bieten mehr, aber Gebot bleibt
  await supabase.from("bids").update({ max_amount: myBid.amount }).eq("id", myBid.id);
  return { amount: myBid.amount };
}


export async function getBids(listingId) {
  const { data, error } = await supabase
    .from("bids")
    .select("*, bidder:profiles!bids_bidder_id_fkey(id, display_name)")
    .eq("listing_id", listingId)
    .order("amount", { ascending: false })
    .limit(20);
  if (error) return [];
  return data || [];
}


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
