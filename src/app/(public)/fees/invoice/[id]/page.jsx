"use client";
import { fmtCHF, fmtDateLong as fmtDate, fullName } from "@/lib/formatters";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import BeeIcon from "@/components/shared/BeeIcon";
import { Logo } from "@/components/shared/Logo";
import { colors } from "@/lib/theme";
import { feeQrPayload } from "@/lib/swissQR";
import SwissQRImage from "@/components/shared/SwissQRImage";
import { getCompanySettings, formatIban } from "@/lib/company";
import { makeBeeRef, makeArtRef } from "@/lib/fees";


const f = "'Manrope', sans-serif";
const g = "#888";
const cp = { padding: "8px 10px", fontFamily: f };
const lbl = { margin: "0 0 4px", fontSize: 9, fontWeight: 700, color: g, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: f };

export default function FeeInvoicePage() {
  const params = useParams();
  const [invoice, setInvoice] = useState(null);
  const [fees, setFees] = useState([]);
  const [seller, setSeller] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: inv } = await supabase.from("fee_invoices").select("*").eq("id", params.id).single();
        if (!inv) { setLoading(false); return; }
        setInvoice(inv);
        const { data: items } = await supabase.from("fee_ledger").select("*").eq("fee_invoice_id", inv.id).order("created_at", { ascending: true });
        const pids = [...new Set((items || []).map(i => i.purchase_id).filter(Boolean))];
        let lidMap = {};
        if (pids.length) {
          const { data: purs } = await supabase.from("purchases").select("id, listing_id").in("id", pids);
          lidMap = Object.fromEntries((purs || []).map(p => [p.id, p.listing_id]));
        }
        setFees((items || []).map(i => ({ ...i, listing_id: lidMap[i.purchase_id] || null })));
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", inv.seller_id).single();
        setSeller(prof);
        setCompany(await getCompanySettings());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [params.id]);

  if (loading) return <div style={{ fontFamily: f, padding: 60, textAlign: "center", color: g }}>Lade...</div>;
  if (!invoice) return <div style={{ fontFamily: f, padding: 60, textAlign: "center", color: g }}>Rechnung nicht gefunden</div>;

  const monthName = new Date(invoice.period_year, invoice.period_month - 1).toLocaleString("de-CH", { month: "long", year: "numeric" });
  const total = parseFloat(invoice.total_fees);
  const beeImpact = parseFloat(invoice.total_bee_impact);
  const dueDate = fmtDate(invoice.due_date);
  const ref = invoice.invoice_ref;

  // Firma als Empfänger (aus company_settings)
  const co = company || {};
  const beedaroIbanDisplay = formatIban(co.iban);
  const coAddr = [co.name, co.street, `${co.postal_code || ""} ${co.city || ""}`.trim()].filter(Boolean);

  // QR für Zahlung an die Firma
  const qrPayload = feeQrPayload(invoice, seller, company);

  const sellerAddr = [fullName(seller), seller?.street, `${seller?.postal_code || ""} ${seller?.city || ""}`.trim()].filter(Boolean);

  return (
    <div style={{ fontFamily: f, background: "#fff", minHeight: "100vh", color: "#1a1a1a" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "center", padding: 16, background: colors.cream }}>
        <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 999, border: "none", background: colors.yellow, color: "#1a1a1a", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: f }}>
          <Printer size={16} /> Drucken / PDF
        </button>
      </div>

      <div className="invoice-body" style={{ maxWidth: 660, margin: "0 auto", padding: "28px clamp(16px, 5vw, 36px) 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <Logo width={130} />
          <div style={{ textAlign: "right", fontSize: 10, color: g, fontFamily: f, lineHeight: 1.6 }}>Gemeindehausstrasse 11B<br/>6010 Kriens, Schweiz</div>
        </div>

        {/* Titel */}
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 4px", fontFamily: f }}>GEBÜHRENRECHNUNG</h1>
        <p style={{ margin: "0 0 16px", fontSize: 11, color: g, fontFamily: f }}>
          Ref: <strong style={{ color: "#1a1a1a" }}>{ref}</strong> · Periode: <strong style={{ color: "#1a1a1a" }}>{monthName}</strong>
        </p>

        {/* Adressen */}
        <div className="inv-addr" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 18 }}>
          <div>
            <p style={lbl}>Rechnungssteller</p>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, fontFamily: f }}>{co.name}</p>
            <p style={{ margin: "1px 0", fontSize: 11, color: "#666", fontFamily: f }}>{co.street}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#666", fontFamily: f }}>{`${co.postal_code || ""} ${co.city || ""}`.trim()}{co.country === "CH" ? ", Schweiz" : co.country ? `, ${co.country}` : ""}</p>
            {co.uid && <p style={{ margin: "1px 0 0", fontSize: 10, color: "#888", fontFamily: f }}>{co.uid}</p>}
            {/* Verbindet die Marke im Kopf mit der juristischen Person im Zahlteil.
                Der Kreditor muss dem Kontoinhaber entsprechen, darum steht die
                Marke hier als Zusatz und nicht im Empfaengerfeld. */}
            <p style={{ margin: "3px 0 0", fontSize: 10, color: "#888", fontFamily: f }}>
              BEEDARO ist eine Marke von MOQRO.
            </p>
          </div>
          <div>
            <p style={lbl}>Verkäufer / Rechnungsempfänger</p>
            {sellerAddr.map((ln, i) => <p key={i} style={{ margin: 0, fontSize: i === 0 ? 12 : 11, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? "#1a1a1a" : "#666", fontFamily: f, lineHeight: 1.5 }}>{ln}</p>)}
          </div>
        </div>

        {/* Positionen */}
        <div className="inv-tablewrap"><table style={{ width: "100%", borderCollapse: "collapse", fontFamily: f, minWidth: 480 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #1a1a1a" }}>
              <th style={{ ...cp, paddingLeft: 0, textAlign: "left", fontSize: 9, fontWeight: 700, color: g, textTransform: "uppercase" }}>Datum</th>
              <th style={{ ...cp, textAlign: "left", fontSize: 9, fontWeight: 700, color: g, textTransform: "uppercase" }}>Artikel</th>
              <th style={{ ...cp, textAlign: "right", fontSize: 9, fontWeight: 700, color: g, textTransform: "uppercase" }}>Preis</th>
              <th style={{ ...cp, textAlign: "center", fontSize: 9, fontWeight: 700, color: g, textTransform: "uppercase" }}>%</th>
              <th style={{ ...cp, textAlign: "right", fontSize: 9, fontWeight: 700, color: g, textTransform: "uppercase" }}>Gebühr</th>
              <th style={{ ...cp, paddingRight: 0, textAlign: "right", fontSize: 9, fontWeight: 700, color: g, textTransform: "uppercase" }}>Impact</th>
            </tr>
          </thead>
          <tbody>
            {fees.map(fee => (
              <tr key={fee.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ ...cp, paddingLeft: 0, fontSize: 11 }}>{new Date(fee.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}</td>
                <td style={{ ...cp, fontSize: 11, fontWeight: 600 }}>
                  {fee.listing_title}
                  {fee.purchase_id && <span style={{ display: "block", fontSize: 9, color: g, fontWeight: 400 }}>{makeBeeRef(fee.purchase_id)}{fee.listing_id ? ` · ${makeArtRef(fee.listing_id)}` : ""}</span>}
                </td>
                <td style={{ ...cp, fontSize: 11, textAlign: "right" }}>CHF {fmtCHF(fee.sale_price)}</td>
                <td style={{ ...cp, fontSize: 11, textAlign: "center", color: g }}>{parseFloat(fee.fee_percent)}%</td>
                <td style={{ ...cp, fontSize: 11, textAlign: "right", fontWeight: 600 }}>CHF {fmtCHF(fee.fee_amount)}</td>
                <td style={{ ...cp, paddingRight: 0, fontSize: 11, textAlign: "right", color: "#5B8C5A" }}>CHF {fmtCHF(fee.bee_impact)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #1a1a1a" }}>
              <td colSpan={4} style={{ ...cp, paddingLeft: 0, fontSize: 14, fontWeight: 800 }}>Gesamtpreis</td>
              <td style={{ ...cp, fontSize: 16, fontWeight: 800, textAlign: "right" }}>CHF {fmtCHF(total)}</td>
              <td style={{ ...cp, paddingRight: 0, fontSize: 11, textAlign: "right", color: "#5B8C5A", fontWeight: 600 }}>CHF {fmtCHF(beeImpact)}</td>
            </tr>
          </tfoot>
        </table></div>

        {/* Bee-Impact Info */}
        <p style={{ margin: "0 0 16px", padding: "8px 12px", background: "#f8f8f8", borderRadius: 0, fontSize: 10, color: "#666", fontFamily: f, lineHeight: 1.5 }}>
          Von den Gebühren (CHF {fmtCHF(total)}) fliessen CHF {fmtCHF(beeImpact)} als Bee-Impact direkt in Schweizer Bienen- und Naturschutzprojekte.
        </p>

        {/* Zahlung + QR */}
        <div className="inv-pay" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: "14px 18px", border: "1px solid #E4E0D8", borderRadius: 12, marginBottom: 16 }}>
          <div style={{ fontFamily: f }}>
            <p style={{ ...lbl, marginBottom: 8 }}>Zahlungsinformationen</p>
            {[
              { l: "Konto / Zahlbar an", v: coAddr.join("\n") },
              { l: "IBAN", v: beedaroIbanDisplay },
              { l: "Betrag", v: `CHF ${fmtCHF(total)}` },
              { l: "Verwendungszweck", v: ref },
            ].map((r, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: 9, color: g, fontFamily: f }}>{r.l}</p>
                <p style={{ margin: "1px 0 0", fontSize: 12, fontWeight: 600, fontFamily: f, whiteSpace: "pre-line" }}>{r.v}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {qrPayload ? (
              <>
                <SwissQRImage payload={qrPayload} size={260} style={{ width: 130, border: "1px solid #eee" }} />
                <p style={{ margin: "3px 0 0", fontSize: 8, color: g, fontFamily: f }}>Mit Banking-App scannen</p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 9, color: g, fontFamily: f, textAlign: "center", maxWidth: 130 }}>
                Zahlteil nicht verfügbar. Bitte die IBAN oben manuell erfassen.
              </p>
            )}
          </div>
        </div>

        {/* Zahlungsfrist */}
        <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 600, color: "#1a1a1a", fontFamily: f, textAlign: "center" }}>
          Zahlbar innert 30 Tagen · Fällig am {dueDate}
        </p>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 9, color: g, fontFamily: f }}>
          <p style={{ margin: 0 }}>{coAddr.join(" · ")}{co.uid ? ` · ${co.uid}` : ""}</p>
          {(co.contact_email || co.contact_phone) && <p style={{ margin: "2px 0 0" }}>{[co.contact_email, co.contact_phone].filter(Boolean).join(" · ")}</p>}
          <p style={{ margin: "2px 0 0", color: "#5B8C5A", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
            <BeeIcon size={9} color="#5B8C5A" /> CHF {fmtCHF(beeImpact)} fliessen in Schweizer Bienenprojekte
          </p>
        </div>
      </div>

      <style>{`
        .inv-tablewrap { overflow-x: auto; margin-bottom: 14px; }
        @media (max-width: 560px) {
          .inv-addr { grid-template-columns: 1fr !important; gap: 14px !important; }
          .inv-pay { grid-template-columns: 1fr !important; }
          .inv-pay > div:last-child { align-items: flex-start !important; }
        }
        @media print { .no-print{display:none!important} html,body{margin:0!important;padding:0!important;background:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact} @page{size:A4;margin:0} .invoice-body{padding:18mm 22mm 15mm!important;max-width:none!important} }`}</style>
    </div>
  );
}
