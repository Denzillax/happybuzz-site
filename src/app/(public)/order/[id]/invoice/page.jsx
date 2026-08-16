"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import BeeIcon from "@/components/shared/BeeIcon";
import { Logo } from "@/components/shared/Logo";
import { colors } from "@/lib/theme";
import { calcFeeFromPrice, makeBeeRef, makeArtRef, makeFeeRef, calcDueDate, DEFAULT_FEE_PERCENT } from "@/lib/fees";
import { orderQrPayload } from "@/lib/swissQR";
import SwissQRImage from "@/components/shared/SwissQRImage";
import { fmtCHF, fmtDateLong, fullName } from "@/lib/formatters";
import { getInvoiceItems } from "@/lib/api/invoices";
const f = "'Manrope', sans-serif";
const g = "#888";
export default function InvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isDeposit = searchParams.get("type") === "deposit";
  const [order, setOrder] = useState(null);
  const [booking, setBooking] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      try {
        const { data: p } = await supabase.from("purchases").select("*, listing:listings(id, title, price, listing_type, rent_price, deposit_amount, fee_percentage, fee_tier, shipping_cost, free_shipping)").eq("id", params.id).single();
        if (!p) { setLoading(false); return; }
        const { data: buyer } = await supabase.from("profiles").select("*").eq("id", p.buyer_id).maybeSingle();
        const { data: seller } = await supabase.from("profiles").select("*").eq("id", p.seller_id).maybeSingle();
        if (p.listing?.listing_type === "rent") {
          const { data: bk } = await supabase.from("rental_bookings").select("*").eq("purchase_id", p.id).maybeSingle();
          if (bk) setBooking(bk);
        }
        setOrder({ ...p, buyer, seller });
        if (p.listing?.listing_type === "service") { const items = await getInvoiceItems(p.id); setInvoiceItems(items); }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [params.id]);
  if (loading) return <div style={{ fontFamily: f, padding: 60, textAlign: "center", color: g }}>Lade...</div>;
  if (!order) return <div style={{ fontFamily: f, padding: 60, textAlign: "center", color: g }}>Bestellung nicht gefunden</div>;

  const isRental = order.listing?.listing_type === "rent";
  const price = parseFloat(order.listing?.price || order.price || 0);
  const shipping = parseFloat(order.listing?.shipping_cost || order.shipping_cost || 0);
  const depositAmount = parseFloat(order.listing?.deposit_amount || 0);
  const damageAmount = parseFloat(order.damage_amount || 0);
  const refundAmount = Math.max(0, depositAmount - damageAmount);
  const total = isDeposit ? refundAmount : price + shipping;
  const feePercent = order.listing?.fee_percentage || DEFAULT_FEE_PERCENT;
  const { fee, beeImpact } = calcFeeFromPrice(price, feePercent);
  const fmt = fmtCHF;
  const orderDate = fmtDateLong(order.created_at);
  const ref = makeBeeRef(order.id);
  const artRef = makeArtRef(order.listing?.id || order.listing_id);
  const feeRef = makeFeeRef(order.id);
  const dueDate = calcDueDate(order.created_at);
  const dueDateStr = fmtDateLong(dueDate);

  // For deposit return: payer = seller (Vermieter), payee = buyer (Mieter)
  // For regular invoice: payer = buyer, payee = seller
  const payee = isDeposit ? order.buyer : order.seller;
  const payer = isDeposit ? order.seller : order.buyer;
  const payeeIsBusiness = payee?.account_type === "business" && !!payee?.company_name;
  const payeeName = payeeIsBusiness ? payee.company_name : fullName(payee);
  const payeeIban = (payee?.iban || "").replace(/\s/g, "");
  const payeeStreet = payee?.street || "";
  const payeePlz = `${payee?.postal_code || ""} ${payee?.city || ""}`.trim();
  const payerStreet = payer?.street || "";
  const payerPlz = `${payer?.postal_code || ""} ${payer?.city || ""}`.trim();
  const qrPayload = orderQrPayload(order, { deposit: isDeposit });
  const addr = (p) => {
    const isBiz = p?.account_type === "business" && p?.company_name;
    const lines = [isBiz ? p.company_name : fullName(p), p?.street, `${p?.postal_code || ""} ${p?.city || ""}`.trim()].filter(Boolean);
    if (isBiz && p?.company_uid) lines.push(`UID: ${p.company_uid}`);
    return lines;
  };
  const lbl = { margin: "0 0 4px", fontSize: 9, fontWeight: 700, color: g, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: f };
  const cp = { padding: "9px 0", fontFamily: f };

  const pageTitle = isDeposit ? "KAUTION-RÜCKERSTATTUNG" : "RECHNUNG";
  const payeeLabel = isDeposit ? "Begünstigter (Mieter)" : "Verkäufer";
  const payerLabel = isDeposit ? "Zahlungspflichtiger (Vermieter)" : "Käufer";

  return (
    <div style={{ fontFamily: f, background: "#fff", minHeight: "100vh", color: "#1a1a1a" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "center", gap: 12, padding: 16, background: isDeposit ? "#E8F5E9" : colors.cream }}>
        <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 0, border: "none", background: isDeposit ? "#5B8C5A" : colors.yellow, color: isDeposit ? "#fff" : "#1a1a1a", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: f }}>
          <Printer size={16} /> Drucken / PDF
        </button>
      </div>
      <div className="invoice-body" style={{ maxWidth: 660, margin: "0 auto", padding: "28px 36px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <Logo width={130} />
          <div style={{ textAlign: "right", fontSize: 10, color: g, fontFamily: f, lineHeight: 1.6 }}>Gemeindehausstrasse 11B<br/>6010 Kriens, Schweiz</div>
        </div>
        {/* Titel */}
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 4px", fontFamily: f, color: isDeposit ? "#5B8C5A" : "#1a1a1a" }}>{pageTitle}</h1>
        <p style={{ margin: "0 0 16px", fontSize: 11, color: g, fontFamily: f }}>Ref: <strong style={{ color: "#1a1a1a" }}>{ref}</strong> · {orderDate}</p>
        {/* Adressen */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 18 }}>
          {[{ l: payerLabel, d: addr(payer) }, { l: payeeLabel, d: addr(payee) }].map(a => (
            <div key={a.l}>
              <p style={lbl}>{a.l}</p>
              {a.d.map((ln, i) => <p key={i} style={{ margin: 0, fontSize: i === 0 ? 12 : 11, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? "#1a1a1a" : "#666", fontFamily: f, lineHeight: 1.5 }}>{ln}</p>)}
            </div>
          ))}
        </div>
        {/* Positionen */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, fontFamily: f }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #1a1a1a" }}>
              <th style={{ ...cp, textAlign: "left", fontSize: 9, fontWeight: 700, color: g, textTransform: "uppercase" }}>Position</th>
              <th style={{ ...cp, textAlign: "right", fontSize: 9, fontWeight: 700, color: g, textTransform: "uppercase" }}>CHF</th>
            </tr>
          </thead>
          <tbody>
            {isDeposit ? (
              <>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ ...cp, fontSize: 12 }}>
                    Kaution
                    <span style={{ display: "block", fontSize: 9, color: g, marginTop: 1 }}>{order.listing?.title || "Artikel"} · {artRef}</span>
                    {booking && <span style={{ display: "block", fontSize: 9, color: g, marginTop: 1 }}>Mietdauer: {new Date(booking.start_date).toLocaleDateString("de-CH")} bis {new Date(booking.end_date).toLocaleDateString("de-CH")}</span>}
                  </td>
                  <td style={{ ...cp, fontSize: 12, textAlign: "right", fontWeight: 600 }}>{fmt(depositAmount)}</td>
                </tr>
                {damageAmount > 0 && (
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ ...cp, fontSize: 12, color: "#c62828" }}>Schadensabzug</td>
                    <td style={{ ...cp, fontSize: 12, textAlign: "right", color: "#c62828", fontWeight: 600 }}>- {fmt(damageAmount)}</td>
                  </tr>
                )}
              </>
            ) : (
              <>
                {invoiceItems.length > 0 ? (
                  invoiceItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ ...cp, fontSize: 12 }}>
                        {item.label}
                        {item.description && <span style={{ display: "block", fontSize: 9, color: g, marginTop: 1 }}>{item.description}</span>}
                        <span style={{ display: "block", fontSize: 9, color: g, marginTop: 1 }}>{parseFloat(item.quantity)} x CHF {parseFloat(item.unit_price).toFixed(2)}</span>
                      </td>
                      <td style={{ ...cp, fontSize: 12, textAlign: "right", fontWeight: 600 }}>{fmt(parseFloat(item.total))}</td>
                    </tr>
                  ))
                ) : (
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ ...cp, fontSize: 12 }}>
                      {order.listing?.title || "Artikel"}
                      <span style={{ display: "block", fontSize: 9, color: g, marginTop: 1 }}>{artRef}</span>
                    </td>
                    <td style={{ ...cp, fontSize: 12, textAlign: "right", fontWeight: 600 }}>{fmt(price)}</td>
                  </tr>
                )}
                {shipping > 0 && (
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ ...cp, fontSize: 12, color: "#666" }}>Versand</td>
                    <td style={{ ...cp, fontSize: 12, textAlign: "right", color: "#666" }}>{fmt(shipping)}</td>
                  </tr>
                )}
              </>
            )}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #1a1a1a" }}>
              <td style={{ ...cp, fontSize: 14, fontWeight: 800 }}>{isDeposit ? "Rückerstattung" : "Gesamtpreis"}</td>
              <td style={{ ...cp, fontSize: 16, fontWeight: 800, textAlign: "right" }}>CHF {fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
        {/* Gebühren-Info (nur bei regulärer Rechnung) */}
        {!isDeposit && (
          <p style={{ margin: "0 0 16px", padding: "8px 12px", background: "#f8f8f8", borderRadius: 0, fontSize: 10, color: "#666", fontFamily: f, lineHeight: 1.5 }}>
            Plattformgebühr ({feePercent}%): CHF {fmt(fee)} (Verkäufer) · Ref: {feeRef}. Davon CHF {fmt(beeImpact)} Bee-Impact für Schweizer Naturschutz.
          </p>
        )}
        {isDeposit && (
          <p style={{ margin: "0 0 16px", padding: "8px 12px", background: damageAmount > 0 ? "#FFF3E0" : "#E8F5E9", borderRadius: 0, fontSize: 10, color: damageAmount > 0 ? "#E65100" : "#5B8C5A", fontFamily: f, lineHeight: 1.5 }}>
            {damageAmount > 0
              ? `Teilrückerstattung: Kaution CHF ${fmt(depositAmount)} abzüglich Schaden CHF ${fmt(damageAmount)} = CHF ${fmt(refundAmount)}.`
              : "Die Kaution wird vollständig an den Mieter zurückerstattet. Keine Gebühren auf Kautionsrückerstattungen."}
          </p>
        )}
        {/* Zahlung + QR */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: "14px 18px", border: `1px solid ${isDeposit ? "#5B8C5A" : "#ddd"}`, borderRadius: 0, marginBottom: 16 }}>
          <div style={{ fontFamily: f }}>
            <p style={{ ...lbl, marginBottom: 8 }}>{isDeposit ? "Rückerstattung an" : "Zahlungsinformationen"}</p>
            {[
              { l: isDeposit ? "Begünstigter" : "Konto / Zahlbar an", v: [payeeName, payeeStreet, payeePlz].filter(Boolean).join("\n") },
              { l: "IBAN", v: payee?.iban || "—" },
              ...(payeeIsBusiness && payee?.company_uid ? [{ l: "UID", v: payee.company_uid }] : []),
              { l: isDeposit ? "Rückerstattungsbetrag" : "Betrag", v: `CHF ${fmt(total)}` },
              { l: "Zahlungszweck", v: isDeposit ? `Kaution ${ref}` : ref },
            ].map((r, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: 9, color: g, fontFamily: f }}>{r.l}</p>
                <p style={{ margin: "1px 0 0", fontSize: 12, fontWeight: 600, fontFamily: f, whiteSpace: "pre-line" }}>{r.v}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <SwissQRImage payload={qrPayload} size={260} style={{ width: 130, border: "1px solid #eee" }} />
            <p style={{ margin: "3px 0 0", fontSize: 8, color: g, fontFamily: f }}>Mit Banking-App scannen</p>
          </div>
        </div>
        {/* Zahlungsfrist */}
        <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 600, color: "#1a1a1a", fontFamily: f, textAlign: "center" }}>
          {isDeposit ? "Bitte innert 5 Tagen zurückerstatten" : `Zahlbar innert 30 Tagen · Fällig am ${dueDateStr}`}
        </p>
        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 9, color: g, fontFamily: f }}>
          <p style={{ margin: 0 }}>BEEDARO · Gemeindehausstrasse 11B · 6010 Kriens</p>
          {!isDeposit && (
            <p style={{ margin: "2px 0 0", color: "#5B8C5A", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
              <BeeIcon size={9} color="#5B8C5A" /> CHF {fmt(beeImpact)} fliessen in Schweizer Bienenprojekte
            </p>
          )}
        </div>
      </div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 0; }
          .invoice-body { padding: 18mm 22mm 15mm !important; max-width: none !important; }
        }
      `}</style>
    </div>
  );
}
