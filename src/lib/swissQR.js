// Einzige Quelle für die Swiss-QR-Rechnung (vorher dupliziert in
// order/[id]/invoice und fees/invoice/[id]). Reiner Payload-/URL-Builder, keine UI.
import { fullName } from "@/lib/formatters";
import { makeBeeRef } from "@/lib/fees";

export function buildSwissQR({ iban, name, street, plzCity, amount, currency, dName, dStreet, dPlzCity, message }) {
  return ["SPC","0200","1",iban,"K",name,street||"",plzCity||"","","","CH","","","","","","","",amount,currency,"K",dName||"",dStreet||"",dPlzCity||"","","","CH","NON","",message||"","EPD"].join("\r\n");
}

export function qrImageUrl(payload, size = 200) {
  if (!payload) return null;   // kein Zahlteil ohne gültige Daten
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=M&data=${encodeURIComponent(payload)}`;
}

// Bestell-Rechnung (Kauf): Käufer -> Verkäufer. deposit=true -> Kautionsrückgabe (Verkäufer -> Käufer).
// `order` muss .buyer, .seller (volle profiles) und .listing (joined) enthalten.
export function orderQrPayload(order, { deposit = false } = {}) {
  const price = parseFloat(order.listing?.price || order.price || 0);
  const shipping = parseFloat(order.listing?.shipping_cost || order.shipping_cost || 0);
  const depositAmount = parseFloat(order.listing?.deposit_amount || 0);
  const damageAmount = parseFloat(order.damage_amount || 0);
  const refundAmount = Math.max(0, depositAmount - damageAmount);
  const total = deposit ? refundAmount : price + shipping;
  const ref = makeBeeRef(order.id);
  const payee = deposit ? order.buyer : order.seller;
  const payer = deposit ? order.seller : order.buyer;
  const payeeIsBusiness = payee?.account_type === "business" && !!payee?.company_name;
  const payeeName = payeeIsBusiness ? payee.company_name : fullName(payee);
  const payeeIban = (payee?.iban || "").replace(/\s/g, "");
  const payeeStreet = payee?.street || "";
  const payeePlz = `${payee?.postal_code || ""} ${payee?.city || ""}`.trim();
  const payerStreet = payer?.street || "";
  const payerPlz = `${payer?.postal_code || ""} ${payer?.city || ""}`.trim();
  const message = deposit ? `Kaution ${ref}` : `Rechnung ${ref}`;
  return buildSwissQR({ iban: payeeIban, name: payeeName, street: payeeStreet, plzCity: payeePlz, amount: total.toFixed(2), currency: "CHF", dName: fullName(payer), dStreet: payerStreet, dPlzCity: payerPlz, message });
}

// Gebühren-Rechnung: Verkäufer -> Firma (company_settings). `company` = Creditor.
export function feeQrPayload(invoice, seller, company = {}) {
  const total = parseFloat(invoice.total_fees || 0);
  const ref = invoice.invoice_ref;

  // Ohne echte Firmendaten KEINEN QR erzeugen. Frueher standen hier eine
  // Platzhalter-IBAN und "BEEDARO" als Fallback: haette company_settings nicht
  // geladen, waere ein scanbarer Zahlteil mit falschem Empfaenger entstanden.
  // Lieber kein QR als ein falscher.
  if (!company.iban || !company.name) return null;

  const iban = company.iban.replace(/\s/g, "");
  const plzCity = `${company.postal_code || ""} ${company.city || ""}`.trim();
  return buildSwissQR({
    iban, name: company.name, street: company.street || "", plzCity,
    amount: total.toFixed(2), currency: "CHF",
    dName: fullName(seller), dStreet: seller?.street || "", dPlzCity: `${seller?.postal_code || ""} ${seller?.city || ""}`.trim(),
    message: `Gebuehren ${ref}`,
  });
}
