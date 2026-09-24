"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getMyRentalRequests, getMyBookings, updateBookingStatus, openBookingChat } from "@/lib/listings";
import { bookingState, sortBookings, mahnText } from "@/lib/bookingStatus";
import Link from "next/link";
import { CalendarDays, Package, CheckCircle, XCircle, Clock, User, Wrench, Home, AlertTriangle, ChevronDown, RotateCcw, MessageCircle } from "lucide-react";
import { colors, fonts } from "@/lib/theme";

// Buchungen (Denis 24.09.2026): auf einen Blick, was offen und was zu ist. Der Zustand kommt aus
// bookingState() (Buchung plus verknüpfte Bestellung), nicht mehr nur aus rental_bookings.status.
// Drei Gruppen pro Reiter: Überfällig (rot, zuoberst), Offen, Abgeschlossen (eingeklappt).
// Layout-Klassen bk-* in globals.css. Fassung im alten Klar-Look (Live-Design).
const K = { ink: "#191615", sand: "#F5F6F8", paper: "#FFFFFF", honey: "#F4C03F", petrol: "#0B5E5C", moss: "#50804F" };
const MONO = "'Manrope', sans-serif";
const HEAD = "'General Sans','Manrope',sans-serif";
const F = {
  radius: 12, rand: "1px solid #E5E8EC", randFein: "1px solid #EEF0F3",
  rot: "#C62828", rotGrund: "#FDECEA", rotZeile: "#FFF6F5",
  warn: "#8a6d0a", warnGrund: "#FFF6D6",
  gruen: "#2E7D32", gruenGrund: "#E8F5E9",
  neutral: "#F5F6F8", neutral2: "#ECEEF1",
  miete: "#E3F2FD", service: "#FFF0E6",
};

const ZUSTAND = {
  pending:        { color: F.warn,  grund: F.warnGrund,  icon: Clock },
  confirmed:      { color: K.ink,   grund: F.neutral2,   icon: CheckCircle },
  active:         { color: F.gruen, grund: F.gruenGrund, icon: CalendarDays },
  overdue:        { color: F.rot,   grund: F.rotGrund,   icon: AlertTriangle },
  past:           { color: F.rot,   grund: F.rotGrund,   icon: AlertTriangle },
  return_pending: { color: F.warn,  grund: F.warnGrund,  icon: RotateCcw },
  problem:        { color: F.rot,   grund: F.rotGrund,   icon: AlertTriangle },
  done:           { color: F.gruen, grund: F.gruenGrund, icon: CheckCircle },
  cancelled:      { color: colors.muted, grund: F.neutral, icon: XCircle },
};

export default function BookingsPage() {
  const [tab, setTab] = useState("incoming"); // incoming | outgoing
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [zuOffen, setZuOffen] = useState({ incoming: false, outgoing: false });
  const router = useRouter();
  const [chatOeffnet, setChatOeffnet] = useState(null); // Buchungs-ID, deren Chat gerade geöffnet wird

  // Chat mit der Gegenseite (Spec 24.09.2026): bestehender Inserat-Chat, bei überfälliger Miete mit Vorlage im Feld.
  const handleChat = async (b, s, isOwner) => {
    if (chatOeffnet) return;
    setChatOeffnet(b.id);
    try {
      const convId = await openBookingChat({ listingId: b.listing_id, buyerId: b.renter_id, sellerId: b.owner_id });
      if (!convId) { toast.error("Chat konnte nicht geöffnet werden."); return; }
      const text = s.key === "overdue" ? mahnText(isOwner ? "owner" : "renter", b.listing?.title, b.end_date) : "";
      router.push(`/chat/${convId}${text ? "?text=" + encodeURIComponent(text) : ""}`);
    } catch (err) { console.error(err); toast.error("Chat konnte nicht geöffnet werden."); }
    finally { setChatOeffnet(null); }
  };

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { window.location.href = "/login"; return; }
        const user = session.user;
        setUserId(user.id);
        const [inc, out] = await Promise.all([getMyRentalRequests(user.id), getMyBookings(user.id)]);
        setIncoming(inc);
        setOutgoing(out);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const fmtPrice = (p) => (parseFloat(p) || 0).toLocaleString("de-CH", { minimumFractionDigits: 2 });
  const fmtDate = (d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" });
  const tage = (n) => `${n} ${n === 1 ? "Tag" : "Tage"}`;
  const tagen = (n) => `${n} ${n === 1 ? "Tag" : "Tagen"}`; // nach "seit" und "in"

  const handleAction = async (bookingId, status) => {
    try {
      const purchaseId = await updateBookingStatus(bookingId, status);
      setIncoming(await getMyRentalRequests(userId));
      if (status === "confirmed" && purchaseId) window.location.href = `/order/${purchaseId}`;
    } catch (err) { console.error(err); toast.error("Aktion fehlgeschlagen. Bitte erneut versuchen."); }
  };

  // Gruppen pro Reiter: überfällig / offen / zu
  const gruppen = useMemo(() => {
    const teile = (liste) => {
      const s = sortBookings(liste);
      return {
        ueber: s.filter((x) => x.s.offen && x.s.ueberfaellig > 0),
        offen: s.filter((x) => x.s.offen && x.s.ueberfaellig === 0),
        zu: s.filter((x) => !x.s.offen),
      };
    };
    return { incoming: teile(incoming), outgoing: teile(outgoing) };
  }, [incoming, outgoing]);

  const TABS = [
    { key: "incoming", label: "Anfragen", g: gruppen.incoming },
    { key: "outgoing", label: "Meine Buchungen", g: gruppen.outgoing },
  ];

  // Zeile unter dem Titel: was gerade zählt (Rückgabe in x Tagen, überfällig seit, Termin)
  const zeitzeile = (b, s) => {
    const service = b.listing?.listing_type === "service";
    if (s.key === "overdue") return `Rückgabe war am ${fmtDate(b.end_date)}. Überfällig seit ${tagen(s.ueberfaellig)}.`;
    if (s.key === "past") return `Termin war am ${fmtDate(b.start_date)}. Noch nicht abgeschlossen.`;
    if (s.key === "active") return s.rest === 0 ? "Rückgabe heute" : `Rückgabe in ${tagen(s.rest)}`;
    if (s.key === "confirmed" && s.bisStart > 0) return service ? `Termin in ${tagen(s.bisStart)}` : `Beginnt in ${tagen(s.bisStart)}`;
    if (s.key === "confirmed" && s.bisStart === 0) return service ? "Termin heute" : "Beginnt heute";
    if (s.key === "return_pending") return "Rückgabe markiert, Bestätigung ausstehend";
    return null;
  };

  const renderBooking = ({ b, s }, isOwner) => {
    const z = ZUSTAND[s.key] || ZUSTAND.confirmed;
    const StIcon = z.icon;
    const cover = b.listing?.listing_images?.[0]?.url;
    const service = b.listing?.listing_type === "service";
    const zz = zeitzeile(b, s);
    const klasse = "bk-row" + (s.ueberfaellig > 0 ? " bk-ueber" : "") + (!s.offen ? " bk-zu" : "");
    const wer = isOwner ? b.renter?.display_name : b.owner?.display_name;
    return (
      <div key={b.id} className={klasse} style={{ borderBottom: F.randFein, background: s.ueberfaellig > 0 ? F.rotZeile : undefined }}>
        <div className="bk-head">
          <div style={{ width: 64, height: 64, borderRadius: F.radius, border: F.rand, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {cover ? <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={22} color={colors.mutedLt} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <Link href={`/listing/${b.listing_id}`} style={{ fontSize: 14.5, fontWeight: 700, color: K.ink, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.listing?.title || "Inserat"}</Link>
              <span className="bk-typ" style={{ background: service ? F.service : F.miete, border: F.randFein, color: K.ink }}>
                {service ? <Wrench size={11} /> : <Home size={11} />} {service ? "Service" : "Miete"}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: colors.muted, marginTop: 3 }}>
              {service
                ? `Wunschtermin: ${fmtDate(b.start_date)}${b.start_date?.includes("T") ? ", " + new Date(b.start_date).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }) + " Uhr" : ""}`
                : `${fmtDate(b.start_date)} bis ${fmtDate(b.end_date)}${b.days > 0 ? ", " + tage(b.days) : ""}`}
              {wer && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 10 }}><User size={12} /> {wer}</span>}
            </div>
            {zz && <div style={{ fontSize: 12.5, fontWeight: 700, color: s.ueberfaellig > 0 ? F.rot : K.ink, marginTop: 4 }}>{zz}</div>}
          </div>
        </div>

        <div className="bk-side">
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>CHF {fmtPrice(b.total_price)}</p>
          {b.bee_impact > 0 && <p className="bk-side-sub" style={{ margin: "2px 0 0", fontSize: 11, color: F.gruen, fontWeight: 600 }}>Impact CHF {fmtPrice(b.bee_impact)}</p>}
          <span className="bk-status" style={{ background: z.grund, color: z.color, border: F.randFein }}>
            <StIcon size={13} /> {s.label}
          </span>
        </div>

        {(
          <div className="bk-actions">
            {isOwner && s.key === "pending" && (
              <>
                <button onClick={() => handleAction(b.id, "confirmed")} style={{ padding: "9px 14px", borderRadius: F.radius, border: F.rand, background: K.honey, color: K.ink, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body }}>Bestätigen</button>
                <button onClick={() => handleAction(b.id, "cancelled")} style={{ padding: "9px 14px", borderRadius: F.radius, border: F.rand, background: "#fff", color: K.ink, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Absagen</button>
              </>
            )}
            {b.purchase_id && (
              <Link href={`/order/${b.purchase_id}`} style={{ padding: "9px 14px", borderRadius: F.radius, background: "#fff", color: K.ink, fontSize: 12, fontWeight: 800, textDecoration: "none", border: F.rand, textAlign: "center", whiteSpace: "nowrap" }}>
                {s.key === "overdue" || s.key === "past" ? "Jetzt abschliessen" : "Zur Bestellung"}
              </Link>
            )}
            <button className="eckig kein-akzent" onClick={() => handleChat(b, s, isOwner)} disabled={chatOeffnet === b.id}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: F.radius, border: F.rand, background: s.key === "overdue" ? K.honey : "#fff", color: K.ink, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body, whiteSpace: "nowrap", opacity: chatOeffnet === b.id ? .6 : 1 }}>
              <MessageCircle size={13} /> {s.key === "overdue" ? "Anschreiben" : "Nachricht"}
            </button>
          </div>
        )}
      </div>
    );
  };

  const Gruppe = ({ icon: Icon, titel, n, color, grund }) => (
    <div className="bk-gruppe" style={{ background: grund, color, borderBottom: F.randFein }}>
      <Icon size={14} /> {titel} <span style={{ opacity: .7, fontWeight: 600 }}>({n})</span>
    </div>
  );

  const renderTab = (key, g, isOwner) => {
    const total = g.ueber.length + g.offen.length + g.zu.length;
    if (total === 0) {
      return (
        <div style={{ textAlign: "center", padding: "56px 20px", color: colors.muted }}>
          <CalendarDays size={32} color={colors.mutedLt} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: K.ink }}>{isOwner ? "Keine Anfragen" : "Keine Buchungen"}</p>
          <p style={{ fontSize: 13, margin: "6px 0 0" }}>{isOwner ? "Anfragen für deine Mieten und Services landen hier." : "Was du mietest oder buchst, steht hier."}</p>
        </div>
      );
    }
    const auf = zuOffen[key];
    return (
      <>
        {g.ueber.length > 0 && <>
          <Gruppe icon={AlertTriangle} titel="Überfällig" n={g.ueber.length} color={F.rot} grund={F.rotGrund} />
          {g.ueber.map((x) => renderBooking(x, isOwner))}
        </>}
        {g.offen.length > 0 && <>
          <Gruppe icon={Clock} titel="Offen" n={g.offen.length} color={K.ink} grund={F.neutral} />
          {g.offen.map((x) => renderBooking(x, isOwner))}
        </>}
        {g.ueber.length + g.offen.length === 0 && (
          <div style={{ padding: "18px 20px", fontSize: 13.5, color: colors.muted, borderBottom: F.randFein }}>Nichts offen. Alles erledigt.</div>
        )}
        {g.zu.length > 0 && <>
          <button className="bk-gruppe bk-klapp eckig kein-akzent" aria-expanded={auf} onClick={() => setZuOffen((o) => ({ ...o, [key]: !o[key] }))} style={{ color: colors.muted, background: "#fff", borderBottom: auf ? F.randFein : "none" }}>
            <CheckCircle size={14} /> Abgeschlossen <span style={{ opacity: .7, fontWeight: 600 }}>({g.zu.length})</span>
            <ChevronDown size={15} style={{ marginLeft: "auto", transform: auf ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
          </button>
          {auf && g.zu.map((x) => renderBooking(x, isOwner))}
        </>}
      </>
    );
  };

  const ueberGesamt = gruppen.incoming.ueber.length + gruppen.outgoing.ueber.length;

  return (
    <div style={{ fontFamily: fonts.body, background: "var(--bd-grund)", minHeight: "100vh", color: K.ink }}>
      <div className="bd-seite">
        <div style={{ fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: ".18em", textTransform: "uppercase", color: K.petrol, marginBottom: 6 }}>Termine & Mieten</div>
        <h1 className="bd-seitentitel" style={{ fontSize: 26, fontWeight: 700, margin: "0 0 16px", fontFamily: HEAD, letterSpacing: "-0.01em" }}>Buchungen</h1>

        {!loading && ueberGesamt > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: F.radius, border: F.rand, background: F.rotGrund, color: K.ink, fontSize: 13.5, fontWeight: 600, marginBottom: 20 }}>
            <AlertTriangle size={17} color={F.rot} style={{ flexShrink: 0 }} />
            <span>{ueberGesamt === 1 ? "Eine Buchung ist überfällig." : `${ueberGesamt} Buchungen sind überfällig.`} Rückgabe auf der Bestellseite bestätigen oder die Gegenseite anschreiben.</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #E5E8EC", marginBottom: 24 }} role="tablist">
          {TABS.map((t) => {
            const offen = t.g.ueber.length + t.g.offen.length;
            return (
              <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} style={{
                padding: "12px 24px", background: "none", border: "none",
                borderBottom: tab === t.key ? `3px solid ${K.honey}` : "3px solid transparent",
                marginBottom: -2, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: MONO, letterSpacing: ".1em", textTransform: "uppercase",
                color: tab === t.key ? K.ink : colors.muted, display: "inline-flex", alignItems: "center",
              }}>
                {t.label}
                {offen > 0 && <span className="bk-zaehler" style={{ background: t.g.ueber.length > 0 ? F.rot : K.ink, color: "#fff" }}>{offen}</span>}
              </button>
            );
          })}
        </div>

        {loading && <div style={{ textAlign: "center", padding: 60, color: colors.mutedLt }}>Lade...</div>}

        {!loading && (
          <div style={{ background: "#fff", borderRadius: F.radius, border: F.rand, overflow: "hidden" }}>
            {tab === "incoming" && renderTab("incoming", gruppen.incoming, true)}
            {tab === "outgoing" && renderTab("outgoing", gruppen.outgoing, false)}
          </div>
        )}
      </div>
    </div>
  );
}
