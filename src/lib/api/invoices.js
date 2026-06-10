import { supabase } from "@/lib/supabase/supabase";
import { addPurchaseEvent } from "@/lib/listings";
import { createNotification } from "@/lib/notifications";
import { calcFeeFromPrice } from "@/lib/fees";

// ── Predefined Templates ─────────────────────────────────────
export const INVOICE_TEMPLATES = [
  { key: "travel",    label: "Anfahrtspauschale",  unit_price: 30,  item_type: "travel",   icon: "Car" },
  { key: "labor",     label: "Arbeitsstunde",       unit_price: 65,  item_type: "labor",    icon: "Clock" },
  { key: "material",  label: "Material",            unit_price: 0,   item_type: "material", icon: "Package" },
  { key: "disposal",  label: "Entsorgung",          unit_price: 0,   item_type: "disposal", icon: "Trash2" },
  { key: "custom",    label: "Freitext",            unit_price: 0,   item_type: "custom",   icon: "Pencil" },
];

// ── CRUD ──────────────────────────────────────────────────────

export async function getInvoiceItems(purchaseId) {
  const { data, error } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("purchase_id", purchaseId)
    .order("sort_order");
  if (error) { console.error("getInvoiceItems error:", error); return []; }
  return data || [];
}

export async function saveInvoiceItems(purchaseId, items) {
  // Delete existing items first
  await supabase.from("invoice_items").delete().eq("purchase_id", purchaseId);

  if (!items || items.length === 0) return;

  const rows = items.map((item, i) => ({
    purchase_id: purchaseId,
    label: item.label,
    description: item.description || null,
    quantity: parseFloat(item.quantity) || 1,
    unit_price: parseFloat(item.unit_price) || 0,
    total: (parseFloat(item.quantity) || 1) * (parseFloat(item.unit_price) || 0),
    item_type: item.item_type || "custom",
    sort_order: i,
  }));

  const { error } = await supabase.from("invoice_items").insert(rows);
  if (error) throw error;
}

/**
 * Submit a service invoice with line items
 * Updates the purchase price, saves items, and triggers notification
 */
export async function submitServiceInvoiceWithItems(purchaseId, sellerId, items) {
  // Calculate total from items
  const total = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 1) * (parseFloat(item.unit_price) || 0);
  }, 0);

  // Save items
  await saveInvoiceItems(purchaseId, items);

  // Build notes summary
  const lines = items.map(item => {
    const qty = parseFloat(item.quantity) || 1;
    const price = parseFloat(item.unit_price) || 0;
    return `${qty > 1 ? qty + "x " : ""}${item.label}: CHF ${(qty * price).toFixed(2)}`;
  });
  const notes = lines.join(" | ") + ` | Total: CHF ${total.toFixed(2)}`;

  // Update purchase
  const { error } = await supabase.from("purchases").update({
    price: total,
    notes,
    status: "payment_pending",
  }).eq("id", purchaseId);
  if (error) throw error;

  // Add event
  await addPurchaseEvent(purchaseId, "service_invoiced", notes, null, sellerId);

  // Notify buyer
  try {
    const { data: p } = await supabase.from("purchases")
      .select("buyer_id, listing:listings(title)")
      .eq("id", purchaseId).maybeSingle();
    if (p) {
      await createNotification(
        p.buyer_id, "purchase",
        "Service-Rechnung erhalten",
        `${p.listing?.title}: CHF ${total.toFixed(2)}`,
        `/order/${purchaseId}`
      );
    }
  } catch (e) { console.error("Invoice notification:", e); }

  return { total, notes, items };
}
