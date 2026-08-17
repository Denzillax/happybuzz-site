"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Camera, MessageCircle, Phone, X, User, ShoppingBag, CheckCircle,
  Loader2, Star, Heart, MapPin, Clock, Truck, Share2, ChevronLeft, ChevronRight, ChevronDown, Tag, Gavel, CalendarDays, Flag, Mail, Link2, QrCode, Printer, Eye, Navigation,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import BeeIcon from "@/components/shared/BeeIcon";
import { BeeLevelBadge } from "@/components/shared/BeeLevel";
import { AccountBadge } from "@/components/shared/AccountBadge";
import { VerifiedSellerBadge } from "@/components/shared/VerifiedSellerBadge";
import { FounderBadge } from "@/components/shared/FounderBadge";
import { CategoryIcon } from "@/components/shared/CategoryIcon";
import { colors, fonts, radius } from "@/lib/theme";
import { BEE_IMPACT_RATE, CONDITIONS, FEE_TIERS, DEFAULT_FEE_PERCENT } from "@/lib/constants";
import {
  getListingPublic, toggleFavorite, isListingFavorited,
  incrementViewCount, logListingView, createPurchase, getUserAvgRating, getSimilarListings,
  getOrCreateConversation, placeBid, getBids, getBidHistory, getMyBid, adjustPreislimit, removePreislimit, finalizeAuction, createBooking, getBookingsForListing,
  getListingQuestions, askPublicQuestion, replyToQuestion, sendMessage,
  checkProfileComplete,
} from "@/lib/listings";
import { ListingCard } from "@/components/shared/ListingCard";
import { recordView } from "@/lib/recentlyViewed";
import { sanitizeDescription, isFormattedDescription } from "@/lib/richtext";
import { createNotification } from "@/lib/notifications";
import { makeArtRef, calcFee } from "@/lib/fees";

// ── Katalog-Design-Tokens (Hero/ListingCard-konsistent) ──
const INK = "#14110D";
const SAND = "#ECE3D2";
const PAPER = "#FBF8F2";
const PETROL = "#0B5E5C";
const MONO = "'Space Mono', ui-monospace, monospace";

// ── LocationMap: interaktive Leaflet-Karte mit Gemeindegrenze ──
// - rote Gemeindegrenze (Polygon via Nominatim polygon_geojson)
// - auf das Gebiet gezoomt (fitBounds)
// - Strg+Scrollen zum Zoomen; normales Scrollen scrollt die Seite (+ Hinweis)
function LocationMap({ city, canton }) {
  const elRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (!city || !elRef.current) return;
    let map, hintTimer, onWheel, cancelled = false;
    const el = elRef.current;
    (async () => {
      let place;
      try {
        const q = `${city}${canton ? `, ${canton}` : ""}, Switzerland`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&polygon_geojson=1&limit=1`);
        place = (await res.json())?.[0];
      } catch {}
      if (cancelled || !el || !place) { if (!cancelled) setLoading(false); return; }
      const lat = parseFloat(place.lat), lon = parseFloat(place.lon);
      const L = (await import("leaflet")).default;
      if (cancelled || !el || el._leaflet_id) return;

      map = L.map(el, { scrollWheelZoom: false, zoomControl: true, center: [lat, lon], zoom: 13 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);

      let bounds = null;
      if (place.geojson && place.geojson.type !== "Point") {
        const poly = L.geoJSON(place.geojson, { style: { color: "#EB5E55", weight: 2.5, fillColor: "#EB5E55", fillOpacity: 0.12 } }).addTo(map);
        bounds = poly.getBounds();
      }
      L.circleMarker([lat, lon], { radius: 8, color: "#fff", weight: 2.5, fillColor: "#5B8C5A", fillOpacity: 1 }).addTo(map);
      if (bounds && bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
      else map.setView([lat, lon], 13);
      setLoading(false);

      onWheel = (e) => {
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); map.setZoom(map.getZoom() + (e.deltaY < 0 ? 1 : -1)); }
        else { setHint(true); clearTimeout(hintTimer); hintTimer = setTimeout(() => setHint(false), 1300); }
      };
      el.addEventListener("wheel", onWheel, { passive: false });
    })();

    return () => {
      cancelled = true;
      clearTimeout(hintTimer);
      if (onWheel && el) el.removeEventListener("wheel", onWheel);
      if (map) map.remove();
    };
  }, [city, canton]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={elRef} style={{ height: 480, width: "100%", background: "#eef1f3" }} />
      {loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted, fontSize: 13, pointerEvents: "none" }}>Karte wird geladen...</div>
      )}
      {hint && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.35)", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: fonts.body, pointerEvents: "none", zIndex: 401 }}>
          Mit Strg + Scrollen zoomen
        </div>
      )}
    </div>
  );
}

export default function ListingDetail() {
  const params = useParams();
  const router = useRouter();
  const [l, setListing] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const viewCounted = useRef(false);
  const [sellerRating, setSellerRating] = useState({ avg: 0, count: 0 });
  const [activeImg, setActiveImg] = useState(0);
  // Mobile Kauf-Leiste: sichtbar, sobald die echte Kaufbox aus dem Bild ist
  const buyBoxRef = useRef(null);
  const [buyBoxSichtbar, setBuyBoxSichtbar] = useState(true);
  // Touch-Wischen in der Galerie (unterdrueckt den Lightbox-Klick nach Swipe)
  const touchStartX = useRef(null);
  const swiped = useRef(false);
  const [lightbox, setLightbox] = useState(false);

  // Lightbox Keyboard (ESC, Arrows)
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") setActiveImg(i => i > 0 ? i - 1 : (l?.images?.length || 1) - 1);
      if (e.key === "ArrowRight") setActiveImg(i => i < (l?.images?.length || 1) - 1 ? i + 1 : 0);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, l]);
  const [buyState, setBuyState] = useState("idle"); // idle|confirm|buying|success|error
  const [buyError, setBuyError] = useState("");
  const [similar, setSimilar] = useState([]);
  const [bids, setBids] = useState([]);
  const [bidHistory, setBidHistory] = useState([]);
  const [showAllBids, setShowAllBids] = useState(false);
  const [myBid, setMyBid] = useState(null);
  const [auctionResult, setAuctionResult] = useState(null); // null | {status, winner, price}
  const [countdown, setCountdown] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState("");
  const [bidModal, setBidModal] = useState(null); // null | "bid" | "buynow"
  const [bidShipping, setBidShipping] = useState("shipping");
  const [bookStart, setBookStart] = useState("");
  const [bookEnd, setBookEnd] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [replyText, setReplyText] = useState({});
  const [msgPublic, setMsgPublic] = useState(true);
  const [msgText, setMsgText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [profileWarning, setProfileWarning] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerSending, setOfferSending] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [reportReason, setReportReason] = useState("");
  const [reportText, setReportText] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getListingPublic(params.id);
        setListing(data);
        recordView(data);
        if (data.user_id) getUserAvgRating(data.user_id).then(setSellerRating).catch(() => {});
        if (data.category_id) getSimilarListings(params.id, data.category_id).then(setSimilar).catch(() => {});
        if (data.listing_type === "auction") {
          getBids(params.id).then(setBids).catch(() => {});
          getBidHistory(params.id).then(setBidHistory).catch(() => {});
          // Check if auction has ended
          if (data.auction_end && new Date() >= new Date(data.auction_end) && data.status === "active") {
            finalizeAuction(params.id).then(result => {
              if (result) {
                setAuctionResult(result);
                if (result.status === "sold") setListing(prev => ({ ...prev, status: "sold", price: result.price }));
                if (result.status === "expired") setListing(prev => ({ ...prev, status: "expired" }));
              }
            }).catch(() => {});
          }
        }
        getListingQuestions(params.id).then(setQuestions).catch(() => {});
        // View Count: für alle (auch anonyme), ausser Besitzer
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const u = session?.user || null;
          if (u) {
            setUser(u);
            setIsFav(await isListingFavorited(u.id, params.id));
            if (data.listing_type === "auction") getMyBid(params.id, u.id).then(setMyBid).catch(() => {});
          }
          if (!u || u.id !== data.user_id) {
            if (!viewCounted.current) {
              viewCounted.current = true;
              incrementViewCount(params.id).catch(() => {});
              const src = (() => { try { const r = document.referrer; if (!r) return "direct"; const ru = new URL(r); if (ru.host !== location.host) return "extern"; if (ru.pathname.startsWith("/search")) return "search"; return "intern"; } catch { return "direct"; } })();
              logListingView(params.id, src).catch(() => {});
            }
          }
        } catch {}
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [params.id]);

  // Auth state listener — keeps user updated after session refresh
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription?.unsubscribe();
  }, []);

  // Live-Zähler: aktive Betrachter via Realtime-Presence
  useEffect(() => {
    if (!params.id) return;
    const key = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const ch = supabase.channel(`presence-listing-${params.id}`, { config: { presence: { key } } });
    ch.on("presence", { event: "sync" }, () => {
      setViewerCount(Object.keys(ch.presenceState()).length || 1);
    }).subscribe((status) => {
      if (status === "SUBSCRIBED") ch.track({ at: Date.now() });
    });
    return () => { supabase.removeChannel(ch); };
  }, [params.id]);

  // Live countdown timer for auctions
  useEffect(() => {
    if (!l || l.listing_type !== "auction" || !l.auction_end || l.status !== "active") return;
    const tick = () => {
      const now = new Date();
      const end = new Date(l.auction_end);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("Auktion beendet");
        // Auto-finalize
        finalizeAuction(l.id).then(result => {
          if (result) {
            setAuctionResult(result);
            if (result.status === "sold") setListing(prev => ({ ...prev, status: "sold", price: result.price }));
            if (result.status === "expired") setListing(prev => ({ ...prev, status: "expired" }));
          }
        }).catch(() => {});
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hrs = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (diff > 86400000) setCountdown(end.toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }));
      else if (hrs > 0) setCountdown(`${hrs}h ${mins}m ${secs}s`);
      else setCountdown(`${mins}m ${secs}s`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [l?.auction_end, l?.status]);

  // Beobachtet die Kaufbox fuer die mobile Kauf-Leiste. MUSS vor den
  // Early-Returns stehen (Hook-Reihenfolge). Solange die Box noch nicht
  // gerendert ist, bleibt der Effect wirkungslos und laeuft nach dem Laden neu.
  useEffect(() => {
    const el = buyBoxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setBuyBoxSichtbar(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, l?.id]);

  if (loading) return <div style={{ fontFamily: fonts.body, background: "#FBF8F2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 size={24} color={colors.muted} style={{ animation: "spin 1s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  if (!l) return <div style={{ fontFamily: fonts.body, background: "#FBF8F2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: colors.muted }}>Inserat nicht gefunden</p></div>;

  const imgs = l.images || [];
  const isOwner = user && user.id === l.user_id;
  const fmtPrice = (p) => (parseFloat(p) || 0).toLocaleString("de-CH", { minimumFractionDigits: 2 });
  // Auktion ohne Gebote zeigt den STARTPREIS — nie l.price (dort kann ein
  // verwaister Wert liegen, z.B. der importierte Festpreis der Quelle).
  const displayPrice = l.listing_type === "auction"
    ? (bids.length > 0 ? bids[0].amount : (l.start_price ?? 0))
    : (l.listing_type === "rent" || l.listing_type === "service") ? (l.rent_price || l.price) : l.price;

  // ── Gebotsregeln: exakter Spiegel der Serverfunktionen ──
  // bid_increment()-Staffel und effective_bid_increment() (bid_step gewinnt).
  // Die Maske MUSS denselben Regeln folgen wie proxy_bid, sonst blockiert sie
  // gueltige Gebote oder belegt ungueltige vor.
  const bidTier = (p) => (p < 10 ? 0.5 : p < 50 ? 1 : p < 100 ? 2 : p < 500 ? 5 : p < 1000 ? 10 : 20);
  const effInc = l.bid_step != null ? Number(l.bid_step) : bidTier(Number(bids[0]?.amount ?? l.start_price ?? 1));
  // Erstes Gebot: der Server akzeptiert den Startpreis selbst.
  // Danach: sichtbares Gebot + Schritt.
  const nextBid = bids.length > 0 ? Number(bids[0].amount) + effInc : Number(l.start_price || 1);
  const beeImpact = calcFee(displayPrice, l.fee_percentage || DEFAULT_FEE_PERCENT) * BEE_IMPACT_RATE;
  const condLabel = CONDITIONS.find((c) => c.value === l.condition)?.label || l.condition;

  const handleFav = async () => { if (!user) { router.push("/login"); return; } setIsFav(await toggleFavorite(user.id, l.id)); };

  const handleSendMsg = async () => {
    if (!user || !msgText.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      const sendPublic = true; // Block = öffentliche Fragen; privat läuft über den Chat
      const filtered = questions.filter(q => q.is_public);

      if (filtered.length > 0) {
        // Bestehende Conversation → Antwort hinzufügen
        const lastConv = filtered[filtered.length - 1];
        await replyToQuestion(lastConv.id, user.id, msgText.trim());
      } else {
        // Neue Conversation erstellen — Besitzer kann nur auf bestehende Fragen
        // antworten, nicht mit sich selbst eine Unterhaltung eröffnen.
        if (user.id === l.user_id) { setSendingMsg(false); return; }

        const { data: newConv, error: convErr } = await supabase
          .from("conversations")
          .insert({ listing_id: l.id, buyer_id: user.id, seller_id: l.user_id, is_public: sendPublic })
          .select()
          .single();
        if (convErr) { console.error("Conv error:", convErr); return; }

        const { error: msgErr } = await supabase
          .from("messages")
          .insert({ conversation_id: newConv.id, sender_id: user.id, content: msgText.trim() });
        if (msgErr) { console.error("Msg error:", msgErr); toast.error(msgErr.message || "Nachricht konnte nicht gesendet werden."); return; }

        await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", newConv.id);
      }

      setMsgText("");
      setMsgSent(true);
      setTimeout(() => setMsgSent(false), 3000);
      getListingQuestions(params.id).then(setQuestions);
    } catch (err) { console.error("Send error:", err); toast.error(err?.message || "Nachricht konnte nicht gesendet werden."); }
    finally { setSendingMsg(false); }
  };

  // Private Unterhaltung öffnen/erstellen und zum Chat-Thread navigieren.
  const startPrivateChat = async () => {
    if (!user) { router.push("/login"); return; }
    if (user.id === l.user_id) return; // kein Chat mit sich selbst
    if (sendingMsg) return;
    setSendingMsg(true);
    try {
      const { data: existing } = await supabase.from("conversations")
        .select("id").eq("listing_id", l.id).eq("buyer_id", user.id).eq("seller_id", l.user_id).eq("is_public", false).maybeSingle();
      let convId = existing?.id;
      if (!convId) {
        const { data: nc, error } = await supabase.from("conversations")
          .insert({ listing_id: l.id, buyer_id: user.id, seller_id: l.user_id, is_public: false })
          .select("id").single();
        if (error) { console.error(error); return; }
        convId = nc?.id;
      }
      if (convId) router.push(`/chat/${convId}`);
    } catch (err) { console.error(err); toast.error("Chat konnte nicht geöffnet werden."); }
    finally { setSendingMsg(false); }
  };

  // Preisvorschlag senden (privater Chat + Offer-Nachricht + Notification).
  const sendPriceOffer = async () => {
    if (!user) { router.push("/login"); return; }
    const v = parseFloat(String(offerAmount).replace(",", "."));
    if (!v || v <= 0 || offerSending) return;
    setOfferSending(true);
    try {
      const { data: existing } = await supabase.from("conversations")
        .select("id").eq("listing_id", l.id).eq("buyer_id", user.id).eq("seller_id", l.user_id).eq("is_public", false).maybeSingle();
      let convId = existing?.id;
      if (!convId) {
        const { data: nc, error } = await supabase.from("conversations")
          .insert({ listing_id: l.id, buyer_id: user.id, seller_id: l.user_id, is_public: false }).select("id").single();
        if (error) { console.error(error); return; }
        convId = nc?.id;
      }
      if (!convId) return;
      await sendMessage(convId, user.id, `Preisvorschlag: CHF ${v.toLocaleString("de-CH")}`, { messageType: "offer", offerAmount: v });
      try { await createNotification(l.user_id, "offer", "Neuer Preisvorschlag", `CHF ${v.toLocaleString("de-CH")} für "${l.title}"`, `/chat/${convId}`, "msg_offer"); } catch {}
      setShowOfferModal(false);
      router.push(`/chat/${convId}`);
    } catch (err) { console.error(err); toast.error("Preisvorschlag konnte nicht gesendet werden."); }
    finally { setOfferSending(false); }
  };

  const handleBuy = async () => {
    if (!user) { router.push("/login"); return; }
    if (buyState === "idle") {
      // Profil-Check vor Kauf
      const check = await checkProfileComplete(user.id, "buy");
      if (!check.complete) { setProfileWarning(check.missing); return; }
      setProfileWarning(null);
      setBuyState("confirm"); return;
    }
    if (buyState === "confirm") {
      setBuyState("buying");
      try {
        const purchaseId = await createPurchase(user.id, l.id);
        setBuyState("success");
        setListing((prev) => ({ ...prev, status: "sold" }));
        if (purchaseId) router.push(`/order/${purchaseId}`);
      } catch (err) { setBuyError(err.message); setBuyState("error"); }
    }
  };

  return (
    <div style={{ fontFamily: fonts.body, background: "#FBF8F2", minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 32px 80px" }}>

        {/* ── BREADCRUMBS ─────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 13, color: colors.muted, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: colors.muted, textDecoration: "none" }}>BEEDARO</Link>
          {l.categoryPath?.map((cat, i) => (
            <span key={cat.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: colors.mutedLt }}>/</span>
              <Link href={`/search?category=${cat.slug}`} style={{ color: i === l.categoryPath.length - 1 ? colors.dark : colors.muted, fontWeight: i === l.categoryPath.length - 1 ? 600 : 400, textDecoration: "none" }}>{cat.name}</Link>
            </span>
          ))}
        </div>

        {/* ── EIGENTÜMER-LEISTE (Desktop oben; mobil klebt sie unten
               ueber der Bottom-Nav, siehe .mobile-cta-bar weiter unten) ── */}
        {isOwner && (
          <div className="owner-bar-desktop" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 14px", marginBottom: 16, background: `${colors.yellow}18`, border: `1px solid ${INK}` }}>
            <BeeIcon size={16} />
            <span style={{ fontSize: 13, fontWeight: 700, color: INK, marginRight: "auto" }}>Das ist dein Inserat</span>
            <Link href={`/listings/${l.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: colors.yellow, border: `1.5px solid ${INK}`, color: INK, fontSize: 12.5, fontWeight: 800, textDecoration: "none" }}>
              Bearbeiten
            </Link>
            <Link href="/listings" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#fff", border: `1px solid ${INK}`, color: INK, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
              Meine Inserate
            </Link>
          </div>
        )}

        {/* ── 2-COLUMN LAYOUT ─────────────────────────── */}
        {/* Spalten kommen aus globals.css (.detail-grid): mobil einspaltig.
            Inline gridTemplateColumns wuerde die Media-Query aushebeln. */}
        <div className="detail-grid">

          {/* ════ LEFT COLUMN ════ */}
          <div>
            {/* ── IMAGE GALLERY ──────────────────────── */}
            <div className="lg-gallery" style={{ background: colors.surface, borderRadius: 0, border: `1px solid ${INK}`, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ position: "relative", aspectRatio: "4/3", background: "#fff", cursor: imgs.length > 0 ? "zoom-in" : "default", overflow: "hidden" }}
                onClick={() => { if (swiped.current) { swiped.current = false; return; } if (imgs.length > 0) setLightbox(true); }}
                onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  if (touchStartX.current == null) return;
                  const dx = e.changedTouches[0].clientX - touchStartX.current;
                  touchStartX.current = null;
                  if (Math.abs(dx) > 40 && imgs.length > 1) {
                    swiped.current = true;
                    setActiveImg(i => dx < 0 ? (i < imgs.length - 1 ? i + 1 : 0) : (i > 0 ? i - 1 : imgs.length - 1));
                  }
                }}
                onMouseMove={(e) => {
                  if (imgs.length === 0) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const px = e.clientX - rect.left;
                  // Zoom nur ZWISCHEN den Pfeilen (Innenkante: 12px Abstand + 40px
                  // Breite = 52px). Ueber den Pfeilen bleibt das Bild ruhig, sonst
                  // zoomt es beim Ansteuern der Navigation unter dem Cursor weg.
                  const EDGE = imgs.length > 1 ? 52 : 0;
                  const img = e.currentTarget.querySelector(".zoom-img");
                  if (!img) return;
                  if (px < EDGE || px > rect.width - EDGE) { img.style.transform = "scale(1)"; return; }
                  const x = (px / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  img.style.transformOrigin = `${x}% ${y}%`; img.style.transform = "scale(2)";
                }}
                onMouseLeave={(e) => {
                  const img = e.currentTarget.querySelector(".zoom-img");
                  if (img) { img.style.transform = "scale(1)"; }
                }}>
                {imgs.length > 0
                  ? <img className="zoom-img" src={imgs[activeImg]?.url} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fff", pointerEvents: "none" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={60} color={colors.mutedLt} /></div>
                }
                {/* Favorite Heart */}
                <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleFav(); }} style={{
                  position: "absolute", top: 14, right: 14, width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(255,255,255,.85)", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,.1)", transition: "all .15s",
                }}>
                  <Heart size={20} fill={isFav ? colors.yellow : "none"} color={isFav ? colors.yellow : colors.muted} />
                </button>
                {imgs.length > 1 && <>
                  <button onClick={(e) => { e.stopPropagation(); setActiveImg((i) => i > 0 ? i - 1 : imgs.length - 1); }} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.8)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={20} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setActiveImg((i) => i < imgs.length - 1 ? i + 1 : 0); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.8)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={20} /></button>
                </>}
              </div>
              {imgs.length > 1 && (
                <div style={{ display: "flex", gap: 8, padding: "12px 16px", overflowX: "auto" }}>
                  {imgs.map((img, i) => (
                    <div key={i} onClick={() => setActiveImg(i)} style={{ width: 64, height: 64, borderRadius: 0, overflow: "hidden", border: i === activeImg ? `2px solid ${colors.yellow}` : `2px solid transparent`, cursor: "pointer", flexShrink: 0 }}>
                      <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── ATTRIBUTE BAR ──────────────────────── */}
            <div className="attr-strip" style={{ display: "flex", gap: 0, marginBottom: 20, background: colors.surface, borderRadius: 0, border: `1px solid ${INK}`, overflow: "hidden" }}>
              {l.condition && (
                <div className="attr-cell" style={{ flex: 1, padding: "14px 18px", borderRight: `1px solid ${colors.borderLt}` }}>
                  <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, color: colors.muted, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>Zustand</p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: INK }}>{condLabel}</p>
                </div>
              )}
              {l.categoryName && (
                <div className="attr-cell" style={{ flex: 1, padding: "14px 18px", borderRight: `1px solid ${colors.borderLt}` }}>
                  <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, color: colors.muted, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>Kategorie</p>
                  <Link href={`/search?category=${l.categoryPath?.[l.categoryPath.length - 1]?.slug || ""}`} className="bd-link" style={{ display: "inline-block", margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: INK }}>{l.categoryName}</Link>
                </div>
              )}
              {l.city && (
                <div className="attr-cell" style={{ flex: 1, padding: "14px 18px" }}>
                  <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, color: colors.muted, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>Standort</p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: INK }}>{l.city}</p>
                </div>
              )}
            </div>

            {/* ── BESCHREIBUNG ───────────────────────── */}
            <div style={{ background: colors.surface, borderRadius: 0, border: `1px solid ${INK}`, padding: "24px 28px", marginBottom: 20 }}>
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>Beschreibung</p>
              {/* Formatierte Beschreibungen (Mini-HTML aus dem Editor) werden
                  IMMER frisch durch sanitizeDescription gefiltert — nie
                  ungefilterten DB-Bestand rendern. Alt-Bestand bleibt Plaintext. */}
              {isFormattedDescription(l.description) ? (
                <div className="rich-desc" style={{ fontSize: 14, lineHeight: 1.7, color: colors.dark }}
                  dangerouslySetInnerHTML={{ __html: sanitizeDescription(l.description) }} />
              ) : (
                <div style={{ fontSize: 14, lineHeight: 1.7, color: colors.dark, whiteSpace: "pre-wrap" }}>{l.description || "Keine Beschreibung"}</div>
              )}
            </div>

            {/* ── LIEFERUNG & BEZAHLUNG ───────────────── */}
            <div style={{ background: colors.surface, borderRadius: 0, border: `1px solid ${INK}`, padding: "24px 28px", marginBottom: 20 }}>
              <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Lieferung & Bezahlung</p>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "12px 20px", fontSize: 13 }}>
                <span style={{ color: colors.muted }}>Lieferung</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Truck size={14} color={colors.muted} /> {l.shipping_method === "brief" ? "Brief" : l.shipping_method === "sperrgut" ? "Sperrgut" : "Paket"}{l.ship_speed === "priority" ? " A-Post" : l.ship_speed === "economy" ? " B-Post" : ""}{l.free_shipping ? ", Gratis" : l.shipping_cost ? `, CHF ${fmtPrice(l.shipping_cost)}` : ""}</span>
                {l.pickup_only && <>
                  <span style={{ color: colors.muted }}>Abholung</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} color={colors.muted} /> {l.city || "Vor Ort"}</span>
                </>}
                <span style={{ color: colors.muted }}>Bezahlung</span>
                <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {l.pay_twint && <span style={{ padding: "3px 10px", borderRadius: 999, background: "#fff", border: `1px solid ${colors.border}`, fontSize: 12, fontWeight: 600 }}>TWINT</span>}
                  {l.pay_bank && <span style={{ padding: "3px 10px", borderRadius: 999, background: "#fff", border: `1px solid ${colors.border}`, fontSize: 12, fontWeight: 600 }}>Banküberweisung</span>}
                  {l.pay_cash && <span style={{ padding: "3px 10px", borderRadius: 999, background: "#fff", border: `1px solid ${colors.border}`, fontSize: 12, fontWeight: 600 }}>Barzahlung</span>}
                </span>
              </div>
            </div>

            {/* ── VERKÄUFER ──────────────────────────── */}
            <div style={{ background: colors.surface, borderRadius: 0, border: `1px solid ${INK}`, padding: "24px 28px", marginBottom: 20 }}>
              <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Verkäufer</p>
              {/* flexWrap: auf schmalen Screens rutscht ALLE ARTIKEL auf eine
                  eigene Zeile statt die Infos zu quetschen */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  {l.sellerAvatar ? <img src={l.sellerAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={28} color={colors.yellow} />}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <Link href={`/user/${l.user_id}`} style={{ fontSize: 16, fontWeight: 700, color: colors.dark, textDecoration: "none" }}>
                      {l.seller?.account_type === "business" && l.seller?.company_name ? l.seller.company_name : l.sellerName}
                    </Link>
                    <AccountBadge accountType={l.seller?.account_type} />
                    <VerifiedSellerBadge profile={l.seller} size="md" />
                    <FounderBadge profile={l.seller} size="md" />
                    <BeeLevelBadge xp={l.sellerXp} size="md" />
                  </div>
                  {sellerRating.count > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ display: "flex", gap: 2 }}>{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} color={s <= Math.round(sellerRating.avg) ? colors.yellow : colors.borderLt} fill={s <= Math.round(sellerRating.avg) ? colors.yellow : "none"} />)}</div>
                      <span style={{ fontSize: 13, color: colors.muted, whiteSpace: "nowrap" }}>{sellerRating.avg.toFixed(1)} ({sellerRating.count} {sellerRating.count === 1 ? "Bewertung" : "Bewertungen"})</span>
                    </div>
                  )}
                  <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>Dabei seit {l.sellerSince ? new Date(l.sellerSince).toLocaleDateString("de-CH", { month: "long", year: "numeric" }) : "–"}</p>
                </div>
                <Link href={`/user/${l.user_id}`} style={{ padding: "8px 16px", borderRadius: radius.sm, border: `1.5px solid ${colors.border}`, fontSize: 12, fontWeight: 700, color: colors.dark, textDecoration: "none", whiteSpace: "nowrap" }}>ALLE ARTIKEL</Link>
              </div>
            </div>

            {/* ── STANDORT (KARTE) ──────────────────── */}
            {l.city && (
              <div style={{ background: colors.surface, borderRadius: 0, border: `1px solid ${INK}`, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ padding: "16px 28px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Standort</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.muted, display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={13} /> {l.city}, Schweiz
                    </p>
                  </div>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${l.city}, Schweiz`)}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 0, background: colors.teal, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: fonts.body, textDecoration: "none", flexShrink: 0 }}>
                    <Navigation size={15} /> Route planen
                  </a>
                </div>
                {/* Karte nur am Desktop: mobil reichen Ort + Route planen */}
                <div className="map-desktop-only"><LocationMap city={l.city} canton={l.canton} /></div>
              </div>
            )}

            {/* ── NACHRICHTEN (aufklappbar) ─────────────────────────── */}
            <div style={{ background: colors.surface, borderRadius: 0, border: `1px solid ${INK}`, overflow: "hidden", marginBottom: 20 }}>
              {/* Header mit Toggle */}
              <div onClick={() => setMsgOpen(!msgOpen)} style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageCircle size={16} color={colors.muted} />
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Fragen zum Inserat</p>
                  {questions.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: colors.teal, background: `${colors.teal}12`, padding: "2px 8px", borderRadius: 0 }}>
                      {questions.reduce((sum, q) => sum + (q.messages?.length || 0), 0)}
                    </span>
                  )}
                </div>
                <ChevronDown size={18} color={colors.muted} style={{ transform: msgOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              </div>

              {msgOpen && (
              <>
              <div style={{ padding: "10px 20px", borderBottom: `1px solid ${colors.borderLt}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: colors.muted }}>Öffentlich sichtbar. Andere sehen Frage und Antwort.</span>
                {user && !isOwner && (
                  <button onClick={startPrivateChat} disabled={sendingMsg} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 0, border: "none", background: colors.teal, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" }}>
                    <MessageCircle size={14} /> Nachricht an Verkäufer
                  </button>
                )}
              </div>

              {/* Chat-Bereich — feste Höhe, WhatsApp-Style */}
              <div style={{ height: 320, overflowY: "auto", padding: "16px 20px", background: "#fff" }}>
                {(() => {
                  const filtered = questions.filter(q => q.is_public);
                  const allMsgs = filtered.flatMap(q => q.messages.map(m => ({ ...m, convId: q.id })));
                  allMsgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                  return allMsgs.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {allMsgs.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        const isSeller = msg.sender_id === l.user_id;
                        return (
                          <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                            <div style={{
                              maxWidth: "75%", padding: "8px 12px", borderRadius: 0,
                              background: isMe ? colors.yellow : colors.surface,
                              border: isMe ? "none" : `1px solid ${colors.borderLt}`,
                              borderBottomRightRadius: isMe ? 4 : 14,
                              borderBottomLeftRadius: isMe ? 14 : 4,
                            }}>
                              {!isMe && (
                                <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: isSeller ? colors.blue : colors.dark }}>
                                  {msg.sender?.display_name || "Benutzer"}
                                  {isSeller && <span style={{ fontSize: 9, padding: "1px 4px", borderRadius: 0, background: colors.blue, color: "#fff", fontWeight: 600, marginLeft: 4 }}>Verkäufer</span>}
                                </p>
                              )}
                              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: colors.dark }}>{msg.content}</p>
                              <p style={{ margin: "3px 0 0", fontSize: 10, color: isMe ? "rgba(0,0,0,.35)" : colors.mutedLt, textAlign: "right" }}>
                                {new Date(msg.created_at).toLocaleString("de-CH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <p style={{ fontSize: 13, color: colors.mutedLt }}>
                        {isOwner ? "Noch keine Fragen zu diesem Inserat." : "Noch keine Fragen. Stell die erste."}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Input-Bar — für Käufer UND Verkäufer */}
              {user && l.status === "active" && (
                <div style={{ padding: "10px 16px", borderTop: `1px solid ${colors.borderLt}`, background: colors.surface, display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && msgText.trim() && handleSendMsg()}
                    placeholder={isOwner ? "Öffentlich antworten..." : "Frage zum Inserat stellen..."}
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 0, border: `1.5px solid ${colors.borderLt}`, fontSize: 13, fontFamily: fonts.body, outline: "none", background: "#fff" }} />
                  <button onClick={handleSendMsg} disabled={!msgText.trim() || sendingMsg}
                    style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: msgText.trim() ? colors.yellow : colors.warm, cursor: msgText.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                    <MessageCircle size={16} color={msgText.trim() ? colors.dark : colors.mutedLt} />
                  </button>
                </div>
              )}

              {!user && l.status === "active" && (
                <div style={{ padding: "12px 20px", borderTop: `1px solid ${colors.borderLt}`, background: colors.surface }}>
                  <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>
                    <Link href="/login" style={{ color: colors.blue }}>Anmelden</Link> um eine Nachricht zu schreiben.
                  </p>
                </div>
              )}
              </>
              )}
            </div>
          </div>

          {/* ════ RIGHT COLUMN (STICKY SIDEBAR) ════ */}
          <div style={{ position: "sticky", top: 84 }}>

            {/* ── TITLE + PRICE CARD ─────────────────── */}
            <div ref={buyBoxRef} className="lg-buybox" style={{ background: colors.surface, borderRadius: 0, border: `1px solid ${INK}`, padding: "24px 28px", marginBottom: 14 }}>
              {/* Exponat-Kopf: Referenznummer + Zustands-Stempel.
                  Mobil (.cond-head in globals.css) steht der Stempel IMMER
                  unter der ART-Nr — einheitlich fuer alle Zustaende. */}
              <div className="cond-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px 10px", flexWrap: "wrap", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${INK}1f` }}>
                <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".04em", color: colors.muted }}>{makeArtRef(l.id)}</span>
                {l.condition && (
                  <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: PAPER, background: PETROL, borderRadius: 0, padding: "3px 9px", whiteSpace: "nowrap" }}>{condLabel}</span>
                )}
              </div>
              <h1 style={{ fontSize: 23, fontWeight: 700, fontFamily: fonts.head, margin: "0 0 8px", lineHeight: 1.2, letterSpacing: "-0.01em", color: INK }}>{l.title}</h1>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: colors.muted, display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={13} /> {new Date(l.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}
                {l.view_count > 0 && <><span style={{ margin: "0 4px" }}>·</span>{l.view_count} Aufrufe</>}
              </p>
              {viewerCount > 2 && (
                <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: colors.teal, display: "flex", alignItems: "center", gap: 5 }}>
                  <Eye size={13} /> {viewerCount} Leute schauen sich das gerade an
                </p>
              )}

              {/* Price */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 12, color: colors.muted, fontWeight: 600 }}>
                  {l.listing_type === "auction" ? (bids.length > 0 ? "Aktuelles Gebot" : "Startpreis") : l.listing_type === "rent" ? "Mietpreis" : l.listing_type === "service" ? "Preis" : l.listing_type === "free" ? "" : "Preis"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 32, fontWeight: 700, fontFamily: fonts.head, letterSpacing: ".01em" }}>
                  {l.listing_type === "free" ? "Gratis" : (l.listing_type === "rent" || l.listing_type === "service") ? `CHF ${fmtPrice(displayPrice)} / ${l.rent_period === "hour" ? "Stunde" : l.rent_period === "day" ? "Tag" : l.rent_period === "week" ? "Woche" : "Monat"}` : `CHF ${fmtPrice(displayPrice)}`}
                </p>
              </div>

              {/* Buy / Status */}
              {l.listing_type === "sell" && l.status === "active" && (
                <div>
                  <button onClick={() => {
                    if (isOwner) return;
                    if (!user) { router.push("/login"); return; }
                    setBidShipping(l.shipping_available ? "shipping" : "pickup");
                    setBidModal("buynow");
                  }} disabled={isOwner}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "15px", borderRadius: 0, border: "none", width: "100%",
                      background: isOwner ? colors.warm : colors.yellow,
                      color: isOwner ? colors.mutedLt : colors.dark,
                      fontSize: 15, fontWeight: 800, fontFamily: fonts.body, letterSpacing: ".03em",
                      cursor: isOwner ? "not-allowed" : "pointer", opacity: isOwner ? 0.6 : 1,
                    }}>
                    <ShoppingBag size={18} /> KAUFEN · CHF {fmtPrice(l.price)}
                  </button>
                  {!isOwner && l.is_negotiable && (
                    <button onClick={() => { if (!user) { router.push("/login"); return; } setOfferAmount(""); setShowOfferModal(true); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", borderRadius: 0, border: `1.5px solid ${colors.border}`, background: colors.surface, color: colors.dark, fontSize: 14, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer", width: "100%", marginTop: 8 }}>
                      <Tag size={16} /> Preis vorschlagen
                    </button>
                  )}
                  {isOwner && <p style={{ fontSize: 11, color: colors.mutedLt, textAlign: "center", marginTop: 6, marginBottom: 0 }}>Das ist dein eigenes Inserat</p>}

                  {showOfferModal && (
                    <div onClick={() => setShowOfferModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: radius.lg, padding: "24px 26px", maxWidth: 380, width: "100%", fontFamily: fonts.body }}>
                        <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: colors.dark }}>Preis vorschlagen</h3>
                        <p style={{ margin: "0 0 16px", fontSize: 13, color: colors.muted }}>Aktueller Preis: CHF {fmtPrice(l.price)}. Der Verkäufer kann annehmen, ablehnen oder kontern.</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                          <span style={{ fontSize: 14, color: colors.muted, fontWeight: 700 }}>CHF</span>
                          <input type="number" min="1" step="1" autoFocus value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendPriceOffer()}
                            placeholder="Dein Vorschlag"
                            style={{ flex: 1, padding: "12px 14px", borderRadius: radius.sm, border: `1.5px solid ${colors.border}`, fontSize: 16, fontFamily: fonts.body, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={sendPriceOffer} disabled={offerSending || !offerAmount} style={{ flex: 1, padding: 13, borderRadius: radius.sm, border: "none", background: offerAmount ? colors.teal : "#ccc", color: "#fff", fontSize: 14, fontWeight: 800, cursor: offerAmount ? "pointer" : "default", fontFamily: fonts.body }}>{offerSending ? "Senden…" : "Vorschlag senden"}</button>
                          <button onClick={() => setShowOfferModal(false)} style={{ padding: "13px 18px", borderRadius: radius.sm, border: `1.5px solid ${colors.border}`, background: "#fff", color: colors.muted, fontSize: 13, cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {l.status === "sold" && (
                <div style={{ padding: "14px", borderRadius: radius.sm, background: colors.greenSoft, color: colors.green, fontSize: 14, fontWeight: 700, textAlign: "center" }}>
                  {l.listing_type === "auction" ? "Auktion beendet. Verkauft" : "Verkauft"}
                  {auctionResult && user && auctionResult.winner === user.id && <div style={{ fontSize: 12, marginTop: 4 }}>Du hast die Auktion gewonnen! CHF {fmtPrice(auctionResult.price)}</div>}
                </div>
              )}
              {l.status === "rented" && (
                <div style={{ padding: "14px", borderRadius: radius.sm, background: "#E3F2FD", color: "#1565C0", fontSize: 14, fontWeight: 700, textAlign: "center" }}>
                  Aktuell vermietet
                </div>
              )}
              {l.status === "archived" && (
                <div style={{ padding: "14px", borderRadius: radius.sm, background: colors.cream, color: colors.muted, fontSize: 14, fontWeight: 700, textAlign: "center", border: `1px solid ${colors.border}` }}>
                  Nicht mehr verfügbar
                </div>
              )}
              {l.status === "paused" && (
                <div style={{ padding: "14px", borderRadius: radius.sm, background: "#FFF3E0", color: "#E65100", fontSize: 14, fontWeight: 700, textAlign: "center" }}>
                  Vorübergehend pausiert
                </div>
              )}
              {l.status === "expired" && (
                <div style={{ padding: "14px", borderRadius: radius.sm, background: colors.cream, color: colors.muted, fontSize: 14, fontWeight: 700, textAlign: "center", border: `1px solid ${colors.border}` }}>
                  Auktion abgelaufen. Keine Gebote eingegangen
                </div>
              )}

              {/* ── AUCTION UI (Steuerung nur aktiv, Gebotsverlauf immer) ── */}
              {l.listing_type === "auction" && l.status !== "paused" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: colors.muted, marginBottom: 12 }}>
                    <span><Gavel size={14} /> {bidHistory.length || bids.length} Gebote</span>
                    {countdown && (
                      <span style={{
                        fontWeight: 700, fontFamily: fonts.body,
                        color: countdown.includes("m") && !countdown.includes("h") && !countdown.includes("T") ? "#c62828" : colors.muted,
                        fontSize: countdown.includes("s") && !countdown.includes("h") ? 14 : 13,
                      }}>
                        <Clock size={14} /> {countdown}
                      </span>
                    )}
                  </div>

                  {l.status === "active" && (<>
                  {/* Timer-Verlängerung Hinweis */}
                  <p style={{ fontSize: 11, color: colors.muted, marginBottom: 12, lineHeight: 1.4 }}>
                    Gebot in den letzten 3 Minuten? Auktion verlängert sich automatisch um 3 Minuten.
                  </p>

                  {/* Dein Preislimit */}
                  {myBid && !isOwner && (
                    <div style={{
                      padding: "10px 14px", borderRadius: 0, marginBottom: 12,
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
                            : `Gebot: CHF ${myBid.amount?.toFixed(2)}`
                          }
                        </span>
                      </div>
                      {myBid.max_amount > myBid.amount && (
                        <button onClick={async () => {
                          try {
                            await removePreislimit(l.id, user.id);
                            const newMyBid = await getMyBid(l.id, user.id);
                            setMyBid(newMyBid);
                          } catch (err) { alert(err.message); }
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

                  {/* Mindestpreis: sieht NUR der Besitzer (Kaeufern bleibt er
                      wie bei Ricardo verborgen) */}
                  {isOwner && l.min_price > 0 && (
                    <div style={{ padding: "10px 14px", borderRadius: 0, background: colors.cream, border: `1px solid ${colors.borderLt}`, fontSize: 13, marginBottom: 8, display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ color: colors.muted }}>Mindestpreis (nur für dich sichtbar)</span>
                      <strong>CHF {fmtPrice(l.min_price)}</strong>
                    </div>
                  )}

                  {/* Sofortkauf Button — Besitzer sieht ihn wie alle,
                      nur ausgegraut (gleiches Muster wie der Bieten-Knopf) */}
                  {l.buy_now_price > 0 && (
                    <button onClick={() => { if (isOwner) return; if (!user) { router.push("/login"); return; } setBidModal("buynow"); }}
                      disabled={isOwner}
                      style={{ width: "100%", padding: "14px", borderRadius: 0, border: "none", background: isOwner ? colors.warm : colors.teal, color: isOwner ? colors.mutedLt : "#fff", fontSize: 15, fontWeight: 800, fontFamily: fonts.body, cursor: isOwner ? "not-allowed" : "pointer", opacity: isOwner ? 0.6 : 1, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <ShoppingBag size={18} /> SOFORT KAUFEN · CHF {fmtPrice(l.buy_now_price)}
                    </button>
                  )}

                  {/* Bieten Button */}
                  {!isOwner && (
                    <button onClick={() => {
                      if (!user) { router.push("/login"); return; }
                      // Vorbelegung nach Serverregeln: Limit erhoehen = eigenes
                      // Limit + Schritt (Server verlangt MEHR als das Limit);
                      // sonst das naechste gueltige Gebot.
                      setBidAmount(myBid ? (Number(myBid.max_amount) + effInc).toFixed(2) : nextBid.toFixed(2));
                      setBidModal("bid");
                    }} style={{ width: "100%", padding: "14px", borderRadius: 0, border: `2px solid ${colors.yellow}`, background: "transparent", color: colors.dark, fontSize: 15, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Gavel size={18} /> GEBOT ABGEBEN
                    </button>
                  )}
                  {isOwner && <p style={{ fontSize: 11, color: colors.mutedLt, textAlign: "center", marginBottom: 8 }}>Das ist dein eigenes Inserat</p>}
                  </>)}

                  {/* Bid History — Collapsible (immer sichtbar, auch nach Ablauf) */}
                  {(bidHistory.length > 0 || bids.length > 0) && (() => {
                    const allBids = bidHistory.length > 0 ? bidHistory : bids.map(b => ({ ...b, bid_type: "manual", bidder: b.bidder }));
                    const totalBids = allBids.length;
                    const visibleBids = showAllBids ? allBids : allBids.slice(0, 3);
                    const topBidderId = bids[0]?.bidder_id || bids[0]?.bidder?.id;
                    // Bieter maskieren (erste 2 Buchstaben + ****). Ausnahme: oberster/höchster
                    // Bieter wird voll angezeigt. Eigene Gebote werden farblich hervorgehoben.
                    const bidderLabel = (b, isTop) => {
                      const name = (b.bidder?.display_name || "").trim();
                      if (isTop) return name || "Bieter";
                      return name ? `${name.slice(0, 2)}****` : "Bieter";
                    };
                    return (
                    <div style={{ fontSize: 13, marginTop: 8 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 8px" }}>Gebotsverlauf</p>
                      {visibleBids.map((b, i) => {
                        const bidderUid = b.bidder_id || b.bidder?.id;
                        const isTopBidder = bidderUid === topBidderId && b.amount >= (bids[0]?.amount || 0);
                        const isMine = bidderUid && user?.id && bidderUid === user.id;
                        return (
                        <div key={b.id || i} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "8px 0", borderBottom: `1px solid ${colors.borderLt}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: (isMine || isTopBidder) ? 700 : 500, color: isMine ? colors.teal : (isTopBidder ? colors.dark : colors.muted), fontSize: 12 }}>
                              {bidderLabel(b, isTopBidder)}{isMine && " (du)"}
                            </span>
                            {b.bid_type === "auto" && (
                              <span style={{ fontSize: 9, fontWeight: 700, color: colors.muted, background: colors.cream, padding: "1px 6px", borderRadius: 0 }}>automatisch</span>
                            )}
                            {isTopBidder && <span style={{ fontSize: 9, color: colors.teal, fontWeight: 700 }}>Höchstbietend</span>}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontWeight: 700, color: colors.dark, fontSize: 12 }}>CHF {fmtPrice(b.amount)}</span>
                            <span style={{ display: "block", fontSize: 10, color: colors.muted }}>
                              {new Date(b.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}, {new Date(b.created_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                        );
                      })}
                      {totalBids > 3 && (
                        <button onClick={() => setShowAllBids(!showAllBids)} style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                          width: "100%", padding: "10px 0", marginTop: 4,
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: 12, fontWeight: 700, color: colors.yellow, fontFamily: fonts.body,
                        }}>
                          <ChevronDown size={14} style={{ transform: showAllBids ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                          {showAllBids ? "Weniger anzeigen" : `Alle ${totalBids} Gebote anzeigen`}
                        </button>
                      )}
                    </div>
                    );
                  })()}
                  {bidError && <p style={{ fontSize: 12, color: "#c00", margin: "8px 0 0" }}>{bidError}</p>}
                </div>
              )}

              {/* ── KAUFEN / SOFORTKAUF MODAL (für Festpreis + Auktion) ── */}
              {bidModal && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.6)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setBidModal(null)}>
                      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 0, width: "100%", maxWidth: 440, maxHeight: "85vh", overflow: "auto", fontFamily: fonts.body }}>
                        {/* Modal Header */}
                        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{l.title}</h3>
                            <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.muted }}>
                              {l.listing_type === "auction"
                                ? `ab CHF ${fmtPrice(l.start_price || 1)}.– · Endet ${l.auction_end ? new Date(l.auction_end).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " Uhr" : "—"}`
                                : `Festpreis CHF ${fmtPrice(l.price)}`
                              }
                            </p>
                          </div>
                          <button onClick={() => setBidModal(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: "16px 20px" }}>
                          {bidModal === "bid" ? (
                            <>
                              {/* Current Bid + naechstes gueltiges Gebot */}
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${colors.borderLt}`, fontSize: 14 }}>
                                <span style={{ color: colors.muted }}>{bids.length > 0 ? "Aktuelles Gebot" : "Startpreis"}</span>
                                <span style={{ fontWeight: 700 }}>CHF {fmtPrice(bids[0]?.amount || l.start_price || 0)}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${colors.borderLt}`, fontSize: 14, marginBottom: 12 }}>
                                <span style={{ color: colors.muted }}>Nächstes Gebot</span>
                                <span style={{ fontWeight: 700, color: colors.teal }}>CHF {fmtPrice(nextBid)}</span>
                              </div>

                              {/* Your Max Bid */}
                              <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 13, fontWeight: 700, color: colors.dark, display: "block", marginBottom: 6 }}>Dein Gebot</label>
                                <p style={{ fontSize: 11, color: colors.muted, margin: "0 0 8px" }}>
                                  {myBid
                                    ? `Aktuelles Preislimit: CHF ${Number(myBid.max_amount).toFixed(2)}. Erhöhen jederzeit, senken bis auf dein aktuelles Gebot von CHF ${Number(myBid.amount).toFixed(2)}.`
                                    : "Gib dein Preislimit ein. Das System bietet automatisch nur so viel wie nötig."
                                  }
                                </p>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 14, color: colors.muted }}>CHF</span>
                                  <input type="number" value={bidAmount} onChange={e => {
                                    let val = e.target.value;
                                    if (l.buy_now_price > 0 && parseFloat(val) >= l.buy_now_price) {
                                      val = String(l.buy_now_price - 1);
                                    }
                                    setBidAmount(val);
                                  }}
                                    min={myBid ? Number(myBid.amount) : (bids.length > 0 ? nextBid : Number(l.start_price || 0))}
                                    max={l.buy_now_price > 0 ? l.buy_now_price - 1 : undefined}
                                    step={effInc}
                                    style={{ flex: 1, padding: "12px 14px", borderRadius: 0, border: `1.5px solid ${colors.border}`, fontSize: 18, fontWeight: 700, fontFamily: fonts.body, outline: "none", textAlign: "right" }}
                                    onFocus={e => e.target.style.borderColor = colors.yellow}
                                    onBlur={e => e.target.style.borderColor = colors.border} />
                                </div>
                                {l.buy_now_price > 0 && <p style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Max: CHF {fmtPrice(l.buy_now_price - 1)} (ab Sofortkauf-Preis wird direkt gekauft)</p>}
                                {l.buy_now_price > 0 && parseFloat(bidAmount) >= l.buy_now_price - 2 && parseFloat(bidAmount) > 0 && (
                                  <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 0, background: colors.yellowSoft, border: `1px solid ${colors.yellow}`, fontSize: 12 }}>
                                    Dein Gebot ist nahe am Sofortkauf-Preis von <strong>CHF {fmtPrice(l.buy_now_price)}</strong>. 
                                    <button onClick={() => { setBidModal("buynow"); }} style={{ background: "none", border: "none", color: colors.yellow, fontWeight: 800, cursor: "pointer", fontSize: 12, textDecoration: "underline", marginLeft: 4, fontFamily: fonts.body }}>Jetzt sofort kaufen?</button>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Sofortkauf / Festpreis */}
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${colors.borderLt}`, fontSize: 14, marginBottom: 16 }}>
                                <span style={{ color: colors.muted }}>{l.listing_type === "auction" ? "Sofortkauf-Preis" : "Preis"}</span>
                                <span style={{ fontWeight: 700 }}>CHF {fmtPrice(l.listing_type === "auction" ? l.buy_now_price : l.price)}</span>
                              </div>
                            </>
                          )}

                          {/* Delivery Options */}
                          <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: colors.dark, display: "block", marginBottom: 8 }}>Lieferung</label>
                            {l.shipping_available && (
                              <div onClick={() => setBidShipping("shipping")} style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "10px 14px", borderRadius: 0, marginBottom: 6, cursor: "pointer",
                                border: `1.5px solid ${bidShipping === "shipping" ? colors.yellow : colors.border}`,
                                background: bidShipping === "shipping" ? colors.yellowSoft : "transparent",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${bidShipping === "shipping" ? colors.yellow : colors.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {bidShipping === "shipping" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors.yellow }} />}
                                  </div>
                                  <span style={{ fontSize: 13 }}>{l.shipping_method === "brief" ? "Brief" : l.shipping_method === "sperrgut" ? "Sperrgut" : "Paket"} {l.ship_speed === "priority" ? "A-Post" : "B-Post"}</span>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>CHF {fmtPrice(l.free_shipping ? 0 : l.shipping_cost || 9)}</span>
                              </div>
                            )}
                            {l.pickup_only && (
                              <div onClick={() => setBidShipping("pickup")} style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "10px 14px", borderRadius: 0, cursor: "pointer",
                                border: `1.5px solid ${bidShipping === "pickup" ? colors.yellow : colors.border}`,
                                background: bidShipping === "pickup" ? colors.yellowSoft : "transparent",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${bidShipping === "pickup" ? colors.yellow : colors.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {bidShipping === "pickup" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors.yellow }} />}
                                  </div>
                                  <span style={{ fontSize: 13 }}>Abholung in {l.postal_code} {l.city}</span>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>CHF 0.00</span>
                              </div>
                            )}
                          </div>

                          {/* Cost Breakdown */}
                          {(() => {
                            const itemPrice = bidModal === "buynow" ? (l.listing_type === "auction" ? l.buy_now_price : l.price) : parseFloat(bidAmount) || 0;
                            const shipCost = bidShipping === "pickup" ? 0 : (l.free_shipping ? 0 : parseFloat(l.shipping_cost) || 9);
                            const total = itemPrice + shipCost;
                            return (
                              <div style={{ padding: "14px 0", borderTop: `1px solid ${colors.border}`, marginBottom: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: colors.muted, marginBottom: 6 }}>
                                  <span>{bidModal === "buynow" ? (l.listing_type === "auction" ? "Sofortkauf" : "Artikelpreis") : "Max. Gebotsbetrag"}</span>
                                  <span>CHF {fmtPrice(itemPrice)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: colors.muted, marginBottom: 8 }}>
                                  <span>{bidShipping === "pickup" ? "Abholung" : l.shipping_method === "brief" ? "Brief" : "Paket"}</span>
                                  <span>{shipCost === 0 ? "Gratis" : `CHF ${fmtPrice(shipCost)}`}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: colors.dark, paddingTop: 8, borderTop: `1.5px solid ${colors.dark}` }}>
                                  <span>{bidModal === "bid" ? "Max. Total" : "Total"}</span>
                                  <span>CHF {fmtPrice(total)}</span>
                                </div>
                                {bidModal === "bid" && (
                                  <p style={{ fontSize: 11, color: colors.muted, marginTop: 6 }}>Du zahlst nur so viel wie nötig. Dein Maximum wird nur erreicht, wenn jemand mitbietet.</p>
                                )}
                              </div>
                            );
                          })()}

                          {/* AGB Text */}
                          <p style={{ fontSize: 11, color: colors.muted, lineHeight: 1.5, marginBottom: 16 }}>
                            {bidModal === "bid"
                              ? <>Wenn du auf «Bestätigen» klickst, akzeptierst du die <a href="/terms" style={{ color: colors.yellow }}>AGB von BEEDARO</a>. Das System bietet automatisch für dich bis zu deinem Maximum. Du verpflichtest dich, den Gesamtbetrag zu zahlen, wenn du die Auktion gewinnst.</>
                              : <>Wenn du auf «Bestätigen» klickst, akzeptierst du die <a href="/terms" style={{ color: colors.yellow }}>AGB von BEEDARO</a> und verpflichtest dich, den Gesamtbetrag zu zahlen.</>
                            }
                          </p>

                          {bidError && <p style={{ fontSize: 12, color: "#c00", marginBottom: 10 }}>{bidError}</p>}

                          {/* Buttons */}
                          <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setBidModal(null)} style={{ flex: 1, padding: "14px", borderRadius: 0, border: `1.5px solid ${colors.border}`, background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
                            <button onClick={async () => {
                              setBidding(true); setBidError("");
                              try {
                                if (bidModal === "buynow") {
                                  // For auctions: update listing price to buy_now_price first
                                  if (l.listing_type === "auction" && l.buy_now_price > 0) {
                                    await supabase.from("listings").update({ price: l.buy_now_price }).eq("id", l.id);
                                  }
                                  const purchaseId = await createPurchase(user.id, l.id);
                                  // Ensure purchase price matches buy_now_price (not auction bid)
                                  if (l.listing_type === "auction" && l.buy_now_price > 0 && purchaseId) {
                                    await supabase.from("purchases").update({ price: l.buy_now_price }).eq("id", purchaseId);
                                  }
                                  setBuyState("success");
                                  setBidModal(null);
                                  router.push(`/order/${purchaseId || l.id}`);
                                } else {
                                  const amount = parseFloat(bidAmount);
                                  const minBid = myBid ? myBid.amount + 1 : (bids[0]?.amount || l.start_price || 0) + 1;
                                  if (amount < minBid) { setBidError(`Minimum: CHF ${fmtPrice(minBid)}`); setBidding(false); return; }
                                  if (l.buy_now_price > 0 && amount >= l.buy_now_price) { setBidError(`Max: CHF ${fmtPrice(l.buy_now_price - 1)}. Nutze Sofortkauf.`); setBidding(false); return; }
                                  
                                  if (myBid && amount < myBid.max_amount) {
                                    // Preislimit SENKEN
                                    await adjustPreislimit(l.id, user.id, amount);
                                    const newMyBid = await getMyBid(l.id, user.id);
                                    setMyBid(newMyBid);
                                    setBidError(""); setBidModal(null);
                                  } else {
                                    // Neues Gebot oder Preislimit ERHÖHEN
                                    const result = await placeBid(l.id, user.id, amount);
                                    const newBids = await getBids(l.id);
                                    setBids(newBids);
                                    getBidHistory(l.id).then(setBidHistory).catch(() => {});
                                    const newMyBid = await getMyBid(l.id, user.id);
                                    setMyBid(newMyBid);
                                    setListing(prev => ({ ...prev, price: result.displayPrice || newBids[0]?.amount || prev.price }));
                                    if (result.isTopBidder) {
                                      setBidError(""); setBidModal(null);
                                    } else {
                                      setBidError(result.message || "Du wurdest automatisch überboten.");
                                    }
                                  }
                                  setBidAmount("");
                                }
                              } catch (err) { setBidError(err.message); }
                              finally { setBidding(false); }
                            }} disabled={bidding || (bidModal === "bid" && !bidAmount)}
                              style={{ flex: 1, padding: "14px", borderRadius: 0, border: "none", background: colors.teal, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body, opacity: bidding ? 0.6 : 1 }}>
                              {bidding ? "Wird verarbeitet..." : bidModal === "bid" ? "Gebot bestätigen" : "Kaufen"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

              {/* ── RENTAL UI (date range) ─────────────── */}
              {l.listing_type === "rent" && l.status === "active" && (
                <div>
                  <div style={{ marginBottom: 12, fontSize: 13, color: colors.muted }}>
                    <CalendarDays size={14} /> {l.rent_period === "hour" ? "pro Stunde" : l.rent_period === "day" ? "pro Tag" : l.rent_period === "week" ? "pro Woche" : "pro Monat"}
                    {l.deposit_amount > 0 && <span> · Kaution CHF {fmtPrice(l.deposit_amount)}</span>}
                  </div>
                  {!isOwner && (
                    <div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: colors.muted, display: "block", marginBottom: 4 }}>Von</label>
                          <input type="date" value={bookStart} onChange={(e) => setBookStart(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: radius.sm, border: `1.5px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: colors.muted, display: "block", marginBottom: 4 }}>Bis</label>
                          <input type="date" value={bookEnd} onChange={(e) => setBookEnd(e.target.value)}
                            min={bookStart || new Date().toISOString().split("T")[0]}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: radius.sm, border: `1.5px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body }} />
                        </div>
                      </div>
                      {bookStart && bookEnd && new Date(bookEnd) > new Date(bookStart) && (() => {
                        const days = Math.ceil((new Date(bookEnd) - new Date(bookStart)) / (1000 * 60 * 60 * 24));
                        const rentPrice = parseFloat(l.rent_price || l.price);
                        const total = days * rentPrice;
                        const fee = calcFee(total, l.fee_percentage || DEFAULT_FEE_PERCENT);
                        const impact = fee * BEE_IMPACT_RATE;
                        return (
                          <div style={{ marginBottom: 12, padding: "12px 14px", background: colors.cream, borderRadius: radius.sm, fontSize: 13 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span>{days} Tage × CHF {fmtPrice(rentPrice)}</span>
                              <span style={{ fontWeight: 700 }}>CHF {fmtPrice(total)}</span>
                            </div>
                            {parseFloat(l.deposit_amount) > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: colors.muted }}>
                                <span>Kaution (wird zurückerstattet)</span>
                                <span>CHF {fmtPrice(l.deposit_amount)}</span>
                              </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: `1px solid ${colors.borderLt}`, fontWeight: 700 }}>
                              <span>Total</span>
                              <span>CHF {fmtPrice(total + parseFloat(l.deposit_amount || 0))}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: colors.green }}>
                              <span>Bee-Impact</span>
                              <span style={{ fontWeight: 600 }}>CHF {impact.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })()}
                      <button onClick={async () => {
                        if (!user) { router.push("/login"); return; }
                        if (!bookStart || !bookEnd) return;
                        const check = await checkProfileComplete(user.id, "rent");
                        if (!check.complete) { setProfileWarning(check.missing); return; }
                        setProfileWarning(null);
                        setBookingError("");
                        try {
                          const days = Math.ceil((new Date(bookEnd) - new Date(bookStart)) / (1000 * 60 * 60 * 24));
                          if (l.min_rent_days && days < l.min_rent_days) {
                            setBookingError(`Mindestmietdauer: ${l.min_rent_days} Tage. Bitte einen längeren Zeitraum wählen.`);
                            return;
                          }
                          const total = days * parseFloat(l.rent_price || l.price);
                          await createBooking(l.id, user.id, l.user_id, bookStart, bookEnd, total, l.deposit_amount || 0);
                          setBookingSuccess(true);
                          setBookStart(""); setBookEnd("");
                        } catch (err) { console.error(err); setBookingError("Anfrage konnte nicht gesendet werden. Bitte erneut versuchen."); }
                      }}
                        disabled={!bookStart || !bookEnd || new Date(bookEnd) <= new Date(bookStart)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 0, border: "none", width: "100%", background: bookStart && bookEnd ? colors.yellow : colors.warm, color: colors.dark, fontSize: 15, fontWeight: 800, fontFamily: fonts.body, cursor: bookStart && bookEnd ? "pointer" : "default" }}>
                        <CalendarDays size={18} /> MIETE ANFRAGEN
                      </button>
                      {bookingError && (
                        <div style={{ marginTop: 10, padding: 12, borderRadius: radius.sm, background: colors.redSoft, textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.red }}>{bookingError}</p>
                        </div>
                      )}
                      {bookingSuccess && (
                        <div style={{ marginTop: 10, padding: 12, borderRadius: radius.sm, background: colors.greenSoft, textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.green }}>Anfrage gesendet!</p>
                          <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.muted }}>Der Vermieter wird benachrichtigt und kann bestätigen.</p>
                          <Link href="/bookings" style={{ fontSize: 12, color: colors.blue }}>Zu meinen Buchungen</Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── SERVICE UI (date + time) ──────────── */}
              {l.listing_type === "service" && l.status === "active" && (
                <div>
                  <div style={{ marginBottom: 12, fontSize: 13, color: colors.muted }}>
                    <CalendarDays size={14} /> {l.rent_period === "hour" ? "pro Stunde" : l.rent_period === "day" ? "pro Tag" : l.rent_period === "week" ? "pro Woche" : "pro Monat"}
                  </div>
                  {!isOwner ? (
                    <div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: colors.muted, display: "block", marginBottom: 4 }}>Wunschdatum</label>
                          <input type="date" value={bookStart} onChange={(e) => setBookStart(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: radius.sm, border: `1.5px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: colors.muted, display: "block", marginBottom: 4 }}>Uhrzeit</label>
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
                        setProfileWarning(null);
                        try {
                          const startWithTime = bookEnd ? `${bookStart}T${bookEnd}` : bookStart;
                          await createBooking(l.id, user.id, l.user_id, startWithTime, bookStart, parseFloat(l.rent_price || 0), 0);
                          setBookingSuccess(true);
                          setBookStart(""); setBookEnd("");
                        } catch (err) { console.error(err); toast.error("Anfrage konnte nicht gesendet werden. Bitte erneut versuchen."); }
                      }}
                        disabled={!bookStart}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 0, border: "none", width: "100%", background: bookStart ? colors.yellow : colors.warm, color: colors.dark, fontSize: 15, fontWeight: 800, fontFamily: fonts.body, cursor: bookStart ? "pointer" : "default" }}>
                        <CalendarDays size={18} /> SERVICE ANFRAGEN
                      </button>
                      {bookingSuccess && (
                        <div style={{ marginTop: 10, padding: 12, borderRadius: radius.sm, background: colors.greenSoft, textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.green }}>Anfrage gesendet!</p>
                          <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.muted }}>Der Anbieter wird benachrichtigt und bestätigt den Termin.</p>
                          <Link href="/bookings" style={{ fontSize: 12, color: colors.blue }}>Zu meinen Buchungen</Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: colors.muted, fontStyle: "italic" }}>Kunden können hier einen Termin anfragen.</p>
                  )}
                </div>
              )}

              {/* ── FREE ──────────────────────────────── */}
              {l.listing_type === "free" && l.status === "active" && (
                <div style={{ padding: "14px", borderRadius: radius.sm, background: colors.greenSoft, color: colors.green, fontSize: 14, fontWeight: 700, textAlign: "center" }}>Gratis. Kontaktiere den Verkäufer</div>
              )}

              {/* Success */}
              {buyState === "success" && (
                <div style={{ marginTop: 12, padding: 14, borderRadius: radius.sm, background: colors.greenSoft, textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.green }}>Kauf erfolgreich!</p>
                  <Link href="/purchases" style={{ fontSize: 13, color: colors.blue }}>Zu meinen Käufen</Link>
                </div>
              )}
              {buyState === "error" && (
                <div style={{ marginTop: 12, padding: 14, borderRadius: radius.sm, background: "#fff0f0", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#c00" }}>{buyError}</p>
                  <button onClick={() => setBuyState("idle")} style={{ marginTop: 6, fontSize: 12, color: colors.blue, background: "none", border: "none", cursor: "pointer" }}>Nochmal versuchen</button>
                </div>
              )}

              {/* Favorit */}
              <button onClick={handleFav} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px", borderRadius: 0, border: `1.5px solid ${isFav ? colors.yellow : colors.border}`,
                background: isFav ? colors.yellowSoft : colors.surface, color: isFav ? colors.dark : colors.muted,
                fontSize: 13, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer", width: "100%", marginTop: 10,
                letterSpacing: ".03em",
              }}>
                <Heart size={16} fill={isFav ? colors.yellow : "none"} color={isFav ? colors.yellow : colors.muted} />
                {isFav ? "IN FAVORITEN" : "ZU FAVORITEN HINZUFÜGEN"}
              </button>
            </div>

            {/* ── PROFIL-WARNUNG ──────────────────────── */}
            {profileWarning && (
              <div style={{ background: "#FFF3E0", border: "1.5px solid #F4A100", borderRadius: 0, padding: "16px 18px", marginBottom: 14 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#E65100" }}>Profil unvollständig:</p>
                {profileWarning.map((m, i) => <p key={i} style={{ margin: "0 0 3px", fontSize: 12, color: "#E65100" }}>• {m}</p>)}
                <a href="/settings" style={{ display: "inline-block", marginTop: 10, padding: "7px 16px", borderRadius: 0, background: "#F4A100", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Einstellungen öffnen</a>
              </div>
            )}

            {/* ── BEE-IMPACT BOX ─────────────────────── */}
            {l.status === "active" && beeImpact > 0 && (
              <div style={{ background: colors.greenSoft, borderRadius: 0, border: `1px solid ${INK}`, padding: "18px 22px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <BeeIcon size={20} color={colors.green} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.green }}>Bee-Impact</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: colors.dark, lineHeight: 1.5 }}>
                  Bei einem Kauf gehen <b style={{ color: colors.green }}>CHF {beeImpact.toFixed(2)}</b> an Schweizer Bienen- und Naturprojekte.
                </p>
              </div>
            )}

            {/* ── LIEFERUNG SIDEBAR ──────────────────── */}
            <div style={{ background: colors.surface, borderRadius: 0, border: `1px solid ${INK}`, padding: "16px 22px", marginBottom: 14, fontSize: 13 }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: colors.muted }}>Lieferung</p>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {l.shipping_method === "brief" ? "Brief" : l.shipping_method === "sperrgut" ? "Sperrgut" : "Paket"}{l.ship_speed === "priority" ? " A-Post" : l.ship_speed === "economy" ? " B-Post" : ""}{l.free_shipping ? ", Gratis" : l.shipping_cost ? `, CHF ${fmtPrice(l.shipping_cost)}` : ""}
              </p>
              {l.pickup_only && <p style={{ margin: "4px 0 0", color: colors.muted }}>Abholung in {l.city || "–"}</p>}
            </div>

            {/* ── SELLER MINI-CARD ───────────────────── */}
            <div style={{ background: colors.surface, borderRadius: 0, border: `1px solid ${INK}`, padding: "16px 22px", marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: colors.muted }}>Verkäufer</p>
              <Link href={`/user/${l.user_id}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  {l.sellerAvatar ? <img src={l.sellerAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={18} color={colors.yellow} />}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: colors.blue }}>
                  {l.seller?.account_type === "business" && l.seller?.company_name ? l.seller.company_name : l.sellerName}
                </span>
                <AccountBadge accountType={l.seller?.account_type} />
                <VerifiedSellerBadge profile={l.seller} size="sm" label={false} />
                {sellerRating.count > 0 && (
                  <span style={{ marginLeft: "auto", padding: "3px 8px", borderRadius: 0, background: colors.greenSoft, color: colors.green, fontSize: 12, fontWeight: 700 }}>
                    {sellerRating.avg.toFixed(1)}
                  </span>
                )}
              </Link>
            </div>

            {/* ── SHARE ──────────────────────────────── */}
            <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "8px 0", position: "relative" }}>
              <button
                onClick={async () => {
                  const url = typeof window !== "undefined" ? window.location.href : "";
                  if (navigator.share) {
                    try { await navigator.share({ title: l?.title || "BEEDARO", url }); return; } catch {}
                  }
                  setShowShare(s => !s);
                }}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: colors.blue, fontSize: 12, fontWeight: 700, letterSpacing: ".03em" }}
              >
                <Share2 size={14} /> TEILEN
              </button>
              {showShare && (() => {
                const url = typeof window !== "undefined" ? window.location.href : "";
                const txt = `${l?.title || "Schau dir das an"} – ${url}`;
                const item = (icon, label, onClick) => (
                  <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: fonts.body, color: colors.dark, textAlign: "left" }}>
                    {icon} {label}
                  </button>
                );
                return (
                  <>
                    <div onClick={() => setShowShare(false)} style={{ position: "fixed", inset: 0, zIndex: 200 }} />
                    <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", zIndex: 201, marginTop: 4, background: "#fff", borderRadius: 0, boxShadow: "0 8px 30px rgba(0,0,0,.14)", border: `1px solid ${colors.borderLt}`, minWidth: 200, overflow: "hidden", padding: "4px 0" }}>
                      {item(<MessageCircle size={16} color="#25D366" />, "WhatsApp", () => { window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank"); setShowShare(false); })}
                      {item(<Mail size={16} color={colors.muted} />, "E-Mail", () => { window.location.href = `mailto:?subject=${encodeURIComponent(l?.title || "BEEDARO")}&body=${encodeURIComponent(txt)}`; setShowShare(false); })}
                      {item(<Link2 size={16} color={colors.muted} />, shareCopied ? "Link kopiert!" : "Link kopieren", () => { navigator.clipboard.writeText(url); setShareCopied(true); setTimeout(() => setShareCopied(false), 1500); })}
                    </div>
                  </>
                );
              })()}
              <button onClick={() => setShowQr(true)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: colors.blue, fontSize: 12, fontWeight: 700, letterSpacing: ".03em" }}>
                <QrCode size={14} /> QR-CODE
              </button>
              {user && !isOwner && (
                <button onClick={() => setShowReportModal(true)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: colors.muted, fontSize: 12, fontWeight: 700, letterSpacing: ".03em" }}>
                  <Flag size={14} /> MELDEN
                </button>
              )}
            </div>

            {/* QR-Code Modal */}
            {showQr && (() => {
              const url = typeof window !== "undefined" ? window.location.href : "";
              const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(url)}`;
              return (
                <div onClick={() => setShowQr(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                  <div onClick={e => e.stopPropagation()} className="qr-print" style={{ background: "#fff", borderRadius: 0, padding: "24px 28px", maxWidth: 320, width: "100%", textAlign: "center", fontFamily: fonts.body }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: colors.dark }}>QR-Code</h3>
                    <p style={{ margin: "0 0 16px", fontSize: 12, color: colors.muted }}>Scannen führt direkt zu diesem Inserat.</p>
                    <img src={qrSrc} alt="QR-Code" width={240} height={240} style={{ display: "block", margin: "0 auto", borderRadius: 0 }} />
                    <p style={{ margin: "12px 0 0", fontSize: 13, fontWeight: 700, color: colors.dark, wordBreak: "break-word" }}>{l?.title}</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 16 }} className="no-print">
                      <button onClick={() => window.print()} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 0, border: "none", background: colors.teal, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" }}>
                        <Printer size={15} /> Drucken
                      </button>
                      <button onClick={() => setShowQr(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 0, border: `1.5px solid ${colors.border}`, background: "#fff", color: colors.dark, fontSize: 13, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" }}>
                        Schliessen
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Report Modal */}
            {showReportModal && (              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setShowReportModal(false)}>
                <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 0, padding: "24px 28px", maxWidth: 420, width: "90%", fontFamily: fonts.body }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Inserat melden</h3>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: colors.muted }}>Warum möchtest du dieses Inserat melden?</p>
                  <select value={reportReason} onChange={e => setReportReason(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 0, border: `1px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body, marginBottom: 10, outline: "none" }}>
                    <option value="">Grund wählen...</option>
                    <option value="counterfeit">Gefälschtes Inserat</option>
                    <option value="inappropriate">Unangemessener Inhalt</option>
                    <option value="fraud">Betrug / Scam</option>
                    <option value="spam">Spam / Duplikat</option>
                    <option value="other">Sonstiges</option>
                  </select>
                  <textarea value={reportText} onChange={e => setReportText(e.target.value)} placeholder="Details (optional)..."
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 0, border: `1px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body, minHeight: 80, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => setShowReportModal(false)}
                      style={{ flex: 1, padding: "10px", borderRadius: 0, border: `1px solid ${colors.border}`, background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
                    <button onClick={async () => {
                      if (!reportReason) return;
                      const { error: reportError } = await supabase.from("reports").insert({ reporter_id: user.id, listing_id: l.id, reason: reportReason, description: reportText || null, report_type: "listing" });
                      if (reportError) { alert(reportError.message || "Meldung konnte nicht gesendet werden. Bitte versuche es später erneut."); return; }
                      setShowReportModal(false); setReportReason(""); setReportText("");
                      alert("Danke für deine Meldung. Wir prüfen das Inserat.");
                    }} disabled={!reportReason}
                      style={{ flex: 1, padding: "10px", borderRadius: 0, border: "none", background: reportReason ? "#c62828" : "#ccc", color: "#fff", fontSize: 13, fontWeight: 700, cursor: reportReason ? "pointer" : "default", fontFamily: fonts.body }}>Melden</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── ÄHNLICHE ARTIKEL ─────────────────────────── */}
        {similar.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, fontFamily: fonts.head, margin: "0 0 18px", paddingBottom: 12, borderBottom: `1.5px solid ${INK}`, letterSpacing: "-0.01em", color: INK }}>Ähnliche Artikel</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {similar.map((item) => (
                <ListingCard key={item.id} listing={item} userId={user?.id} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Responsive-Reihenfolge lebt komplett in globals.css (.detail-grid) */}

      {/* ── MOBILE KAUF-LEISTE: fix ueber der Bottom-Nav, nur wenn die echte
             Kaufbox aus dem Bild gescrollt ist. Der Knopf springt zur Box,
             dort wohnt die ganze Kauf-/Gebots-Logik (eine Quelle). ── */}
      {/* Besitzer: fixe Leiste unten (nur mobil, .mobile-cta-bar ist
          Desktop-hidden) — ersetzt dort die gelbe Leiste oben */}
      {isOwner && (
        <div className="mobile-cta-bar">
          <span style={{ fontSize: 13, fontWeight: 700, color: INK, display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <BeeIcon size={15} /> Dein Inserat
          </span>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Link href={`/listings/${l.id}`} style={{ padding: "9px 16px", background: colors.yellow, border: `1.5px solid ${INK}`, color: INK, fontSize: 12.5, fontWeight: 800, textDecoration: "none", boxShadow: `2px 2px 0 ${INK}` }}>
              Bearbeiten
            </Link>
            <Link href="/listings" style={{ padding: "9px 16px", background: "#fff", border: `1px solid ${INK}`, color: INK, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
              Meine Inserate
            </Link>
          </div>
        </div>
      )}

      {!isOwner && l.status === "active" && !buyBoxSichtbar && (
        <div className="mobile-cta-bar">
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: colors.muted }}>
              {l.listing_type === "auction" ? (bids.length > 0 ? "Aktuelles Gebot" : "Startpreis") : l.listing_type === "rent" ? "Mietpreis" : "Preis"}
            </p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: fonts.head, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {l.listing_type === "free" ? "Gratis" : (l.listing_type === "rent" || l.listing_type === "service") ? `CHF ${fmtPrice(displayPrice)} / ${l.rent_period === "hour" ? "Std" : l.rent_period === "day" ? "Tag" : l.rent_period === "week" ? "Wo" : "Mt"}` : `CHF ${fmtPrice(displayPrice)}`}
            </p>
          </div>
          <button onClick={() => buyBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            style={{ flexShrink: 0, padding: "12px 22px", borderRadius: 0, border: `1.5px solid ${INK}`, background: colors.yellow, color: INK, fontSize: 14, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer", boxShadow: `3px 3px 0 ${INK}` }}>
            {l.listing_type === "auction" ? "Jetzt bieten" : l.listing_type === "sell" ? "Jetzt kaufen" : "Anfragen"}
          </button>
        </div>
      )}

      {/* ── LIGHTBOX ────────────────────────────────── */}
      {lightbox && imgs.length > 0 && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.92)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => { if (swiped.current) { swiped.current = false; return; } setLightbox(false); }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current == null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(dx) > 40 && imgs.length > 1) {
              swiped.current = true;
              setActiveImg(i => dx < 0 ? (i < imgs.length - 1 ? i + 1 : 0) : (i > 0 ? i - 1 : imgs.length - 1));
            }
          }}>
          {/* Close */}
          <button onClick={() => setLightbox(false)} style={{ position: "absolute", top: 20, right: 20, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001 }}>
            <X size={24} color="#fff" />
          </button>
          {/* Counter */}
          <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 600, fontFamily: "'Manrope', sans-serif" }}>
            {activeImg + 1} / {imgs.length}
          </div>
          {/* Main Image */}
          <img src={imgs[activeImg]?.url} alt={l.title} onClick={e => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 0, cursor: "default" }} />
          {/* Arrows */}
          {imgs.length > 1 && <>
            <button onClick={(e) => { e.stopPropagation(); setActiveImg(i => i > 0 ? i - 1 : imgs.length - 1); }}
              style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={28} color="#fff" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setActiveImg(i => i < imgs.length - 1 ? i + 1 : 0); }}
              style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={28} color="#fff" />
            </button>
          </>}
          {/* Thumbnails */}
          {imgs.length > 1 && (
            <div style={{ position: "absolute", bottom: 20, display: "flex", gap: 8, padding: "8px 12px", background: "rgba(0,0,0,0.5)", borderRadius: 0 }} onClick={e => e.stopPropagation()}>
              {imgs.map((img, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{ width: 52, height: 52, borderRadius: 0, overflow: "hidden", border: i === activeImg ? "2px solid #F4C03F" : "2px solid transparent", cursor: "pointer", opacity: i === activeImg ? 1 : 0.5, transition: "opacity .15s" }}>
                  <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
