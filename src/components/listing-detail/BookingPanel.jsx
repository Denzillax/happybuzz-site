"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { createBooking, checkProfileComplete } from "@/lib/listings";

export default function BookingPanel({ listing, user, isOwner }) {
  const router = useRouter();
  const l = listing;
  const [bookStart, setBookStart] = useState("");
  const [bookEnd, setBookEnd] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [profileWarning, setProfileWarning] = useState(null);
  const fmtPrice = (p) => (parseFloat(p) || 0).toLocaleString("de-CH", { minimumFractionDigits: 2 });

  if (!l || l.status !== "active") return null;

  // ── RENT BOOKING ──────────────────────
  if (l.listing_type === "rent") {
    return (
      <div>
        <div style={{ marginBottom: 12, fontSize: 13, color: colors.muted, display: "flex", alignItems: "center", gap: 4 }}>
          <CalendarDays size={14} /> {l.rent_period === "hour" ? "pro Stunde" : l.rent_period === "day" ? "pro Tag" : l.rent_period === "week" ? "pro Woche" : "pro Monat"}
          {l.deposit_amount > 0 && <span> · Kaution CHF {fmtPrice(l.deposit_amount)}</span>}
        </div>
        {!isOwner && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: colors.muted, display: "block", marginBottom: 4 }}>Von</label>
                <input type="date" value={bookStart} onChange={(e) => setBookStart(e.target.value)} min={new Date().toISOString().split("T")[0]}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: radius.sm, border: `1.5px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: colors.muted, display: "block", marginBottom: 4 }}>Bis</label>
                <input type="date" value={bookEnd} onChange={(e) => setBookEnd(e.target.value)} min={bookStart || new Date().toISOString().split("T")[0]}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: radius.sm, border: `1.5px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body }} />
              </div>
            </div>
            {bookStart && bookEnd && new Date(bookEnd) > new Date(bookStart) && (() => {
              const days = Math.ceil((new Date(bookEnd) - new Date(bookStart)) / (1000 * 60 * 60 * 24));
              const total = days * parseFloat(l.rent_price || l.price);
              return (
                <div style={{ marginBottom: 12, padding: "12px 14px", background: colors.cream, borderRadius: radius.sm, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>{days} Tage × CHF {fmtPrice(l.rent_price || l.price)}</span><span style={{ fontWeight: 700 }}>CHF {fmtPrice(total)}</span></div>
                  {parseFloat(l.deposit_amount) > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: colors.muted, marginTop: 4 }}><span>Kaution</span><span>CHF {fmtPrice(l.deposit_amount)}</span></div>}
                </div>
              );
            })()}
            <button onClick={async () => {
              if (!user) { router.push("/login"); return; }
              if (!bookStart || !bookEnd) return;
              const check = await checkProfileComplete(user.id, "rent");
              if (!check.complete) { setProfileWarning(check.missing); return; }
              try {
                const days = Math.ceil((new Date(bookEnd) - new Date(bookStart)) / (1000 * 60 * 60 * 24));
                const total = days * parseFloat(l.rent_price || l.price);
                await createBooking(l.id, user.id, l.user_id, bookStart, bookEnd, total, l.deposit_amount || 0);
                setBookingSuccess(true); setBookStart(""); setBookEnd("");
              } catch (err) { console.error(err); }
            }} disabled={!bookStart || !bookEnd || new Date(bookEnd) <= new Date(bookStart)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: radius.sm, border: "none", width: "100%", background: bookStart && bookEnd ? colors.yellow : colors.warm, color: colors.dark, fontSize: 15, fontWeight: 800, fontFamily: fonts.body, cursor: bookStart && bookEnd ? "pointer" : "default" }}>
              <CalendarDays size={18} /> ANFRAGE SENDEN
            </button>
            {bookingSuccess && (
              <div style={{ marginTop: 10, padding: 12, borderRadius: radius.sm, background: colors.greenSoft, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.green }}>Anfrage gesendet!</p>
                <Link href="/bookings" style={{ fontSize: 12, color: colors.blue }}>Zu meinen Buchungen</Link>
              </div>
            )}
            {profileWarning && <p style={{ fontSize: 12, color: "#c62828", marginTop: 8 }}>Bitte vervollständige dein Profil: {profileWarning.join(", ")}</p>}
          </div>
        )}
      </div>
    );
  }

  // ── SERVICE BOOKING ──────────────────
  if (l.listing_type === "service") {
    return (
      <div>
        <div style={{ marginBottom: 12, fontSize: 13, color: colors.muted, display: "flex", alignItems: "center", gap: 4 }}>
          <CalendarDays size={14} /> {l.rent_period === "hour" ? "pro Stunde" : l.rent_period === "day" ? "pro Tag" : l.rent_period === "week" ? "pro Woche" : "pro Monat"}
        </div>
        {!isOwner ? (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: colors.muted, display: "block", marginBottom: 4 }}>Wunschdatum</label>
                <input type="date" value={bookStart} onChange={(e) => setBookStart(e.target.value)} min={new Date().toISOString().split("T")[0]}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: radius.sm, border: `1.5px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: colors.muted, display: "block", marginBottom: 4 }}>Uhrzeit (optional)</label>
                <input type="time" value={bookEnd} onChange={(e) => setBookEnd(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: radius.sm, border: `1.5px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: colors.muted, margin: "0 0 10px" }}>Der Anbieter bestätigt den Termin. Die Abrechnung erfolgt nach Abschluss.</p>
            <button onClick={async () => {
              if (!user) { router.push("/login"); return; }
              if (!bookStart) return;
              const check = await checkProfileComplete(user.id, "rent");
              if (!check.complete) { setProfileWarning(check.missing); return; }
              try {
                const startWithTime = bookEnd ? `${bookStart}T${bookEnd}` : bookStart;
                await createBooking(l.id, user.id, l.user_id, startWithTime, bookStart, parseFloat(l.rent_price || 0), 0);
                setBookingSuccess(true); setBookStart(""); setBookEnd("");
              } catch (err) { console.error(err); }
            }} disabled={!bookStart}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: radius.sm, border: "none", width: "100%", background: bookStart ? colors.yellow : colors.warm, color: colors.dark, fontSize: 15, fontWeight: 800, fontFamily: fonts.body, cursor: bookStart ? "pointer" : "default" }}>
              <CalendarDays size={18} /> SERVICE ANFRAGEN
            </button>
            {bookingSuccess && (
              <div style={{ marginTop: 10, padding: 12, borderRadius: radius.sm, background: colors.greenSoft, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.green }}>Anfrage gesendet!</p>
                <Link href="/bookings" style={{ fontSize: 12, color: colors.blue }}>Zu meinen Buchungen</Link>
              </div>
            )}
            {profileWarning && <p style={{ fontSize: 12, color: "#c62828", marginTop: 8 }}>Bitte vervollständige dein Profil: {profileWarning.join(", ")}</p>}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: colors.muted, fontStyle: "italic" }}>Kunden können hier einen Termin anfragen.</p>
        )}
      </div>
    );
  }

  return null;
}
