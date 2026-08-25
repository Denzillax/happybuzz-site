"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getMyRentalRequests, getMyBookings, updateBookingStatus } from "@/lib/listings";
import Link from "next/link";
import { CalendarDays, Package, CheckCircle, XCircle, Clock, User, Wrench, Home } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";

// Katalog-Tokens (wie öffentliche Seiten)
const K = { ink: "#14110D", sand: "#F4F4F2", paper: "#FFFFFF", honey: "#F4C03F", petrol: "#0B5E5C", moss: "#5B8C5A" };
const MONO = "'Manrope', sans-serif";
const HEAD = "'General Sans','Manrope',sans-serif";

const STATUS_CONFIG = {
  pending:   { label: "Angefragt", color: "#8a6d0a", icon: Clock },
  confirmed: { label: "Bestätigt", color: colors.green, icon: CheckCircle },
  active:    { label: "Laufend", color: colors.blue, icon: CalendarDays },
  returned:  { label: "Zurückgegeben", color: colors.green, icon: CheckCircle },
  cancelled: { label: "Abgesagt", color: colors.muted, icon: XCircle },
};

export default function BookingsPage() {
  const [tab, setTab] = useState("incoming"); // incoming | outgoing
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { window.location.href = "/login"; return; }
        const user = session.user;
        setUserId(user.id);
        const [inc, out] = await Promise.all([
          getMyRentalRequests(user.id),
          getMyBookings(user.id),
        ]);
        setIncoming(inc);
        setOutgoing(out);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const fmtPrice = (p) => (parseFloat(p) || 0).toLocaleString("de-CH", { minimumFractionDigits: 2 });
  const fmtDate = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" });

  const handleAction = async (bookingId, status) => {
    try {
      const purchaseId = await updateBookingStatus(bookingId, status);
      const updated = await getMyRentalRequests(userId);
      setIncoming(updated);
      if (status === "confirmed" && purchaseId) {
        window.location.href = `/order/${purchaseId}`;
      }
    } catch (err) { console.error(err); toast.error("Aktion fehlgeschlagen. Bitte erneut versuchen."); }
  };

  const TABS = [
    { key: "incoming", label: `Anfragen (${incoming.length})` },
    { key: "outgoing", label: `Meine Buchungen (${outgoing.length})` },
  ];

  const renderBooking = (b, isOwner) => {
    const st = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
    const StIcon = st.icon;
    const cover = b.listing?.listing_images?.[0]?.url;
    const hatAktionen = (isOwner && b.status === "pending") || b.purchase_id;
    return (
      <div key={b.id} className="bk-row" style={{ borderBottom: `1px solid ${colors.borderLt}` }}>
        {/* Kopf: Bild + Infos (auf dem Handy die volle Breite) */}
        <div className="bk-head">
          <div style={{ width: 64, height: 64, borderRadius: 10, border: "1px solid #E4E0D8", background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {cover ? <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={22} color={colors.mutedLt} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/listing/${b.listing_id}`} style={{ fontSize: 14, fontWeight: 700, color: K.petrol, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.listing?.title || "Inserat"}</Link>
            <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {b.listing?.listing_type === "service"
                ? `Wunschtermin: ${fmtDate(b.start_date)}${b.start_date?.includes("T") ? ", " + new Date(b.start_date).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }) + " Uhr" : ""}`
                : `${fmtDate(b.start_date)} – ${fmtDate(b.end_date)}`}
            </div>
            {isOwner && b.renter && (
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <User size={12} /> {b.renter.display_name}
              </div>
            )}
          </div>
        </div>

        {/* Preis + Status (Desktop rechts, Handy als eigene Zeile) */}
        <div className="bk-side">
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>CHF {fmtPrice(b.total_price)}</p>
          {b.days > 0 && <p className="bk-side-sub" style={{ margin: "2px 0 0", fontSize: 11, color: colors.muted }}>{b.days} Tage</p>}
          {b.bee_impact > 0 && <p className="bk-side-sub" style={{ margin: "2px 0 0", fontSize: 11, color: colors.green, fontWeight: 600 }}>Impact CHF {fmtPrice(b.bee_impact)}</p>}
          <div className="bk-status" style={{ display: "flex", alignItems: "center", gap: 4, color: st.color, fontSize: 12, fontWeight: 600, marginTop: 4, justifyContent: "flex-end" }}>
            <StIcon size={14} /> {st.label}
          </div>
        </div>

        {/* Aktionen (Desktop schmale Spalte, Handy volle Breite nebeneinander) */}
        {hatAktionen && (
          <div className="bk-actions">
            {isOwner && b.status === "pending" && (
              <>
                <button onClick={() => handleAction(b.id, "confirmed")} style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #E4E0D8", background: K.moss, color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>Bestätigen</button>
                <button onClick={() => handleAction(b.id, "cancelled")} style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #E4E0D8", background: "#fff", color: K.ink, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Absagen</button>
              </>
            )}
            {b.purchase_id && (
              <Link href={`/order/${b.purchase_id}`} style={{ padding: "9px 14px", borderRadius: 10, background: K.honey, color: K.ink, fontSize: 12, fontWeight: 800, textDecoration: "none", border: "1px solid #E4E0D8", textAlign: "center" }}>
                Zur Bestellung
              </Link>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: fonts.body, background: K.paper, minHeight: "100vh", color: K.ink }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: ".18em", textTransform: "uppercase", color: K.petrol, marginBottom: 6 }}>Termine & Mieten</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 24px", fontFamily: HEAD, letterSpacing: "-0.01em" }}>Buchungen</h1>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #E4E0D8", marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "12px 24px", background: "none", border: "none",
              borderBottom: tab === t.key ? `3px solid ${K.honey}` : "3px solid transparent",
              marginBottom: -2, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: MONO, letterSpacing: ".1em", textTransform: "uppercase",
              color: tab === t.key ? K.ink : colors.muted,
            }}>{t.label}</button>
          ))}
        </div>

        {loading && <div style={{ textAlign: "center", padding: 60, color: colors.mutedLt }}>Lade...</div>}

        {!loading && (
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E4E0D8", overflow: "hidden" }}>
            {tab === "incoming" && (
              incoming.length === 0
                ? <div style={{ textAlign: "center", padding: 60, color: colors.muted }}><CalendarDays size={32} color={colors.mutedLt} style={{ marginBottom: 8 }} /><p style={{ fontSize: 14, fontWeight: 600 }}>Keine Anfragen</p></div>
                : <>
                  {incoming.filter(b => b.listing?.listing_type === "service").length > 0 && (
                    <>
                      <div style={{ padding: "12px 20px", background: "#FFF0E6", borderBottom: `1px solid ${colors.borderLt}`, display: "flex", alignItems: "center", gap: 8 }}>
                        <Wrench size={14} color="#E67E22" /><span style={{ fontSize: 12, fontWeight: 700, color: "#E67E22", textTransform: "uppercase", letterSpacing: ".05em" }}>Service-Anfragen</span>
                      </div>
                      {incoming.filter(b => b.listing?.listing_type === "service").map(b => renderBooking(b, true))}
                    </>
                  )}
                  {incoming.filter(b => b.listing?.listing_type !== "service").length > 0 && (
                    <>
                      <div style={{ padding: "12px 20px", background: "#E3F2FD", borderBottom: `1px solid ${colors.borderLt}`, display: "flex", alignItems: "center", gap: 8 }}>
                        <Home size={14} color="#1565C0" /><span style={{ fontSize: 12, fontWeight: 700, color: "#1565C0", textTransform: "uppercase", letterSpacing: ".05em" }}>Miet-Anfragen</span>
                      </div>
                      {incoming.filter(b => b.listing?.listing_type !== "service").map(b => renderBooking(b, true))}
                    </>
                  )}
                </>
            )}
            {tab === "outgoing" && (
              outgoing.length === 0
                ? <div style={{ textAlign: "center", padding: 60, color: colors.muted }}><CalendarDays size={32} color={colors.mutedLt} style={{ marginBottom: 8 }} /><p style={{ fontSize: 14, fontWeight: 600 }}>Keine Buchungen</p></div>
                : <>
                  {outgoing.filter(b => b.listing?.listing_type === "service").length > 0 && (
                    <>
                      <div style={{ padding: "12px 20px", background: "#FFF0E6", borderBottom: `1px solid ${colors.borderLt}`, display: "flex", alignItems: "center", gap: 8 }}>
                        <Wrench size={14} color="#E67E22" /><span style={{ fontSize: 12, fontWeight: 700, color: "#E67E22", textTransform: "uppercase", letterSpacing: ".05em" }}>Meine Service-Buchungen</span>
                      </div>
                      {outgoing.filter(b => b.listing?.listing_type === "service").map(b => renderBooking(b, false))}
                    </>
                  )}
                  {outgoing.filter(b => b.listing?.listing_type !== "service").length > 0 && (
                    <>
                      <div style={{ padding: "12px 20px", background: "#E3F2FD", borderBottom: `1px solid ${colors.borderLt}`, display: "flex", alignItems: "center", gap: 8 }}>
                        <Home size={14} color="#1565C0" /><span style={{ fontSize: 12, fontWeight: 700, color: "#1565C0", textTransform: "uppercase", letterSpacing: ".05em" }}>Meine Mieten</span>
                      </div>
                      {outgoing.filter(b => b.listing?.listing_type !== "service").map(b => renderBooking(b, false))}
                    </>
                  )}
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
