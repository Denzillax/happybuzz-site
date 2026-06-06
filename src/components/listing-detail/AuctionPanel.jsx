"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Gavel, Clock, ShoppingBag } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { getBids, getMyBid, getBidHistory, removePreislimit } from "@/lib/listings";

export default function AuctionPanel({ listing, user, isOwner, onBidModal, onBuyNowModal }) {
  const router = useRouter();
  const l = listing;
  const [bids, setBids] = useState([]);
  const [bidHistory, setBidHistory] = useState([]);
  const [myBid, setMyBid] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [urgency, setUrgency] = useState(false); // true = unter 1 Stunde
  const fmtPrice = (p) => (parseFloat(p) || 0).toLocaleString("de-CH", { minimumFractionDigits: 2 });

  // Load bids + bid history
  useEffect(() => {
    if (!l || l.listing_type !== "auction") return;
    getBids(l.id).then(setBids).catch(() => {});
    getBidHistory(l.id).then(setBidHistory).catch(() => {});
    if (user) getMyBid(l.id, user.id).then(setMyBid).catch(() => {});
  }, [l?.id, user?.id]);

  // Refresh after parent signals a bid was placed
  const refresh = () => {
    getBids(l.id).then(setBids).catch(() => {});
    getBidHistory(l.id).then(setBidHistory).catch(() => {});
    if (user) getMyBid(l.id, user.id).then(setMyBid).catch(() => {});
  };

  // Expose refresh method
  useEffect(() => {
    if (typeof window !== "undefined") window.__auctionRefresh = refresh;
    return () => { if (typeof window !== "undefined") delete window.__auctionRefresh; };
  }, [l?.id, user?.id]);

  // Live countdown
  useEffect(() => {
    if (!l || l.listing_type !== "auction" || !l.auction_end || l.status !== "active") return;
    const tick = () => {
      const diff = new Date(l.auction_end).getTime() - Date.now();
      if (diff <= 0) { setCountdown("Auktion beendet"); setUrgency(true); return; }
      setUrgency(diff < 3600000); // Rot nur unter 1 Stunde
      const days = Math.floor(diff / 86400000);
      const hrs = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (diff > 86400000) setCountdown(new Date(l.auction_end).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }));
      else if (hrs > 0) setCountdown(`${hrs}h ${mins}m ${secs}s`);
      else setCountdown(`${mins}m ${secs}s`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [l?.auction_end, l?.status]);

  if (!l || l.listing_type !== "auction" || l.status !== "active") return null;

  return (
    <div>
      {/* Auktionsende */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: colors.muted, marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Gavel size={14} /> {bidHistory.length || bids.length} {(bidHistory.length || bids.length) === 1 ? "Gebot" : "Gebote"}
        </span>
        {countdown && (
          <span style={{
            fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
            color: urgency ? "#c62828" : colors.muted,
            fontSize: urgency ? 14 : 13,
          }}>
            <Clock size={14} /> {countdown}
          </span>
        )}
      </div>

      {/* Auktionsende Datum */}
      {l.auction_end && (
        <p style={{ fontSize: 12, fontWeight: 600, color: colors.dark, margin: "0 0 12px", background: colors.cream, padding: "8px 12px", borderRadius: 6 }}>
          Auktionsende: {new Date(l.auction_end).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}, {new Date(l.auction_end).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} Uhr
        </p>
      )}

      {/* Timer-Verlängerung */}
      <p style={{ fontSize: 11, color: colors.muted, marginBottom: 12, lineHeight: 1.4 }}>
        Gebot in den letzten 3 Minuten? Auktion verlängert sich automatisch um 3 Minuten.
      </p>

      {/* Dein Preislimit */}
      {myBid && !isOwner && (
        <div style={{
          padding: "10px 14px", borderRadius: 8, marginBottom: 12,
          background: bids[0]?.bidder_id === user?.id ? "#E8F5E9" : "#FFF3E0",
          border: `1px solid ${bids[0]?.bidder_id === user?.id ? "#B8D8B8" : "#FFD0A0"}`,
          fontSize: 13,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: bids[0]?.bidder_id === user?.id ? "#2E7D32" : "#E65100" }}>
              {bids[0]?.bidder_id === user?.id ? "Du führst!" : "Du wurdest überboten"}
            </span>
            <span style={{ fontSize: 12, color: colors.muted }}>
              {myBid.max_amount > myBid.amount
                ? `Preislimit: CHF ${myBid.max_amount?.toFixed(2)}`
                : `Gebot: CHF ${myBid.amount?.toFixed(2)}`}
            </span>
          </div>
          {myBid.max_amount > myBid.amount && (
            <button onClick={async () => {
              try {
                await removePreislimit(l.id, user.id);
                const newMyBid = await getMyBid(l.id, user.id);
                setMyBid(newMyBid);
              } catch (err) { console.error(err); }
            }} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, color: colors.muted, textDecoration: "underline",
              fontFamily: fonts.body, padding: "4px 0 0", display: "block",
            }}>
              Preislimit entfernen (Gebot bleibt bei CHF {myBid.amount?.toFixed(2)})
            </button>
          )}
        </div>
      )}

      {/* Sofortkauf Button */}
      {l.buy_now_price > 0 && !isOwner && (
        <button onClick={() => { if (!user) { router.push("/login"); return; } onBuyNowModal(); }}
          style={{ width: "100%", padding: "14px", borderRadius: radius.sm, border: "none", background: colors.teal, color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <ShoppingBag size={18} /> SOFORT KAUFEN · CHF {fmtPrice(l.buy_now_price)}
        </button>
      )}

      {/* Bieten Button */}
      {!isOwner && (
        <button onClick={() => {
          if (!user) { router.push("/login"); return; }
          onBidModal(bids, myBid);
        }} style={{ width: "100%", padding: "14px", borderRadius: radius.sm, border: `2px solid ${colors.yellow}`, background: "transparent", color: colors.dark, fontSize: 15, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Gavel size={18} /> GEBOT ABGEBEN
        </button>
      )}
      {isOwner && <p style={{ fontSize: 11, color: colors.mutedLt, textAlign: "center", marginBottom: 8 }}>Das ist dein eigenes Inserat</p>}

      {/* ── Gebotsverlauf (Ricardo-Stil) ───────────────────── */}
      {(bidHistory.length > 0 || bids.length > 0) && (
        <div style={{ fontSize: 13, marginTop: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 8px" }}>Gebotsverlauf</p>
          {(bidHistory.length > 0 ? bidHistory : bids.map(b => ({ ...b, bid_type: "manual", bidder: b.bidder }))).slice(0, 20).map((b, i) => (
            <div key={b.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: `1px solid ${colors.borderLt}`,
              background: i === 0 ? `${colors.teal}06` : "transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: i === 0 ? 700 : 500, color: i === 0 ? colors.dark : colors.graphite }}>
                  {b.bidder?.display_name || "Bieter"}
                </span>
                {b.bid_type === "auto" && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: colors.muted, background: colors.cloud, padding: "1px 6px", borderRadius: 4 }}>automatisch</span>
                )}
                {i === 0 && <span style={{ fontSize: 9, color: colors.teal, fontWeight: 700 }}>Höchstbietend</span>}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontWeight: 700, color: colors.dark }}>CHF {fmtPrice(b.amount)}</span>
                <span style={{ display: "block", fontSize: 10, color: colors.muted }}>
                  {new Date(b.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}, {new Date(b.created_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
