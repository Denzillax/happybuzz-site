import { supabase } from "@/lib/supabase/supabase";


export async function markAsReturned(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "return_pending");
  await addPurchaseEvent(purchaseId, "return_marked", "Rückgabe markiert.", null, userId);
}


export async function confirmReturn(purchaseId, userId, depositAmount) {
  await updatePurchaseStatus(purchaseId, "returned");
  await addPurchaseEvent(purchaseId, "return_confirmed", `Rückgabe bestätigt. Kaution CHF ${parseFloat(depositAmount || 0).toFixed(2)} wird zurückerstattet.`, null, userId);
  // Listing reaktivieren nach Rückgabe
  const { data: purchase } = await supabase.from("purchases").select("listing_id").eq("id", purchaseId).maybeSingle();
  if (purchase?.listing_id) {
    await supabase.from("listings").update({ status: "active" }).eq("id", purchase.listing_id);
  }
}


export async function reportDamage(purchaseId, userId, damageAmount, description, photoUrls = []) {
  await updatePurchaseStatus(purchaseId, "damage_reported");
  await supabase.from("purchases").update({ damage_amount: damageAmount, damage_photos: photoUrls }).eq("id", purchaseId);
  await addPurchaseEvent(purchaseId, "damage_reported", `Schaden gemeldet: CHF ${parseFloat(damageAmount).toFixed(2)}. ${description}`, null, userId);
}


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


export async function acceptDamage(purchaseId, userId) {
  await updatePurchaseStatus(purchaseId, "returned");
  await addPurchaseEvent(purchaseId, "damage_accepted", "Schadensmeldung akzeptiert.", null, userId);
}


export async function confirmDepositReturned(purchaseId, userId, refundAmount) {
  await updatePurchaseStatus(purchaseId, "completed");
  await addPurchaseEvent(purchaseId, "deposit_returned", `Kaution CHF ${parseFloat(refundAmount).toFixed(2)} zurückerstattet.`, null, userId);
}
