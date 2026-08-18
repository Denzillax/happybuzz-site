// Einzige Quelle für die Swiss-QR-Rechnung (Payload + Bild-URL, keine UI).
// WICHTIG: Seit QR-Standard 2.3 sind nur noch STRUKTURIERTE Adressen (Typ S)
// zulässig; kombinierte Adressen (Typ K) verarbeiten Banken nur noch bis
// 30.09.2026. Darum hier Strasse/Nr/PLZ/Ort getrennt.
import { fullName } from "@/lib/formatters";
import { makeBeeRef } from "@/lib/fees";
import { isValidIban } from "@/lib/iban";

// "Gemeindehausstrasse 11B" -> ["Gemeindehausstrasse", "11B"]
export function splitStreet(street) {
  const s = (street || "").trim();
  const m = s.match(/^(.*?)[\s,]+(\d+[a-zA-Z]?)$/);
  return m ? [m[1], m[2]] : [s, ""];
}

// Strukturierter QR-Payload (SPC 0200, AdrTp "S").
// Ohne Debtor-Namen bleiben alle 7 Debtor-Felder leer (laut Standard erlaubt).
export function buildSwissQR({ iban, name, street, postalCode, city, amount, currency, dName, dStreet, dPostalCode, dCity, message }) {
  const [strtNm, bldgNb] = splitStreet(street);
  const debtor = dName
    ? (() => { const [dStrt, dBldg] = splitStreet(dStreet); return ["S", dName, dStrt, dBldg, dPostalCode || "", dCity || "", "CH"]; })()
    : ["", "", "", "", "", "", ""];
  return [
    "SPC", "0200", "1",
    iban,
    "S", name, strtNm, bldgNb, postalCode || "", city || "", "CH",   // Creditor
    "", "", "", "", "", "", "",                                       // Ultimate Creditor (leer)
    amount, currency,
    ...debtor,                                                        // Ultimate Debtor
    "NON", "",                                                        // Referenztyp/Referenz
    message || "", "EPD",
  ].join("\r\n");
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
  // Miete: Kaution wird mit der Miete ueberwiesen (Rueckerstattung laeuft
  // ueber die separate Kautions-Rechnung mit deposit=true)
  const isRent = order.listing?.listing_type === "rent";
  const total = deposit ? refundAmount : price + shipping + (isRent ? depositAmount : 0);
  const ref = makeBeeRef(order.id);
  const payee = deposit ? order.buyer : order.seller;
  const payer = deposit ? order.seller : order.buyer;
  const payeeIsBusiness = payee?.account_type === "business" && !!payee?.company_name;
  const payeeName = payeeIsBusiness ? payee.company_name : fullName(payee);
  const payeeIban = (payee?.iban || "").replace(/\s/g, "");
  const message = deposit ? `Kaution ${ref}` : `Rechnung ${ref}`;
  return buildSwissQR({
    iban: payeeIban, name: payeeName,
    street: payee?.street || "", postalCode: payee?.postal_code || "", city: payee?.city || "",
    amount: total.toFixed(2), currency: "CHF",
    dName: fullName(payer),
    dStreet: payer?.street || "", dPostalCode: payer?.postal_code || "", dCity: payer?.city || "",
    message,
  });
}

// Gebühren-Rechnung: Verkäufer -> Firma (company_settings). `company` = Creditor.
export function feeQrPayload(invoice, seller, company = {}) {
  const total = parseFloat(invoice.total_fees || 0);
  const ref = invoice.invoice_ref;

  // Ohne echte Firmendaten KEINEN QR erzeugen. Frueher standen hier eine
  // Platzhalter-IBAN und "BEEDARO" als Fallback: haette company_settings nicht
  // geladen, waere ein scanbarer Zahlteil mit falschem Empfaenger entstanden.
  // Lieber kein QR als ein falscher.
  // Auch ungueltige IBANs (z.B. alter Platzhalter in der DB) blocken:
  // ein Zahlteil mit kaputter Pruefsumme wird von Banking-Apps abgelehnt.
  if (!company.iban || !company.name || !isValidIban(company.iban)) return null;

  const iban = company.iban.replace(/\s/g, "");
  return buildSwissQR({
    iban, name: company.name,
    street: company.street || "", postalCode: company.postal_code || "", city: company.city || "",
    amount: total.toFixed(2), currency: "CHF",
    dName: fullName(seller),
    dStreet: seller?.street || "", dPostalCode: seller?.postal_code || "", dCity: seller?.city || "",
    message: `Gebuehren ${ref}`,
  });
}

// Service-Rechnung: Käufer -> Verkäufer (Dienstleister), Betrag aus den Positionen.
export function serviceQrPayload(purchaseId, total, sellerProfile) {
  const iban = (sellerProfile?.iban || "").replace(/\s/g, "");
  if (!iban) return null;
  return buildSwissQR({
    iban, name: fullName(sellerProfile),
    street: sellerProfile?.street || "", postalCode: sellerProfile?.postal_code || "", city: sellerProfile?.city || "",
    amount: Number(total || 0).toFixed(2), currency: "CHF",
    message: `Service ${(purchaseId || "").substring(0, 8).toUpperCase()}`,
  });
}
