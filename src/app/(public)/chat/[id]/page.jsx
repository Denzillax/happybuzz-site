"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Send, ArrowLeft, User, Package, Loader2, Plus, X, ImagePlus } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { getMessages, sendMessage, markMessagesRead, uploadChatImage, createPurchaseAtPrice } from "@/lib/listings";

const QUICK_REPLIES = [
  "Ist noch verfügbar",
  "Preis ist verhandelbar",
  "Kann morgen abgeholt werden",
  "Reserviert für dich bis morgen",
  "Leider schon verkauft",
];
const QR_KEY = "beedaro_quick_replies";

function dayLabel(d) {
  const date = new Date(d); const now = new Date();
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(date, now)) return "Heute";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (sameDay(date, y)) return "Gestern";
  return date.toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" });
}

export default function ChatConversation() {
  const params = useParams();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [user, setUser] = useState(null);
  const [conv, setConv] = useState(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customReplies, setCustomReplies] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    try { const a = JSON.parse(localStorage.getItem(QR_KEY) || "[]"); if (Array.isArray(a)) setCustomReplies(a); } catch {}
  }, []);

  const saveCustom = (arr) => { setCustomReplies(arr); try { localStorage.setItem(QR_KEY, JSON.stringify(arr)); } catch {} };
  const addCustom = () => { const t = (window.prompt("Eigene Schnell-Antwort:") || "").trim(); if (t) saveCustom([...customReplies, t].slice(0, 10)); };
  const removeCustom = (t) => saveCustom(customReplies.filter((x) => x !== t));

  useEffect(() => {
    async function load() {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!u) { window.location.href = "/login"; return; }
        setUser(u);
        const { data: c } = await supabase
          .from("conversations")
          .select("*, listing:listings(id, title, price, listing_type, listing_images(*)), buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url), seller:profiles!conversations_seller_id_fkey(id, display_name, avatar_url)")
          .eq("id", params.id)
          .maybeSingle();
        setConv(c);
        const msgs = await getMessages(params.id);
        setMessages(msgs);
        await markMessagesRead(params.id, u.id);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [params.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${params.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${params.id}` },
        (payload) => {
          setMessages((prev) => prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]);
          if (user && payload.new.sender_id !== user.id) markMessagesRead(params.id, user.id);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [params.id, user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Gesendete Nachricht sofort anzeigen (Realtime dedupliziert per id).
  const appendMsg = (m) => { if (m) setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]); };

  const sendText = async (text) => {
    const t = (text ?? newMsg).trim();
    if (!t || sending) return;
    setSending(true);
    try { const m = await sendMessage(params.id, user.id, t); appendMsg(m); if (text === undefined) setNewMsg(""); }
    catch (err) { console.error(err); }
    finally { setSending(false); }
  };
  const handleSend = () => sendText();

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file || !file.type.startsWith("image/") || uploading) return;
    setUploading(true);
    try {
      const url = await uploadChatImage(params.id, file);
      const m = await sendMessage(params.id, user.id, "", { imageUrl: url });
      appendMsg(m);
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  // ── Preisvorschlag-Aktionen ──
  const acceptOffer = async (amount) => {
    if (sending || !conv?.listing?.id) return;
    setSending(true);
    try {
      await createPurchaseAtPrice(conv.buyer_id, conv.listing.id, amount);
      appendMsg(await sendMessage(params.id, user.id, `Preisvorschlag über CHF ${Number(amount).toLocaleString("de-CH")} angenommen. Bestellung wurde erstellt.`, { messageType: "system" }));
    } catch (e) { console.error(e); await sendMessage(params.id, user.id, "Vorschlag konnte nicht angenommen werden (Inserat evtl. nicht mehr verfügbar).", { messageType: "system" }).then(appendMsg).catch(() => {}); }
    finally { setSending(false); }
  };
  const rejectOffer = async (amount) => {
    if (sending) return; setSending(true);
    try { appendMsg(await sendMessage(params.id, user.id, `Preisvorschlag über CHF ${Number(amount).toLocaleString("de-CH")} abgelehnt.`, { messageType: "system" })); }
    catch (e) { console.error(e); } finally { setSending(false); }
  };
  const counterOffer = async () => {
    const raw = (window.prompt("Dein Gegenvorschlag (CHF):") || "").replace(",", ".");
    const v = parseFloat(raw);
    if (!v || v <= 0 || sending) return;
    setSending(true);
    try { appendMsg(await sendMessage(params.id, user.id, `Preisvorschlag: CHF ${v.toLocaleString("de-CH")}`, { messageType: "offer", offerAmount: v })); }
    catch (e) { console.error(e); } finally { setSending(false); }
  };

  if (loading) return <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 size={24} color={colors.muted} style={{ animation: "spin 1s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  const otherUser = conv ? (conv.buyer_id === user?.id ? conv.seller : conv.buyer) : null;
  const isBuyer = conv?.buyer_id === user?.id;
  const offerMsgs = messages.filter((m) => m.message_type === "offer");
  const lastOffer = offerMsgs[offerMsgs.length - 1] || null;
  const offerResolved = lastOffer && messages.some((m) => m.message_type === "system" && new Date(m.created_at) >= new Date(lastOffer.created_at));
  const canCounter = offerMsgs.length < 3;

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", display: "flex", flexDirection: "column", color: colors.dark }}>

      {/* Eine kompakte Leiste: Was (Inserat) + Wer (Gegenüber) */}
      <div style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/chat" style={{ color: colors.muted, display: "flex", flexShrink: 0 }}><ArrowLeft size={20} /></Link>

        {/* Inserat (Anker) */}
        <Link href={conv?.listing ? `/listing/${conv.listing.id}` : "#"} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {conv?.listing?.listing_images?.[0]?.url ? <img src={conv.listing.listing_images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={17} color={colors.mutedLt} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{conv?.listing?.title || "Gelöschtes Inserat"}</p>
            <p style={{ margin: "1px 0 0", fontSize: 12, color: colors.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {conv?.listing?.price != null && <span style={{ color: colors.teal, fontWeight: 700 }}>CHF {Number(conv.listing.price).toLocaleString("de-CH")} · </span>}
              {isBuyer ? "Du kaufst" : "Du verkaufst"}
            </p>
          </div>
        </Link>

        {/* Gegenüber (Profil) */}
        <Link href={otherUser?.id ? `/user/${otherUser.id}` : "#"} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit", flexShrink: 0 }}>
          <div style={{ textAlign: "right", maxWidth: 110 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{otherUser?.display_name || "Benutzer"}</p>
            <p style={{ margin: 0, fontSize: 11, color: colors.muted }}>Profil ansehen</p>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {otherUser?.avatar_url ? <img src={otherUser.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={18} color={colors.yellow} />}
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", maxWidth: 800, margin: "0 auto", width: "100%" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: colors.muted, fontSize: 13 }}>Schreibe die erste Nachricht.</div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;
          const prev = messages[i - 1];
          const showDay = !prev || new Date(prev.created_at).toDateString() !== new Date(msg.created_at).toDateString();
          const isImage = msg.message_type === "image" || (!!msg.image_url && !msg.content);
          const isOffer = msg.message_type === "offer";
          const isSystem = msg.message_type === "system";
          const dayChip = showDay && (
            <div style={{ textAlign: "center", margin: "12px 0" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: colors.muted, background: colors.surface, border: `1px solid ${colors.borderLt}`, padding: "3px 12px", borderRadius: 12 }}>{dayLabel(msg.created_at)}</span>
            </div>
          );
          if (isSystem) {
            return (
              <div key={msg.id || i}>
                {dayChip}
                <div style={{ textAlign: "center", margin: "8px 0" }}>
                  <span style={{ fontSize: 12, color: colors.muted, background: colors.surface, border: `1px solid ${colors.borderLt}`, padding: "6px 14px", borderRadius: 12 }}>{msg.content}</span>
                </div>
              </div>
            );
          }
          if (isOffer) {
            const amount = Number(msg.offer_amount || 0);
            const showActions = lastOffer && msg.id === lastOffer.id && !offerResolved && !isMe;
            return (
              <div key={msg.id || i}>
                {dayChip}
                <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 8 }}>
                  <div style={{ maxWidth: "80%", padding: "12px 16px", borderRadius: 16, background: "#FFF9E6", border: `1.5px solid ${colors.yellow}`, borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: colors.yellowDark }}>Preisvorschlag</p>
                    <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: colors.dark, fontFamily: fonts.head }}>CHF {amount.toLocaleString("de-CH")}</p>
                    {showActions && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        <button onClick={() => acceptOffer(amount)} disabled={sending} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: colors.teal, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" }}>Annehmen</button>
                        {canCounter && <button onClick={counterOffer} disabled={sending} style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${colors.border}`, background: "#fff", color: colors.dark, fontSize: 12, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" }}>Gegenvorschlag</button>}
                        <button onClick={() => rejectOffer(amount)} disabled={sending} style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${colors.border}`, background: "#fff", color: colors.red, fontSize: 12, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" }}>Ablehnen</button>
                      </div>
                    )}
                    <p style={{ margin: "8px 0 0", fontSize: 10, color: colors.mutedLt, textAlign: "right" }}>{new Date(msg.created_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div key={msg.id || i}>
              {dayChip}
              <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 8 }}>
                <div style={{
                  maxWidth: "72%", padding: isImage ? 4 : "10px 14px", borderRadius: 16,
                  background: isImage ? "transparent" : (isMe ? colors.teal : colors.surface),
                  border: isImage ? "none" : (isMe ? "none" : `1px solid ${colors.border}`),
                  borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4,
                }}>
                  {isImage ? (
                    <img src={msg.image_url} alt="Bild" onClick={() => setLightbox(msg.image_url)}
                      style={{ maxWidth: 220, maxHeight: 260, borderRadius: 12, cursor: "pointer", display: "block" }} />
                  ) : (
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: isMe ? "#fff" : colors.dark, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                  )}
                  {!isImage && (
                    <p style={{ margin: "4px 0 0", fontSize: 10, color: isMe ? "rgba(255,255,255,.7)" : colors.mutedLt, textAlign: "right" }}>
                      {new Date(msg.created_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: colors.surface, borderTop: `1px solid ${colors.border}`, padding: "12px 20px", position: "sticky", bottom: 0 }}>
        {/* Schnell-Antworten */}
        <div style={{ maxWidth: 800, margin: "0 auto 10px", display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {QUICK_REPLIES.map((q) => (
            <button key={q} onClick={() => sendText(q)} disabled={sending}
              style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 16, border: `1.5px solid ${colors.border}`, background: colors.cream, color: colors.dark, fontSize: 12, fontFamily: fonts.body, cursor: "pointer", whiteSpace: "nowrap" }}>
              {q}
            </button>
          ))}
          {customReplies.map((q) => (
            <span key={q} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 8px 6px 12px", borderRadius: 16, border: `1.5px solid ${colors.teal}`, background: "#E6F5F5", color: colors.tealDark, fontSize: 12, fontFamily: fonts.body, whiteSpace: "nowrap" }}>
              <button onClick={() => sendText(q)} disabled={sending} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 12, fontFamily: fonts.body, padding: 0 }}>{q}</button>
              <X size={12} style={{ cursor: "pointer", opacity: 0.6 }} onClick={() => removeCustom(q)} />
            </span>
          ))}
          <button onClick={addCustom} title="Eigene Schnell-Antwort"
            style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3, padding: "6px 10px", borderRadius: 16, border: `1.5px dashed ${colors.border}`, background: "#fff", color: colors.muted, fontSize: 12, fontFamily: fonts.body, cursor: "pointer", whiteSpace: "nowrap" }}>
            <Plus size={12} /> Eigene
          </button>
        </div>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", gap: 10, alignItems: "center" }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} title="Bild senden"
            style={{ width: 44, height: 44, borderRadius: "50%", border: `1.5px solid ${colors.border}`, background: colors.cream, cursor: uploading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {uploading ? <Loader2 size={18} color={colors.muted} style={{ animation: "spin 1s linear infinite" }} /> : <ImagePlus size={18} color={colors.muted} />}
          </button>
          <input
            type="text" value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nachricht schreiben..."
            style={{ flex: 1, padding: "12px 16px", borderRadius: 24, border: `1.5px solid ${colors.border}`, outline: "none", fontSize: 14, fontFamily: fonts.body, background: colors.cream }}
          />
          <button onClick={handleSend} disabled={!newMsg.trim() || sending}
            style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: newMsg.trim() ? colors.yellow : colors.warm, cursor: newMsg.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", flexShrink: 0 }}>
            <Send size={18} color={newMsg.trim() ? colors.dark : colors.mutedLt} />
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <img src={lightbox} alt="Bild" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }} />
          <button onClick={() => setLightbox(null)} style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} /></button>
        </div>
      )}
    </div>
  );
}
