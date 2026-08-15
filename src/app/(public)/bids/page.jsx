"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/supabase";
import { Gavel, Clock, Trophy, XCircle, Loader2, ChevronRight } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";

export default function MeinGebotePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);

      // Alle Auktionen auf die der User geboten hat
      const { data, error } = await supabase
        .from("bids")
        .select(`
          id, amount, max_amount, created_at, listing_id,
          listing:listings!bids_listing_id_fkey(
            id, title, price, status, listing_type, auction_end, buy_now_price,
            images:listing_images(url, sort_order),
            seller:profiles!listings_user_id_fkey(display_name)
          )
        `)
        .eq("bidder_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Bids load error:", error);
        setLoading(false);
        return;
      }

      // Für jedes Gebot: höchstes Gebot holen um Status zu bestimmen
      const enriched = await Promise.all((data || []).map(async (bid) => {
        const listing = bid.listing;
        if (!listing) return null;

        // Höchstes Gebot für dieses Listing (public_bids: fremde Gebote ohne max_amount)
        const { data: topBid } = await supabase
          .from("public_bids")
          .select("bidder_id, amount")
          .eq("listing_id", bid.listing_id)
          .order("amount", { ascending: false })
          .limit(1)
          .maybeSingle();

        const isTopBidder = topBid?.bidder_id === session.user.id;
        const isEnded = listing.auction_end && new Date(listing.auction_end) <= new Date();
        const isSold = listing.status === "sold";
        const isExpired = listing.status === "expired";
        const isActive = listing.status === "active" && !isEnded;

        let status = "active";
        let statusLabel = "Aktiv";
        let statusColor = colors.yellow;

        if (isSold && isTopBidder) {
          status = "won"; statusLabel = "Gewonnen"; statusColor = "#2E7D32";
        } else if (isSold && !isTopBidder) {
          status = "lost"; statusLabel = "Verloren"; statusColor = colors.muted;
        } else if (isExpired) {
          status = "expired"; statusLabel = "Abgelaufen"; statusColor = colors.muted;
        } else if (isEnded && isTopBidder) {
          status = "won"; statusLabel = "Gewonnen"; statusColor = "#2E7D32";
        } else if (isEnded && !isTopBidder) {
          status = "lost"; statusLabel = "Verloren"; statusColor = colors.muted;
        } else if (isActive && isTopBidder) {
          status = "leading"; statusLabel = "Du führst"; statusColor = "#2E7D32";
        } else if (isActive && !isTopBidder) {
          status = "outbid"; statusLabel = "Überboten"; statusColor = "#E65100";
        }

        // Countdown
        let countdown = "";
        if (isActive && listing.auction_end) {
          const diff = new Date(listing.auction_end).getTime() - Date.now();
          if (diff > 86400000) {
            countdown = new Date(listing.auction_end).toLocaleDateString("de-CH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
          } else if (diff > 3600000) {
            const hrs = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            countdown = `${hrs}h ${mins}m`;
          } else if (diff > 0) {
            const mins = Math.floor(diff / 60000);
            countdown = `${mins}m`;
          }
        }

        const img = listing.images?.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))?.[0]?.url;

        return {
          ...bid,
          listing,
          img,
          status,
          statusLabel,
          statusColor,
          isTopBidder,
          topBidAmount: topBid?.amount || listing.price,
          countdown,
          isEnded: !isActive,
        };
      }));

      setBids(enriched.filter(Boolean));
      setLoading(false);
    }
    load();
  }, []);

  const fmtPrice = (p) => (parseFloat(p) || 0).toLocaleString("de-CH", { minimumFractionDigits: 2 });

  const activeBids = bids.filter(b => !b.isEnded);
  const endedBids = bids.filter(b => b.isEnded);

  if (loading) return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={24} color={colors.muted} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 80px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: fonts.head, margin: "0 0 4px", letterSpacing: ".02em" }}>MEINE GEBOTE</h1>
        <p style={{ fontSize: 14, color: colors.muted, margin: "0 0 24px" }}>
          {bids.length} {bids.length === 1 ? "Auktion" : "Auktionen"} auf die du geboten hast
        </p>

        {bids.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Gavel size={48} color={colors.borderLt} style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: colors.dark, margin: "0 0 8px" }}>Noch keine Gebote</p>
            <p style={{ fontSize: 14, color: colors.muted, margin: "0 0 20px" }}>Stöbere durch Auktionen und gib dein erstes Gebot ab.</p>
            <Link href="/search?type=auction" style={{
              display: "inline-block", padding: "12px 28px", borderRadius: radius.sm,
              background: colors.yellow, color: colors.dark, fontSize: 14, fontWeight: 700,
              textDecoration: "none", fontFamily: fonts.body,
            }}>Auktionen entdecken</Link>
          </div>
        )}

        {/* ── AKTIVE GEBOTE ──────────────────────── */}
        {activeBids.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: ".08em", margin: "0 0 12px" }}>
              Aktiv ({activeBids.length})
            </p>
            {activeBids.map(bid => (
              <BidCard key={bid.id} bid={bid} fmtPrice={fmtPrice} />
            ))}
          </>
        )}

        {/* ── BEENDETE GEBOTE ────────────────────── */}
        {endedBids.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: ".08em", margin: "24px 0 12px" }}>
              Beendet ({endedBids.length})
            </p>
            {endedBids.map(bid => (
              <BidCard key={bid.id} bid={bid} fmtPrice={fmtPrice} ended />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function BidCard({ bid, fmtPrice, ended }) {
  const l = bid.listing;
  return (
    <Link href={`/listing/${l.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div style={{
        display: "flex", gap: 16, padding: "16px 18px",
        background: colors.surface, borderRadius: 0,
        border: `1px solid ${ended ? colors.borderLt : colors.border}`,
        marginBottom: 10, transition: "all .15s",
        opacity: ended ? 0.55 : 1,
        filter: ended ? "grayscale(30%)" : "none",
      }}
        onMouseEnter={e => { if (!ended) e.currentTarget.style.boxShadow = `0 2px 12px ${colors.yellow}20`; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}>
        {/* Image */}
        <div style={{
          width: 90, height: 90, borderRadius: 0, overflow: "hidden", flexShrink: 0,
          background: colors.warm, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {bid.img
            ? <img src={bid.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <Gavel size={24} color={colors.borderLt} />
          }
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <h3 style={{
              margin: 0, fontSize: 15, fontWeight: 700, color: colors.dark,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              textDecoration: ended && bid.status === "lost" ? "line-through" : "none",
            }}>
              {l.title}
            </h3>
            {/* Status Badge */}
            <span style={{
              flexShrink: 0, fontSize: 10, fontWeight: 800, letterSpacing: ".04em",
              padding: "3px 10px", borderRadius: 0,
              background: bid.status === "won" ? "#E8F5E9"
                : bid.status === "leading" ? "#E8F5E9"
                : bid.status === "outbid" ? "#FFF3E0"
                : bid.status === "lost" ? colors.cream
                : bid.status === "expired" ? colors.cream
                : `${colors.yellow}20`,
              color: bid.statusColor,
              textTransform: "uppercase",
            }}>
              {bid.status === "won" && <Trophy size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />}
              {bid.statusLabel}
            </span>
          </div>

          {/* Seller */}
          <p style={{ margin: "0 0 8px", fontSize: 12, color: colors.muted }}>
            {l.seller?.display_name || "Verkäufer"}
          </p>

          {/* Price row */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: 11, color: colors.muted }}>Dein Gebot</span>
              <p style={{ margin: "1px 0 0", fontSize: 15, fontWeight: 700, color: colors.dark }}>
                CHF {fmtPrice(bid.amount)}
                {bid.max_amount > bid.amount && (
                  <span style={{ fontSize: 11, color: colors.muted, fontWeight: 400, marginLeft: 4 }}>
                    (Limit: {fmtPrice(bid.max_amount)})
                  </span>
                )}
              </p>
            </div>
            <div>
              <span style={{ fontSize: 11, color: colors.muted }}>Aktuell</span>
              <p style={{ margin: "1px 0 0", fontSize: 15, fontWeight: 700, color: bid.isTopBidder ? "#2E7D32" : "#E65100" }}>
                CHF {fmtPrice(bid.topBidAmount)}
              </p>
            </div>
            {bid.countdown && (
              <div style={{ marginLeft: "auto" }}>
                <span style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 12, fontWeight: 700, fontFamily: fonts.body,
                  color: bid.countdown.includes("m") && !bid.countdown.includes("h") ? "#c62828" : colors.muted,
                }}>
                  <Clock size={12} /> {bid.countdown}
                </span>
              </div>
            )}
          </div>
        </div>

        <ChevronRight size={16} color={colors.borderLt} style={{ alignSelf: "center", flexShrink: 0 }} />
      </div>
    </Link>
  );
}
