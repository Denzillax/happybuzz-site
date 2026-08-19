"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Package, CreditCard, Truck, CheckCircle, Clock, MapPin, X, ExternalLink,
  ShoppingBag, Star, AlertTriangle, Loader2, ArrowLeft, Copy, FileText,
  User, Tag, Box, ChevronDown, ChevronUp, Wrench,
} from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import {
  getPurchaseDetail, getPurchaseEvents, markAsPaid, confirmPayment,
  markAsShipped, markAsPickedUp, confirmDelivery, completeTransaction,
  addPurchaseEvent, markAsReturned, confirmReturn, reportDamage, acceptDamage, confirmDepositReturned,
  uploadDamagePhotos, submitServiceInvoice,
} from "@/lib/listings";
import { colors, fonts, radius } from "@/lib/theme";
import { fmtCHF, fullName, shippingMethodLabel } from "@/lib/formatters";
import { makeBeeRef, makeArtRef, DEFAULT_FEE_PERCENT } from "@/lib/fees";
import ServiceInvoiceEditor from "@/components/order/ServiceInvoiceEditor";
import { getInvoiceItems } from "@/lib/api/invoices";
import OrderTimeline from "@/components/order/OrderTimeline";
import RatingSection from "@/components/order/RatingSection";
import { RentalCountdown } from "@/components/order/RentalCountdown";
import { VerifiedSellerBadge } from "@/components/shared/VerifiedSellerBadge";

import { PURCHASE_STATUS as STATUS_MAP } from "@/lib/orderStatus";
import { serviceQrPayload } from "@/lib/swissQR";
import SwissQRImage from "@/components/shared/SwissQRImage";

// Katalog-Tokens (wie öffentliche Seiten)
const K = { ink: "#14110D", sand: "#F9F4EC", paper: "#FBF8F2", honey: "#F4C03F", petrol: "#0B5E5C", moss: "#5B8C5A" };
const MONO = "'Space Mono', monospace";
const HEAD = "'General Sans','Manrope',sans-serif";

const EVENT_ICONS = {
  purchased: ShoppingBag, payment_marked: CreditCard, payment_confirmed: CheckCircle,
  payment_rejected: X, shipped: Truck, picked_up: MapPin,
  delivered: CheckCircle, completed: Star, disputed: AlertTriangle, cancelled: X,
  return_marked: Package, return_confirmed: CheckCircle, damage_reported: AlertTriangle,
  damage_accepted: CheckCircle, deposit_returned: CreditCard,
};

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: copied ? "#5B8C5A" : colors.muted, display: "flex", alignItems: "center", transition: "color .2s" }}
      title="Kopieren">
      {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
    </button>
  );
}

function SidebarSection({ icon: Icon, title, children }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
      <div style={{ flexShrink: 0, marginTop: 1 }}><Icon size={18} color={colors.muted} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{children}</div>
      </div>
    </div>
  );
}

function ServiceInvoiceView({ purchaseId, totalPrice, sellerProfile, onPay, acting }) {
  const [items, setItems] = useState([]);
  useEffect(() => { getInvoiceItems(purchaseId).then(setItems); }, [purchaseId]);

  const total = parseFloat(totalPrice || 0);

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>Service-Rechnung</h3>
      {items.length > 0 ? (
        <div style={{ background: "#F9F4EC", borderRadius: 0, padding: "14px 16px", marginBottom: 12 }}>
          {items.map((item, i) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < items.length - 1 ? "1px solid #e8e4df" : "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{item.label}</div>
                {item.description && <div style={{ fontSize: 11, color: colors.muted }}>{item.description}</div>}
                <div style={{ fontSize: 11, color: colors.muted }}>{parseFloat(item.quantity)} x CHF {parseFloat(item.unit_price).toFixed(2)}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, whiteSpace: "nowrap" }}>CHF {parseFloat(item.total).toFixed(2)}</div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, paddingTop: 10, marginTop: 4, borderTop: "2px solid #e8e4df" }}>
            <span>Total</span><span>CHF {total.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <div style={{ padding: "12px 14px", background: "#F9F4EC", borderRadius: 0, fontSize: 13, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16 }}>
            <span>Total</span><span>CHF {total.toFixed(2)}</span>
          </div>
        </div>
      )}
      {serviceQrPayload(purchaseId, total, sellerProfile) && (
        <div style={{ display: "flex", gap: 14, padding: "14px 16px", background: "#fff", borderRadius: 0, border: `1px solid ${colors.borderLt}`, marginBottom: 12 }}>
          <SwissQRImage payload={serviceQrPayload(purchaseId, total, sellerProfile)} size={200} style={{ width: 100, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: colors.muted }}>
            <div style={{ fontWeight: 700, color: colors.dark, marginBottom: 4 }}>QR-Zahlung</div>
            <div>IBAN: {sellerProfile?.iban || ""}</div>
            <div>Betrag: CHF {total.toFixed(2)}</div>
            <div style={{ marginTop: 6, fontSize: 11 }}>Mit Banking-App scannen</div>
          </div>
        </div>
      )}
      <button onClick={onPay} disabled={acting} style={{ width: "100%", padding: 14, borderRadius: 0, border: "none", background: "#0E9493", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
        {acting ? "Wird gespeichert..." : "Ich habe bezahlt"}
      </button>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [purchase, setPurchase] = useState(null);
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [serviceHours, setServiceHours] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [showTracking, setShowTracking] = useState(false);
  const [damageAmount, setDamageAmount] = useState("");
  const [damageDesc, setDamageDesc] = useState("");
  const [showDamageForm, setShowDamageForm] = useState(false);
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const [booking, setBooking] = useState(null);
  const [damageFiles, setDamageFiles] = useState([]);
  const [salePopup, setSalePopup] = useState(null);
  const [myAddresses, setMyAddresses] = useState([]);
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrSaving, setAddrSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) setUser(session.user);
        let p;
        try { p = await getPurchaseDetail(params.id); } catch {
          const { data } = await supabase.from("purchases").select("id").eq("listing_id", params.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
          if (data) p = await getPurchaseDetail(data.id);
        }
        if (p) {
          setPurchase(p);
          const ev = await getPurchaseEvents(p.id);
          // Deduplizieren (gleicher event_type + ähnliche Zeit)
          const seen = new Set();
          const unique = ev.filter(e => {
            const key = `${e.event_type}-${Math.floor(new Date(e.created_at).getTime() / 120000)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setEvents(unique);
          if (session?.user) {
            const { data: r } = await supabase.from("ratings").select("*").eq("purchase_id", p.id).eq("rater_id", session.user.id).maybeSingle();

          }
          // Load rental booking dates if rental
          if (p.listing?.listing_type === "rent") {
            const { data: bk } = await supabase.from("rental_bookings").select("*").eq("purchase_id", p.id).maybeSingle();
            if (bk) setBooking(bk);
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [params.id]);

  // Lieferadressen des Käufers laden (nur er darf die Bestelladresse wählen)
  useEffect(() => {
    if (!purchase || !user || user.id !== purchase.buyer_id) return;
    supabase.from("user_addresses").select("*").eq("user_id", user.id).order("created_at")
      .then(({ data }) => setMyAddresses(data || []));
  }, [purchase?.id, user?.id]);

  // Verkaufs-Popup für den Verkäufer, einmalig pro Bestellung.
  // Bei Mieten erst bei "completed": "delivered" heisst dort nur, dass der
  // Mieter den Artikel erhalten hat, die Vermietung laeuft noch (Bug: der
  // Abgeschlossen-Dialog sprang mitten in der Mietzeit auf).
  useEffect(() => {
    if (!purchase || !user) return;
    const mietet = purchase.listing?.listing_type === "rent";
    const finished = purchase.status === "completed" || (!mietet && purchase.status === "delivered");
    if (!finished || purchase.seller_id !== user.id) return;
    const key = `beedaro_sale_popup_${purchase.id}`;
    // Sperre SOFORT setzen, nicht erst nach dem Laden: sonst zeigt ein
    // doppelt laufender Effekt (StrictMode/schnelle Reloads) den Dialog zweimal
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch {}
    (async () => {
      try {
        const [{ data: xp }, { data: nk }, { data: prof }] = await Promise.all([
          supabase.from("xp_log").select("amount").eq("user_id", user.id).eq("reference_id", purchase.id),
          supabase.from("nektar_log").select("amount").eq("user_id", user.id).eq("reference_id", purchase.id),
          supabase.from("profiles").select("nektar").eq("id", user.id).maybeSingle(),
        ]);
        const pollen = (xp || []).reduce((s, r) => s + (r.amount || 0), 0);
        const nektar = (nk || []).reduce((s, r) => s + (r.amount || 0), 0);
        setSalePopup({ pollen, nektar, balance: prof?.nektar || 0 });
      } catch {}
    })();
  }, [purchase, user]);

  const reload = async () => {
    if (!purchase) return;
    const p = await getPurchaseDetail(purchase.id);
    setPurchase(p);
    setEvents(await getPurchaseEvents(purchase.id));
  };
  const doAction = async (fn, ...args) => {
    setActing(true);
    try { await fn(...args); await reload(); } catch (err) { console.error(err); toast.error(err?.message || "Aktion fehlgeschlagen. Bitte erneut versuchen."); } finally { setActing(false); }
  };
;

  if (loading) return <div style={{ fontFamily: fonts.body, background: K.paper, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 size={24} color={colors.muted} style={{ animation: "spin 1s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  if (!purchase) return (
    <div style={{ fontFamily: fonts.body, background: K.paper, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <Package size={40} color={colors.mutedLt} style={{ marginBottom: 10 }} />
        <p style={{ fontSize: 17, fontWeight: 800, color: colors.dark, margin: "0 0 4px" }}>Bestellung nicht gefunden</p>
        <p style={{ fontSize: 14, color: colors.muted, margin: "0 0 18px" }}>Diese Bestellung existiert nicht mehr oder gehört nicht zu deinem Konto.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/purchases" style={{ padding: "11px 20px", borderRadius: 0, background: K.honey, color: K.ink, fontSize: 14, fontWeight: 800, textDecoration: "none", border: `1.5px solid ${K.ink}`, boxShadow: `3px 3px 0 ${K.ink}` }}>Meine Käufe</Link>
          <Link href="/sales" style={{ padding: "11px 20px", borderRadius: 0, background: "#fff", border: `1.5px solid ${K.ink}`, color: K.ink, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Meine Verkäufe</Link>
        </div>
      </div>
    </div>
  );

  const p = purchase;
  const isBuyer = user?.id === p.buyer_id;
  const isSeller = user?.id === p.seller_id;
  const listing = p.listing;
  const isRental = listing?.listing_type === "rent";
  const isService = listing?.listing_type === "service";
  const status = STATUS_MAP[p.status] || STATUS_MAP.confirmed;
  const img = listing?.listing_images?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))?.[0]?.url;
  const beeRef = makeBeeRef(p.id);
  const artRef = makeArtRef(p.listing_id);
  const shippingCost = parseFloat(listing?.shipping_cost || 0);
  // Miete: die Kaution wird mit der Miete bezahlt (und nach Rueckgabe per
  // Kautions-Rechnung zurueckerstattet), gehoert also in den Zahlbetrag
  const rentDeposit = isRental ? parseFloat(listing?.deposit_amount || 0) : 0;
  const totalPrice = parseFloat(p.price || 0) + shippingCost + rentDeposit;
  const pageTitle = isService ? (isSeller ? "Service-Auftrag" : "Service") : isRental ? (isSeller ? "Vermietung" : "Miete") : (isSeller ? "Verkauf" : "Kauf");
  const isFinished = isRental ? p.status === "completed" : (p.status === "delivered" || p.status === "completed");
  const finishedLabel = isRental ? (isSeller ? "Vermietung abgeschlossen" : "Miete abgeschlossen") : (isSeller ? "Verkauf abgeschlossen" : "Kauf abgeschlossen");
  const depositAmount = parseFloat(listing?.deposit_amount || 0);
  const shipMethodLabel = shippingMethodLabel(listing?.shipping_method) || "–";
  const shipSpeedLabel = listing?.ship_speed === "priority" ? "A-Post" : "B-Post";
  const shippingLabel = listing?.free_shipping ? `${shipMethodLabel} ${shipSpeedLabel} (Gratis)` : `${shipMethodLabel} ${shipSpeedLabel}`;
  const counterpart = isBuyer ? p.seller : p.buyer;
  // Lieferadresse: Schnappschuss an der Bestellung, sonst Profil-Hauptadresse.
  const deliveryAddr = p.delivery_address
    || (p.buyer ? { name: fullName(p.buyer), street: p.buyer.street, postal_code: p.buyer.postal_code, city: p.buyer.city } : null);
  // Aenderbar nur durch den Kaeufer, bei Versandartikeln, bis der Verkaeufer
  // versendet hat (danach ist die Adresse unterwegs).
  const addrChangeable = isBuyer && !isService && listing?.shipping_available
    && ["confirmed", "payment_pending", "payment_marked", "paid"].includes(p.status);
  // Abholadresse bei reiner Abholung: am Inserat gewaehlter Schnappschuss,
  // sonst die Hauptadresse des Verkaeufers.
  const pickupAddr = (!isService && listing?.pickup_only && !listing?.shipping_available)
    ? (listing?.pickup_address
        || (p.seller?.street ? { street: p.seller.street, postal_code: p.seller.postal_code, city: p.seller.city } : null))
    : null;
  const counterpartLabel = isRental ? (isBuyer ? "Vermietet von" : "Gemietet von") : (isBuyer ? "Verkauft von" : "Verkauft an");
  const fmtDate = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const sortedEvents = [...events];
  const visibleEvents = showFullTimeline ? sortedEvents : sortedEvents.slice(0, 2);
  const trackingEvent = events.find(e => e.tracking_number);
  // Uebergabe-Zeitpunkt fuer den Miet-Countdown: aus der Timeline (die
  // Status-Spalten wie buyer_confirmed_at werden im Flow nicht gestempelt)
  const handoverAt = events.find(e => e.event_type === "delivered" || e.event_type === "picked_up")?.created_at || p.buyer_confirmed_at;

  function getEventDisplay(ev) {
    switch (ev.event_type) {
      case "purchased": return isRental
        ? (isBuyer ? "Du hast den Artikel gemietet!" : "Dein Artikel wurde gemietet!")
        : (isBuyer ? "Gratuliere, der Artikel gehört dir!" : "Gratuliere, du hast diesen Artikel verkauft!");
      case "payment_marked": return isBuyer ? "Du hast als bezahlt markiert." : (isRental ? "Mieter hat als bezahlt markiert. Muss überprüft werden." : "Käufer hat den Kauf als bezahlt markiert. Muss überprüft werden.");
      case "payment_confirmed": return isSeller ? "Du hast die Zahlung erhalten." : (isRental ? "Der Vermieter hat die Zahlung erhalten." : "Der Verkäufer hat die Zahlung erhalten.");
      case "payment_rejected": return isSeller ? "Du hast die Zahlung abgelehnt." : (isRental ? "Der Vermieter hat die Zahlung abgelehnt." : "Der Verkäufer hat die Zahlung abgelehnt.");
      case "shipped": return isSeller ? "Du hast den Artikel verschickt" : (isRental ? "Der Vermieter hat den Artikel verschickt." : "Der Verkäufer hat den Artikel verschickt.");
      case "picked_up": return isSeller ? "Du hast den Artikel übergeben." : "Du hast den Artikel abgeholt.";
      case "delivered": return isBuyer ? "Du hast den Artikel erhalten." : (isRental ? "Der Mieter hat den Artikel erhalten." : "Der Käufer hat den Artikel erhalten.");
      case "return_marked": return isBuyer ? "Du hast den Artikel zurückgegeben." : "Der Mieter hat die Rückgabe markiert.";
      case "return_confirmed": return isSeller ? "Du hast die Rückgabe bestätigt." : "Der Vermieter hat die Rückgabe bestätigt.";
      case "damage_reported": return isSeller ? "Du hast einen Schaden gemeldet." : "Der Vermieter hat einen Schaden gemeldet.";
      case "damage_accepted": return isBuyer ? "Du hast die Schadensmeldung akzeptiert." : "Der Mieter hat die Schadensmeldung akzeptiert.";
      case "deposit_returned": return isSeller ? "Du hast die Kaution zurückerstattet." : "Die Kaution wurde zurückerstattet.";
      case "service_invoiced": return isSeller ? `Rechnung erstellt: ${ev.message}` : `Rechnung erhalten: ${ev.message}`;
      case "completed": return finishedLabel;
      default: return ev.message || ev.event_type;
    }
  }
  function getEventCategory(ev) {
    switch (ev.event_type) {
      case "purchased": return isRental ? (isSeller ? "Artikel vermietet" : "Artikel gemietet") : (isSeller ? "Artikel verkauft" : "Artikel gekauft");
      case "payment_marked": case "payment_confirmed": case "payment_rejected": return "Zahlung";
      case "shipped": case "picked_up": case "delivered": return isRental ? "Übergabe" : "Lieferung";
      case "return_marked": case "return_confirmed": return "Rückgabe";
      case "damage_reported": case "damage_accepted": return "Schaden";
      case "deposit_returned": return "Kaution";
      case "service_invoiced": return "Rechnung";
      case "completed": return finishedLabel;
      default: return ev.event_type;
    }
  }

  return (
    <div style={{ fontFamily: fonts.body, background: K.paper, minHeight: "100vh", color: colors.dark }}>

      {/* Verkaufs-Popup (Verkäufer, einmalig) */}
      {salePopup && (
        <div onClick={() => setSalePopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 0, padding: "28px 26px", maxWidth: 360, width: "100%", textAlign: "center", fontFamily: fonts.body }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E6F5F5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Star size={28} color={colors.teal} fill={colors.teal} />
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 900, fontFamily: fonts.head, color: colors.dark }}>{finishedLabel}!</h3>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "0 0 14px", flexWrap: "wrap" }}>
              {salePopup.pollen > 0 && <span style={{ fontSize: 13, fontWeight: 800, color: "#5B8C5A", background: "#5B8C5A14", padding: "6px 12px", borderRadius: 0 }}>+{salePopup.pollen} Pollen</span>}
              {salePopup.nektar > 0 && <span style={{ fontSize: 13, fontWeight: 800, color: "#C8860A", background: "#E8A82014", padding: "6px 12px", borderRadius: 0 }}>+{salePopup.nektar} Nektar</span>}
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: colors.muted }}>Du hast jetzt <b style={{ color: "#C8860A" }}>{salePopup.balance} Nektar</b>. Einlösen?</p>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/hive" onClick={() => setSalePopup(null)} style={{ flex: 1, padding: "12px 0", borderRadius: 0, background: K.petrol, color: "#fff", fontSize: 14, fontWeight: 800, textDecoration: "none" }}>Belohnungen einlösen</Link>
              <button onClick={() => setSalePopup(null)} style={{ padding: "12px 18px", borderRadius: 0, border: `1.5px solid ${colors.border}`, background: "#fff", color: colors.muted, fontSize: 13, cursor: "pointer", fontFamily: fonts.body }}>Schliessen</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 80px" }}>

        <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: colors.muted, fontFamily: fonts.body, marginBottom: 20, padding: 0 }}>
          <ArrowLeft size={16} /> Zurück
        </button>

        <div style={{ fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: ".18em", textTransform: "uppercase", color: K.petrol, marginBottom: 8 }}>Übergabe-Protokoll · Katalog der zweiten Leben</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: HEAD, letterSpacing: "-0.01em", margin: "0 0 20px", display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          {pageTitle} <span style={{ fontWeight: 700, color: colors.muted, fontSize: 13, fontFamily: MONO }}>{beeRef}</span>
        </h1>

        {/* Produkt-Card */}
        <div style={{ background: "#fff", borderRadius: 0, border: `1px solid ${K.ink}`, padding: 20, marginBottom: 16, display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: 0, overflow: "hidden", background: colors.cream, border: `1px solid ${K.ink}`, flexShrink: 0 }}>
            {img ? <img src={img.startsWith("http") ? img : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${img}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={24} color={colors.muted} /></div>}
          </div>
          <div>
            <Link href={`/listing/${p.listing_id}`} style={{ fontSize: 16, fontWeight: 700, color: colors.dark, textDecoration: "none" }}>{listing?.title || "Artikel"}</Link>
            <div style={{ fontSize: 13, color: colors.muted, marginTop: 3 }}>{isService ? (isSeller ? "Service-Auftrag" : "Gebucht") : isRental ? (isSeller ? "Vermietet" : "Gemietet") : (isSeller ? "Verkauft" : "Gekauft")} am: {fmtDate(p.created_at)}</div>
            {!isService && <div style={{ fontSize: 13, color: colors.muted }}>Lieferart: {shippingLabel}</div>}
            <div style={{ fontSize: 13, color: colors.muted }}>{isService && p.notes ? p.notes : `Gesamtpreis: ${fmtCHF(totalPrice)}`}</div>
          </div>
        </div>

        {/* 2-Spalten */}
        <div className="order-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
          {/* LINKE SPALTE */}
          <div>
            {/* Status-Banner */}
            {isFinished && (
              <div style={{ background: "#E8F5E9", borderRadius: 0, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle size={20} color="#5B8C5A" />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#5B8C5A" }}>{finishedLabel}</div>
                  <div style={{ fontSize: 13, color: "#5B8C5A" }}>Fertig!</div>
                </div>
              </div>
            )}

            {/* Aktions-Box */}
            {!isFinished && (
              <div style={{ background: "#fff", borderRadius: 0, border: `1px solid ${K.ink}`, padding: 20, marginBottom: 16 }}>

                {/* SERVICE: Anbieter erstellt Rechnung mit Positionen */}
                {isService && isSeller && p.status === "confirmed" && (
                  <ServiceInvoiceEditor
                    purchaseId={p.id}
                    sellerId={user.id}
                    feePercent={listing?.fee_percentage || DEFAULT_FEE_PERCENT}
                    onSubmitted={() => window.location.reload()}
                  />
                )}
                {/* SERVICE: Kunde wartet */}
                {isService && isBuyer && p.status === "confirmed" && (
                  <div style={{ textAlign: "center", padding: 16 }}><Clock size={32} color="#F4C03F" style={{ marginBottom: 8 }} /><p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Termin bestaetigt</p><p style={{ fontSize: 13, color: "#9A9490", margin: 0 }}>Der Anbieter fuehrt den Service durch und sendet dir anschliessend die Rechnung.</p></div>
                )}
                {/* SERVICE: Rechnung erhalten — mit Positionen */}
                {isService && isBuyer && p.status === "payment_pending" && (
                  <ServiceInvoiceView purchaseId={p.id} totalPrice={p.price} sellerProfile={p.seller} onPay={() => doAction(markAsPaid, p.id, user.id)} acting={acting} />
                )}
                {/* SERVICE: Buyer hat bezahlt, wartet */}
                {isService && isBuyer && p.status === "payment_marked" && (
                  <div style={{ textAlign: "center", padding: 16 }}><Clock size={28} color="#0E9493" style={{ marginBottom: 8 }} /><p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Zahlung markiert</p><p style={{ fontSize: 13, color: "#9A9490", margin: 0 }}>Der Anbieter prüft deine Zahlung.</p></div>
                )}
                {/* SERVICE: Anbieter wartet auf Zahlung */}
                {isService && isSeller && p.status === "payment_pending" && (
                  <div style={{ textAlign: "center", padding: 16 }}><FileText size={32} color="#0E9493" style={{ marginBottom: 8 }} /><p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Rechnung gesendet</p><p style={{ fontSize: 13, color: "#9A9490", margin: "0 0 4px" }}>{p.notes}</p><p style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>CHF {parseFloat(p.price || 0).toFixed(2)}</p></div>
                )}
                {/* SERVICE: Seller sieht Zahlung markiert */}
                {isService && isSeller && p.status === "payment_marked" && (
                  <div><h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>Zahlung pruefen</h3><p style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>Der Kunde hat CHF {parseFloat(p.price || 0).toFixed(2)} als bezahlt markiert.</p><button onClick={() => doAction(confirmPayment, p.id, user.id)} disabled={acting} style={{ width: "100%", padding: 14, borderRadius: 0, border: "none", background: "#0E9493", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>{acting ? "Wird gespeichert..." : "Zahlung erhalten"}</button></div>
                )}

                {!isService && isBuyer && (p.status === "confirmed" || p.status === "pending_payment") && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>Zahlung</h3>
                    <p style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>Überweise den Betrag an den Verkäufer und bestätige die Zahlung.</p>
                    <button onClick={() => doAction(markAsPaid, p.id, user.id)} disabled={acting} style={{ width: "100%", padding: 14, borderRadius: 0, border: `1.5px solid ${K.ink}`, background: K.petrol, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>{acting ? "Wird gespeichert..." : "Ich habe bezahlt"}</button>
                  </div>
                )}
                {!isService && isBuyer && (p.status === "payment_pending" || p.status === "payment_marked") && (
                  <div style={{ textAlign: "center", padding: 10 }}><Clock size={28} color="#F4A100" style={{ marginBottom: 8 }} /><p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Zahlung markiert</p><p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Der Verkäufer prüft deine Zahlung.</p></div>
                )}
                {!isService && isSeller && (p.status === "confirmed" || p.status === "pending_payment" || p.status === "payment_pending" || p.status === "payment_marked") && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>Zahlung</h3>
                    {(p.status === "payment_pending" || p.status === "payment_marked") ? (
                      <p style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>Der Käufer hat die Zahlung als erledigt markiert. Du kannst den Eingang bestätigen.</p>
                    ) : (
                      <p style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>Sobald die Zahlung bei dir eingegangen ist, bestätige den Eingang, auch wenn der Käufer noch nicht markiert hat.</p>
                    )}
                    <button onClick={() => doAction(confirmPayment, p.id, user.id)} disabled={acting} style={{ width: "100%", padding: 14, borderRadius: 0, border: `1.5px solid ${K.ink}`, background: K.petrol, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>{acting ? "Wird gespeichert..." : "Zahlung erhalten"}</button>
                  </div>
                )}
                {!isService && isSeller && p.status === "paid" && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>Versand / Übergabe</h3>
                    {listing?.shipping_available && (
                      <>
                        <p style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>Lieferadresse:</p>
                        <div style={{ padding: 12, background: K.sand, borderRadius: 0, border: `1px solid ${K.ink}22`, marginBottom: 14, fontSize: 13, lineHeight: 1.5 }}>
                          <strong>{deliveryAddr?.name}</strong>{deliveryAddr?.company && <><br />{deliveryAddr.company}</>}<br />{deliveryAddr?.street && <>{deliveryAddr.street}<br /></>}{(deliveryAddr?.postal_code || deliveryAddr?.city) && <>{deliveryAddr.postal_code} {deliveryAddr.city}</>}
                        </div>
                        {!showTracking ? (
                          <button onClick={() => setShowTracking(true)} style={{ width: "100%", padding: 14, borderRadius: 0, border: `1.5px solid ${K.ink}`, background: K.petrol, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>Als versendet markieren</button>
                        ) : (
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: colors.muted, display: "block", marginBottom: 4 }}>Sendungsnummer (optional)</label>
                            <input value={trackingInput} onChange={e => setTrackingInput(e.target.value)} placeholder="z.B. 996000648206316303" style={{ width: "100%", padding: "10px 12px", borderRadius: 0, border: `1.5px solid ${K.ink}`, fontSize: 14, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
                            <button onClick={() => doAction(markAsShipped, p.id, user.id, trackingInput)} disabled={acting} style={{ width: "100%", padding: 14, borderRadius: 0, border: `1.5px solid ${K.ink}`, background: K.petrol, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>{acting ? "Wird gespeichert..." : "Versand bestätigen"}</button>
                          </div>
                        )}
                      </>
                    )}
                    {listing?.pickup_only && !listing?.shipping_available && (
                      <button onClick={() => doAction(markAsPickedUp, p.id, user.id)} disabled={acting} style={{ width: "100%", padding: 14, borderRadius: 0, border: `1.5px solid ${K.ink}`, background: K.petrol, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>{acting ? "Wird gespeichert..." : "Als übergeben markieren"}</button>
                    )}
                  </div>
                )}
                {!isService && isBuyer && p.status === "paid" && (
                  <div style={{ textAlign: "center", padding: 10 }}><Truck size={28} color="#94B9C9" style={{ marginBottom: 8 }} /><p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Bezahlt</p><p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Der Verkäufer bereitet den Versand vor.</p></div>
                )}
                {/* SERVICE: Zahlung bestätigt -> Auftrag abschliessen */}
                {isService && isSeller && p.status === "paid" && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>Auftrag abschliessen</h3>
                    <p style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>Zahlung erhalten. Schliesse den Service-Auftrag ab.</p>
                    <button onClick={() => doAction(completeTransaction, p.id, user.id)} disabled={acting} style={{ width: "100%", padding: 14, borderRadius: 0, border: `1.5px solid ${K.ink}`, background: K.petrol, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>{acting ? "Wird gespeichert..." : "Auftrag abschliessen"}</button>
                  </div>
                )}
                {isService && isBuyer && p.status === "paid" && (
                  <div style={{ textAlign: "center", padding: 10 }}><Clock size={28} color="#0E9493" style={{ marginBottom: 8 }} /><p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Zahlung bestätigt</p><p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Der Anbieter schliesst den Auftrag ab.</p></div>
                )}
                {isBuyer && (p.status === "shipped" || p.status === "picked_up") && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>{p.status === "shipped" ? "Artikel unterwegs" : "Artikel übergeben"}</h3>
                    {trackingEvent && (
                      <div style={{ padding: 12, background: K.sand, borderRadius: 0, border: `1px solid ${K.ink}22`, marginBottom: 14, fontSize: 13 }}>
                        <span style={{ color: colors.muted }}>Sendungsnummer: </span>
                        <a href={`https://service.post.ch/ekp-web/ui/entry/search/${trackingEvent.tracking_number}?lang=de`} target="_blank" rel="noopener" style={{ color: K.petrol, fontWeight: 700, textDecoration: "none" }}>{trackingEvent.tracking_number} <ExternalLink size={12} /></a>
                      </div>
                    )}
                    <button onClick={() => doAction(confirmDelivery, p.id, user.id)} disabled={acting} style={{ width: "100%", padding: 14, borderRadius: 0, border: `1.5px solid ${K.ink}`, background: K.petrol, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>{acting ? "Wird gespeichert..." : "Empfang bestätigen"}</button>
                  </div>
                )}
                {isSeller && (p.status === "shipped" || p.status === "picked_up") && (
                  <div style={{ textAlign: "center", padding: 10 }}><Truck size={28} color="#94B9C9" style={{ marginBottom: 8 }} /><p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{p.status === "shipped" ? "Versendet" : "Übergeben"}</p><p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Warte auf Empfangsbestätigung {isRental ? "des Mieters" : "des Käufers"}.</p></div>
                )}

                {/* ── RENTAL: Mietzeit läuft ──────────────────── */}
                {isRental && isBuyer && p.status === "delivered" && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>Mietzeit läuft</h3>
                    {booking && <RentalCountdown startDate={booking.start_date} endDate={booking.end_date} handoverAt={handoverAt} />}
                    <p style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>Du hast den Artikel erhalten. Wenn du ihn zurückgibst, markiere die Rückgabe.</p>
                    {depositAmount > 0 && <p style={{ fontSize: 12, color: colors.muted, marginBottom: 14 }}>Kaution: CHF {fmtCHF(depositAmount)}, wird nach Rückgabe zurückerstattet.</p>}
                    <button onClick={() => doAction(markAsReturned, p.id, user.id)} disabled={acting} style={{ width: "100%", padding: 14, borderRadius: 0, border: `1.5px solid ${K.ink}`, background: K.petrol, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>{acting ? "Wird gespeichert..." : "Ich habe zurückgegeben"}</button>
                  </div>
                )}
                {isRental && isSeller && p.status === "delivered" && (
                  <div style={{ textAlign: "center", padding: 10 }}>
                    <Package size={28} color="#94B9C9" style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Mietzeit läuft</p>
                    {booking && <RentalCountdown startDate={booking.start_date} endDate={booking.end_date} handoverAt={handoverAt} />}
                    <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Der Mieter hat den Artikel erhalten.</p>
                  </div>
                )}

                {/* ── RENTAL: Rückgabe prüfen ──────────────────── */}
                {isRental && isSeller && p.status === "return_pending" && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>Rückgabe prüfen</h3>
                    <p style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>Der Mieter hat den Artikel zurückgegeben. Prüfe den Zustand.</p>
                    {!showDamageForm ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => doAction(confirmReturn, p.id, user.id, depositAmount)} disabled={acting} style={{ flex: 1, padding: 14, borderRadius: 0, border: `1.5px solid ${K.ink}`, background: K.petrol, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>{acting ? "..." : "Alles OK, Kaution zurück"}</button>
                        <button onClick={() => setShowDamageForm(true)} style={{ flex: 1, padding: 14, borderRadius: 0, border: `1.5px solid ${K.ink}`, background: "#fff", color: colors.dark, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Schaden melden</button>
                      </div>
                    ) : (
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: colors.muted, display: "block", marginBottom: 4 }}>Schadenshöhe (CHF)</label>
                        <input type="number" value={damageAmount} onChange={e => setDamageAmount(e.target.value)} placeholder="z.B. 20" style={{ width: "100%", padding: "10px 12px", borderRadius: 0, border: `1.5px solid ${K.ink}`, fontSize: 14, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
                        <label style={{ fontSize: 12, fontWeight: 700, color: colors.muted, display: "block", marginBottom: 4 }}>Beschreibung</label>
                        <textarea value={damageDesc} onChange={e => setDamageDesc(e.target.value)} placeholder="Was ist beschädigt?" rows={2} style={{ width: "100%", padding: "10px 12px", borderRadius: 0, border: `1.5px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", resize: "vertical", marginBottom: 10 }} />
                        <label style={{ fontSize: 12, fontWeight: 700, color: colors.muted, display: "block", marginBottom: 4 }}>Fotos (optional)</label>
                        <input type="file" accept="image/*" multiple onChange={e => setDamageFiles(Array.from(e.target.files || []))} style={{ fontSize: 12, fontFamily: fonts.body, marginBottom: 6 }} />
                        {damageFiles.length > 0 && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                            {damageFiles.map((f, i) => (
                              <div key={i} style={{ width: 56, height: 56, borderRadius: 0, overflow: "hidden", border: `1px solid ${colors.border}` }}>
                                <img src={URL.createObjectURL(f)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            ))}
                          </div>
                        )}
                        {damageAmount && parseFloat(damageAmount) > 0 && (
                          <p style={{ fontSize: 12, color: colors.muted, marginBottom: 10 }}>Rückerstattung: CHF {fmtCHF(Math.max(0, depositAmount - parseFloat(damageAmount)))} von CHF {fmtCHF(depositAmount)} Kaution</p>
                        )}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={async () => {
                            setActing(true);
                            try {
                              let photoUrls = [];
                              if (damageFiles.length > 0) { photoUrls = await uploadDamagePhotos(p.id, damageFiles); }
                              await reportDamage(p.id, user.id, parseFloat(damageAmount), damageDesc, photoUrls);
                              const [det, ev] = await Promise.all([getPurchaseDetail(p.id), getPurchaseEvents(p.id)]);
                              setPurchase(det); setEvents(ev);
                              setShowDamageForm(false); setDamageFiles([]);
                            } catch (err) { console.error(err); toast.error("Schadenmeldung fehlgeschlagen. Bitte erneut versuchen."); }
                            setActing(false);
                          }} disabled={acting || !damageAmount || !damageDesc} style={{ flex: 1, padding: 14, borderRadius: 0, border: "none", background: "#c62828", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>{acting ? "Wird hochgeladen..." : "Schaden melden"}</button>
                          <button onClick={() => { setShowDamageForm(false); setDamageFiles([]); }} style={{ padding: "14px 20px", borderRadius: 0, border: `1.5px solid ${K.ink}`, background: "#fff", color: colors.muted, fontSize: 13, cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {isRental && isBuyer && p.status === "return_pending" && (
                  <div style={{ textAlign: "center", padding: 10 }}><Clock size={28} color="#F4A100" style={{ marginBottom: 8 }} /><p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Rückgabe markiert</p><p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Der Vermieter prüft den Zustand des Artikels.</p></div>
                )}

                {/* ── RENTAL: Schaden gemeldet ──────────────────── */}
                {isRental && isBuyer && p.status === "damage_reported" && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px", color: "#c62828" }}>Schaden gemeldet</h3>
                    <p style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>Der Vermieter hat einen Schaden gemeldet. Du kannst akzeptieren oder beanstanden.</p>
                    {p.damage_photos && p.damage_photos.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                        {p.damage_photos.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener" style={{ width: 80, height: 80, borderRadius: 0, overflow: "hidden", border: `1px solid ${colors.border}`, display: "block" }}>
                            <img src={url} alt={`Schaden ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </a>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => doAction(acceptDamage, p.id, user.id)} disabled={acting} style={{ flex: 1, padding: 14, borderRadius: 0, border: `1.5px solid ${K.ink}`, background: K.petrol, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>{acting ? "..." : "Akzeptieren"}</button>
                    </div>
                  </div>
                )}
                {isRental && isSeller && p.status === "damage_reported" && (
                  <div style={{ textAlign: "center", padding: 10 }}>
                    <AlertTriangle size={28} color="#c62828" style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Schaden gemeldet</p>
                    <p style={{ fontSize: 13, color: colors.muted, margin: "0 0 10px" }}>Warte auf Antwort des Mieters.</p>
                    {p.damage_photos && p.damage_photos.length > 0 && (
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                        {p.damage_photos.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener" style={{ width: 56, height: 56, borderRadius: 0, overflow: "hidden", border: `1px solid ${colors.border}`, display: "block" }}>
                            <img src={url} alt={`Schaden ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── RENTAL: Kaution zurückerstatten ──────────── */}
                {isRental && isSeller && p.status === "returned" && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>Kaution zurückerstatten</h3>
                    <p style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>Rückgabe bestätigt. Überweise die Kaution an den Mieter und bestätige.</p>
                    <div style={{ padding: 12, background: K.sand, borderRadius: 0, border: `1px solid ${K.ink}22`, marginBottom: 14, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Kaution</span><span>CHF {fmtCHF(depositAmount)}</span></div>
                      {parseFloat(p.damage_amount || 0) > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#c62828" }}><span>Schaden</span><span>- CHF {fmtCHF(p.damage_amount)}</span></div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, paddingTop: 6, borderTop: `1px solid ${colors.borderLt}` }}><span>Rückerstattung</span><span>CHF {fmtCHF(Math.max(0, depositAmount - parseFloat(p.damage_amount || 0)))}</span></div>
                    </div>
                    <a href={`/order/${p.id}/invoice?type=deposit`} target="_blank" rel="noopener" style={{ display: "block", textAlign: "center", padding: 14, borderRadius: 0, border: `1.5px solid #5B8C5A`, background: "#E8F5E9", color: "#5B8C5A", fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: fonts.body, marginBottom: 10 }}>Kautions-Rechnung (QR) ansehen</a>
                    <button onClick={() => doAction(confirmDepositReturned, p.id, user.id, Math.max(0, depositAmount - parseFloat(p.damage_amount || 0)))} disabled={acting} style={{ width: "100%", padding: 14, borderRadius: 0, border: `1.5px solid ${K.ink}`, background: K.petrol, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>{acting ? "Wird gespeichert..." : "Kaution zurückerstattet"}</button>
                  </div>
                )}
                {isRental && isBuyer && p.status === "returned" && (
                  <div style={{ textAlign: "center", padding: 10 }}>
                    <CreditCard size={28} color="#5B8C5A" style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Rückgabe bestätigt</p>
                    <p style={{ fontSize: 13, color: colors.muted, margin: "0 0 12px" }}>Der Vermieter erstattet die Kaution zurück.</p>
                    {depositAmount > 0 && (
                      <>
                        {/* Gleiche Abrechnung wie beim Vermieter: Transparenz bei Schadenabzug */}
                        <div style={{ padding: 12, background: K.sand, borderRadius: 0, border: `1px solid ${K.ink}22`, marginBottom: 12, fontSize: 13, textAlign: "left" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Kaution</span><span>CHF {fmtCHF(depositAmount)}</span></div>
                          {parseFloat(p.damage_amount || 0) > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#c62828" }}><span>Schaden</span><span>- CHF {fmtCHF(p.damage_amount)}</span></div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, paddingTop: 6, borderTop: `1px solid ${colors.borderLt}` }}><span>Rückerstattung</span><span>CHF {fmtCHF(Math.max(0, depositAmount - parseFloat(p.damage_amount || 0)))}</span></div>
                        </div>
                        <a href={`/order/${p.id}/invoice?type=deposit`} target="_blank" rel="noopener" style={{ display: "block", textAlign: "center", padding: 12, borderRadius: 0, border: `1.5px solid #5B8C5A`, background: "#E8F5E9", color: "#5B8C5A", fontSize: 13.5, fontWeight: 700, textDecoration: "none", fontFamily: fonts.body }}>Kautions-Rechnung (QR) ansehen</a>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <OrderTimeline
              events={events}
              isFinished={isFinished}
              finishedLabel={finishedLabel}
              isBuyer={isBuyer}
              seller={p.seller}
              fmtDate={fmtDate}
              getEventCategory={getEventCategory}
              getEventDisplay={getEventDisplay}
            />

                        <RatingSection
              purchase={p}
              user={user}
              listing={listing}
              isService={isService}
              isBuyer={isBuyer}
              counterpartName={isBuyer ? (p.seller?.display_name || "Verkäufer") : (p.buyer?.display_name || "Käufer")}
            />

                        {/* Action Links */}
            {isFinished && (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                <Link href={`/order/${p.id}/invoice`} style={{ fontSize: 13, fontWeight: 700, color: K.petrol, textDecoration: "none", textTransform: "uppercase", letterSpacing: ".03em" }}>{isRental ? (isBuyer ? "Mietbestätigung ansehen" : "Vermietungsbestätigung ansehen") : (isBuyer ? "Kaufbestätigung ansehen" : "Verkaufsbestätigung ansehen")}</Link>
                {isRental && depositAmount > 0 && <a href={`/order/${p.id}/invoice?type=deposit`} target="_blank" rel="noopener" style={{ fontSize: 13, fontWeight: 700, color: K.petrol, textDecoration: "none", textTransform: "uppercase", letterSpacing: ".03em" }}>Kautions-Rechnung ansehen</a>}
                {isBuyer && <Link href="/listings/new" style={{ fontSize: 13, fontWeight: 700, color: K.petrol, textDecoration: "none", textTransform: "uppercase", letterSpacing: ".03em" }}>Artikel weiterverkaufen</Link>}
              </div>
            )}
          </div>

          {/* RECHTE SPALTE */}
          <div>
            {/* Kaufübersicht / Verkaufsübersicht */}
            <div style={{ background: "#fff", borderRadius: 0, border: `1px solid ${K.ink}`, padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px" }}>{isService ? "Service-Übersicht" : isRental ? (isSeller ? "Vermietungsübersicht" : "Mietübersicht") : (isSeller ? "Verkaufsübersicht" : "Kaufübersicht")}</h3>
              <SidebarSection icon={Tag} title="Preis">
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ fontWeight: 400, color: colors.muted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing?.title}</span><span>1 x {fmtCHF(p.price)}</span></div>
                {shippingCost > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 2 }}><span style={{ fontWeight: 400, color: colors.muted }}>Versand: {shippingLabel}</span><span>{fmtCHF(shippingCost)}</span></div>}
                {rentDeposit > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 2 }}><span style={{ fontWeight: 400, color: colors.muted }}>Kaution (nach Rückgabe zurück)</span><span>{fmtCHF(rentDeposit)}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${colors.borderLt}` }}><span>Gesamtpreis</span><span>{fmtCHF(totalPrice)}</span></div>
              </SidebarSection>
              {!isService && <SidebarSection icon={Box} title="Lieferart">{shippingLabel}</SidebarSection>}
              {isRental && booking && (
                <SidebarSection icon={Clock} title="Mietdauer">
                  <div style={{ lineHeight: 1.5 }}>
                    {new Date(booking.start_date).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" })} bis {new Date(booking.end_date).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" })}<br />
                    <span style={{ fontSize: 12, color: colors.muted }}>{booking.days || Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24))} Tage</span>
                  </div>
                </SidebarSection>
              )}
              {deliveryAddr && (
                <SidebarSection icon={MapPin} title="Lieferadresse">
                  <div style={{ lineHeight: 1.5 }}>
                    {deliveryAddr.label && <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: K.petrol, marginBottom: 2 }}>{deliveryAddr.label}</span>}
                    {deliveryAddr.label && <br />}
                    {deliveryAddr.name}<br />
                    {deliveryAddr.company && <>{deliveryAddr.company}<br /></>}
                    {deliveryAddr.street && <>{deliveryAddr.street}<br /></>}
                    {(deliveryAddr.postal_code || deliveryAddr.city) && <>{deliveryAddr.postal_code} {deliveryAddr.city}</>}
                  </div>
                  {addrChangeable && !addrOpen && (
                    <button onClick={() => setAddrOpen(true)} style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12, fontWeight: 700, color: K.petrol, textDecoration: "underline", fontFamily: fonts.body }}>
                      Ändern
                    </button>
                  )}
                  {addrChangeable && addrOpen && (
                    <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                      {[
                        { key: "haupt", label: "Hauptadresse", snap: null },
                        ...myAddresses.map(a => ({
                          key: a.id,
                          label: a.label || `${a.street}, ${a.city}`,
                          snap: {
                            label: a.label || null,
                            name: `${a.first_name || ""} ${a.last_name || ""}`.trim() || fullName(p.buyer),
                            company: a.company || null,
                            street: a.street, postal_code: a.postal_code, city: a.city,
                          },
                        })),
                      ].map(opt => (
                        <button key={opt.key} disabled={addrSaving}
                          onClick={async () => {
                            setAddrSaving(true);
                            const { error } = await supabase.from("purchases").update({ delivery_address: opt.snap }).eq("id", p.id);
                            if (error) { toast.error("Adresse konnte nicht gespeichert werden"); }
                            else { setPurchase(prev => ({ ...prev, delivery_address: opt.snap })); setAddrOpen(false); toast.success("Lieferadresse aktualisiert"); }
                            setAddrSaving(false);
                          }}
                          style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, lineHeight: 1.4, background: "#fff", border: `1px solid ${K.ink}`, borderRadius: 0, cursor: "pointer", fontFamily: fonts.body }}>
                          <strong>{opt.label}</strong>
                          {opt.snap ? <><br />{opt.snap.street}, {opt.snap.postal_code} {opt.snap.city}</> : <><br />{p.buyer?.street}, {p.buyer?.postal_code} {p.buyer?.city}</>}
                        </button>
                      ))}
                      <Link href="/settings?tab=address" style={{ fontSize: 12, color: K.petrol, textDecoration: "underline" }}>Neue Adresse anlegen</Link>
                    </div>
                  )}
                </SidebarSection>
              )}
              {pickupAddr && (
                <SidebarSection icon={MapPin} title="Abholadresse">
                  <div style={{ lineHeight: 1.5 }}>
                    {pickupAddr.label && <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: K.petrol, marginBottom: 2 }}>{pickupAddr.label}</span>}
                    {pickupAddr.label && <br />}
                    {fullName(p.seller)}<br />
                    {pickupAddr.street && <>{pickupAddr.street}<br /></>}
                    {pickupAddr.postal_code} {pickupAddr.city}
                  </div>
                </SidebarSection>
              )}
              {trackingEvent && (
                <SidebarSection icon={Truck} title="Sendungsnummer">
                  <a href={`https://service.post.ch/ekp-web/ui/entry/search/${trackingEvent.tracking_number}?lang=de`} target="_blank" rel="noopener" style={{ color: K.petrol, textDecoration: "none", fontWeight: 600, fontSize: 13 }}>{trackingEvent.tracking_number}</a>
                </SidebarSection>
              )}
              {isRental && depositAmount > 0 && (
                <SidebarSection icon={CreditCard} title="Kaution">
                  <div style={{ lineHeight: 1.5 }}>
                    CHF {fmtCHF(depositAmount)}
                    {p.status === "completed" && <><br /><span style={{ fontSize: 12, color: "#5B8C5A", fontWeight: 600 }}>Zurückerstattet</span></>}
                    {p.status === "returned" && <><br /><span style={{ fontSize: 12, color: "#F4A100", fontWeight: 600 }}>Rückerstattung ausstehend</span></>}
                    {p.status === "damage_reported" && <><br /><span style={{ fontSize: 12, color: "#c62828", fontWeight: 600 }}>Schaden gemeldet</span></>}
                  </div>
                </SidebarSection>
              )}
              <SidebarSection icon={User} title={counterpartLabel}>
                <div style={{ lineHeight: 1.7 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Link href={`/user/${counterpart?.id}`} style={{ fontWeight: 700, color: colors.dark, textDecoration: "none" }}>{fullName(counterpart)}</Link>
                    <VerifiedSellerBadge profile={counterpart} size="sm" />
                  </span><br />
                  <Link href={`/user/${counterpart?.id}`} style={{ fontSize: 12, color: K.petrol, fontWeight: 600, textDecoration: "none" }}>@{counterpart?.display_name}</Link><br />
                  {counterpart?.email && <><a href={`mailto:${counterpart.email}`} style={{ fontSize: 12, color: K.petrol, textDecoration: "none" }}>{counterpart.email}</a><br /></>}
                  {counterpart?.phone && <span style={{ fontSize: 12, color: colors.muted }}>{counterpart.phone}</span>}
                </div>
              </SidebarSection>
              <SidebarSection icon={FileText} title={pageTitle}>
                <div style={{ lineHeight: 1.6, fontSize: 13 }}>
                  <Link href={`/listing/${p.listing_id}`} style={{ color: K.petrol, textDecoration: "none", fontWeight: 600 }}>Angebotsseite ansehen</Link><br />
                  <span style={{ fontWeight: 400, color: colors.muted }}>{pageTitle}:</span> {beeRef}<br />
                  <span style={{ fontWeight: 400, color: colors.muted }}>Artikel:</span> {artRef}
                </div>
              </SidebarSection>
            </div>

            {/* Zahlungsinformationen (nur Käufer) */}
            {isBuyer && p.seller?.iban && (
              <div id="payment-info" style={{ background: "#fff", borderRadius: 0, border: `1px solid ${K.ink}`, padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: ".5px", color: colors.muted }}>Zahlungsinformationen</h3>
                <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 2 }}>Begünstigter</span>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div><span style={{ fontWeight: 700, display: "block" }}>{fullName(p.seller)}</span>{p.seller.street && <span style={{ fontSize: 12, color: colors.muted, display: "block" }}>{p.seller.street}</span>}{(p.seller.postal_code || p.seller.city) && <span style={{ fontSize: 12, color: colors.muted, display: "block" }}>{p.seller.postal_code} {p.seller.city}</span>}</div>
                      <CopyBtn text={[fullName(p.seller), p.seller.street, `${p.seller.postal_code} ${p.seller.city}`].filter(Boolean).join(", ")} />
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 2 }}>IBAN</span>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 700, fontSize: 13, letterSpacing: ".3px" }}>{p.seller.iban}</span><CopyBtn text={p.seller.iban} /></div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 2 }}>Betrag in CHF</span>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 700 }}>CHF {fmtCHF(totalPrice)}</span><CopyBtn text={String(totalPrice)} /></div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 2 }}>Zahlungszweck</span>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 700 }}>{beeRef}</span><CopyBtn text={beeRef} /></div>
                  </div>
                </div>
                <Link href={`/order/${p.id}/invoice`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, padding: "12px 16px", borderRadius: 0, background: K.petrol, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: fonts.body }}><FileText size={15} /> QR-Rechnung anzeigen</Link>
              </div>
            )}

            {/* Rechnung fuer die Gegenseite: auch der Verkaeufer (bzw. Kaeufer
                ohne Zahlungsbox) sieht die QR-Rechnung, bei jedem Kauf */}
            {!(isBuyer && p.seller?.iban) && (
              <div style={{ background: "#fff", borderRadius: 0, border: `1px solid ${K.ink}`, padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: ".5px", color: colors.muted }}>Rechnung</h3>
                <Link href={`/order/${p.id}/invoice`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 16px", borderRadius: 0, background: K.petrol, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: fonts.body }}><FileText size={15} /> QR-Rechnung anzeigen</Link>
              </div>
            )}

            {/* Hilfe-Box */}
            <div style={{ background: "#fff", borderRadius: 0, border: `1px solid ${K.ink}`, padding: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 6px" }}>{isRental ? (isBuyer ? "Vermieter reagiert nicht?" : "Mieter reagiert nicht?") : (isBuyer ? "Verkäufer reagiert nicht?" : "Käufer reagiert nicht?")}</h4>
              <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Entdecke unsere <Link href="/help" style={{ color: K.petrol, fontWeight: 600, textDecoration: "none" }}>Tipps</Link> oder <Link href="/contact" style={{ color: K.petrol, fontWeight: 600, textDecoration: "none" }}>kontaktiere uns</Link>.</p>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 800px) { .order-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
