"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { getMyConversations, getMessages, markMessagesRead, replyToQuestion, getOrCreateConversation, sendMessage } from "@/lib/listings";
import Link from "next/link";
import { MessageCircle, User, Package, ChevronDown, ChevronUp, Send } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [openListing, setOpenListing] = useState(null);
  const [msgMode, setMsgMode] = useState({}); // listingId → true=public, false=private
  const [allMessages, setAllMessages] = useState({}); // listingId → { public: [...], private: [...] }
  const [replyText, setReplyText] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "/login"; return; }
        setUserId(user.id);
        setConversations(await getMyConversations(user.id));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  // Gruppiere nach Listing
  const grouped = {};
  conversations.forEach(c => {
    const key = c.listing?.id || "other";
    if (!grouped[key]) grouped[key] = { listing: c.listing, convs: [], hasUnread: false };
    grouped[key].convs.push(c);
    if (c.hasUnread) grouped[key].hasUnread = true;
  });
  let groups = Object.values(grouped);
  if (sortBy === "newest") groups.sort((a, b) => Math.max(...b.convs.map(c => +new Date(c.last_message_at))) - Math.max(...a.convs.map(c => +new Date(c.last_message_at))));
  if (sortBy === "oldest") groups.sort((a, b) => Math.min(...a.convs.map(c => +new Date(c.last_message_at))) - Math.min(...b.convs.map(c => +new Date(c.last_message_at))));
  if (sortBy === "unread") groups.sort((a, b) => (b.hasUnread ? 1 : 0) - (a.hasUnread ? 1 : 0));

  const totalUnread = conversations.filter(c => c.hasUnread).length;

  const toggleListing = async (listingId) => {
    if (openListing === listingId) { setOpenListing(null); return; }
    setOpenListing(listingId);
    if (!msgMode[listingId]) setMsgMode(prev => ({ ...prev, [listingId]: true }));
    // Lade alle Messages für dieses Listing
    await loadListingMessages(listingId);
  };

  const loadListingMessages = async (listingId) => {
    const group = grouped[listingId];
    if (!group) return;
    const pub = [], priv = [];
    for (const c of group.convs) {
      const msgs = await getMessages(c.id);
      if (c.is_public) pub.push(...msgs); else priv.push(...msgs);
      if (userId) await markMessagesRead(c.id, userId);
    }
    pub.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    priv.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    setAllMessages(prev => ({ ...prev, [listingId]: { public: pub, private: priv } }));
    setConversations(prev => prev.map(c => (c.listing?.id === listingId) ? { ...c, hasUnread: false } : c));
  };

  const handleReply = async (listingId) => {
    if (!replyText.trim()) return;
    const group = grouped[listingId];
    const isPublic = msgMode[listingId] !== false;
    const convs = group.convs.filter(c => c.is_public === isPublic);

    if (convs.length > 0) {
      await replyToQuestion(convs[0].id, userId, replyText.trim());
    } else {
      // Neue Conversation erstellen
      const sellerId = group.listing?.user_id || group.convs[0]?.seller_id;
      const { data: newConv } = await supabase.from("conversations")
        .insert({ listing_id: listingId, buyer_id: userId, seller_id: sellerId, is_public: isPublic })
        .select().single();
      if (newConv) await sendMessage(newConv.id, userId, replyText.trim());
    }
    setReplyText("");
    await loadListingMessages(listingId);
    // Conversations neu laden
    setConversations(await getMyConversations(userId));
  };

  const fmtTime = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diff = (now - date) / 60000;
    if (diff < 60) return `${Math.max(1, Math.floor(diff))} Min.`;
    if (diff < 1440) return `${Math.floor(diff / 60)} Std.`;
    if (diff < 2880) return "Gestern";
    return date.toLocaleDateString("de-CH", { day: "numeric", month: "short" });
  };

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 4px", fontFamily: fonts.head }}>NACHRICHTEN</h1>
            {totalUnread > 0 && <p style={{ margin: 0, fontSize: 13, color: colors.yellow, fontWeight: 700 }}>{totalUnread} ungelesen</p>}
          </div>
          <div style={{ display: "flex", background: colors.surface, borderRadius: 8, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            {[{ key: "newest", label: "Neueste" }, { key: "oldest", label: "Älteste" }, { key: "unread", label: "Ungelesen" }].map(s => (
              <button key={s.key} onClick={() => setSortBy(s.key)} style={{
                padding: "6px 12px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                fontFamily: fonts.body, background: sortBy === s.key ? colors.yellow : "transparent", color: colors.dark,
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {loading && <div style={{ textAlign: "center", padding: 60, color: colors.mutedLt }}>Lade...</div>}
        {!loading && groups.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <MessageCircle size={40} color={colors.mutedLt} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Keine Nachrichten</p>
          </div>
        )}

        {groups.map((g) => {
          const lid = g.listing?.id || "misc";
          const isOpen = openListing === lid;
          const isPublic = msgMode[lid] !== false;
          const msgs = allMessages[lid] || { public: [], private: [] };
          const currentMsgs = isPublic ? msgs.public : msgs.private;
          const newestMsg = g.convs.reduce((a, b) => new Date(a.last_message_at) > new Date(b.last_message_at) ? a : b);

          return (
            <div key={lid} style={{ marginBottom: 10, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>

              {/* Inserat-Header — klickbar */}
              <div onClick={() => toggleListing(lid)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer",
                background: g.hasUnread ? `${colors.yellow}08` : "transparent", transition: "background .1s",
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {g.listing?.listing_images?.[0]?.url ? <img src={g.listing.listing_images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={20} color={colors.mutedLt} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: g.hasUnread ? 800 : 700 }}>{g.listing?.title || "Inserat"}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.muted }}>{newestMsg.lastMessagePreview || "Nachricht"}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: colors.muted }}>{fmtTime(newestMsg.last_message_at)}</span>
                  {g.hasUnread && <span style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: colors.yellow, marginLeft: "auto", marginTop: 4 }} />}
                </div>
                {isOpen ? <ChevronUp size={16} color={colors.muted} /> : <ChevronDown size={16} color={colors.muted} />}
              </div>

              {/* Aufgeklappter Chat */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${colors.borderLt}` }}>
                  {/* Öffentlich/Privat Toggle */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", background: colors.warm }}>
                    <div style={{ display: "flex", background: colors.surface, borderRadius: 6, overflow: "hidden", border: `1px solid ${colors.borderLt}` }}>
                      <button onClick={() => setMsgMode(prev => ({ ...prev, [lid]: true }))} style={{
                        padding: "5px 14px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                        fontFamily: fonts.body, background: isPublic ? colors.yellow : "transparent", color: colors.dark,
                      }}>Öffentlich ({msgs.public.length})</button>
                      <button onClick={() => setMsgMode(prev => ({ ...prev, [lid]: false }))} style={{
                        padding: "5px 14px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                        fontFamily: fonts.body, background: !isPublic ? colors.yellow : "transparent", color: colors.dark,
                      }}>Privat ({msgs.private.length})</button>
                    </div>
                    <Link href={`/listing/${lid}`} style={{ fontSize: 11, color: colors.blue, textDecoration: "none", fontWeight: 600 }}>Zum Inserat</Link>
                  </div>

                  {/* Chat-Bereich */}
                  <div style={{ height: 280, overflowY: "auto", padding: "12px 16px", background: colors.cream }}>
                    {currentMsgs.length > 0 ? currentMsgs.map(msg => {
                      const isMe = msg.sender_id === userId;
                      return (
                        <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 6 }}>
                          <div style={{
                            maxWidth: "75%", padding: "7px 12px", borderRadius: 14,
                            background: isMe ? colors.yellow : colors.surface,
                            border: isMe ? "none" : `1px solid ${colors.borderLt}`,
                            borderBottomRightRadius: isMe ? 4 : 14, borderBottomLeftRadius: isMe ? 14 : 4,
                          }}>
                            {!isMe && <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 700, color: colors.blue }}>{msg.sender?.display_name}</p>}
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>{msg.content}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 9, color: isMe ? "rgba(0,0,0,.3)" : colors.mutedLt, textAlign: "right" }}>
                              {new Date(msg.created_at).toLocaleString("de-CH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    }) : (
                      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p style={{ fontSize: 12, color: colors.mutedLt }}>{isPublic ? "Keine öffentlichen Nachrichten." : "Keine privaten Nachrichten."}</p>
                      </div>
                    )}
                  </div>

                  {/* Antwort-Bar */}
                  <div style={{ display: "flex", gap: 8, padding: "10px 16px", background: colors.surface, borderTop: `1px solid ${colors.borderLt}`, alignItems: "center" }}>
                    <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleReply(lid)}
                      placeholder={isPublic ? "Öffentliche Antwort..." : "Private Antwort..."}
                      style={{ flex: 1, padding: "9px 14px", borderRadius: 20, border: `1px solid ${colors.borderLt}`, fontSize: 13, fontFamily: fonts.body, outline: "none", background: colors.cream }} />
                    <button onClick={() => handleReply(lid)} disabled={!replyText.trim()}
                      style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: replyText.trim() ? colors.yellow : colors.warm, cursor: replyText.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Send size={14} color={replyText.trim() ? colors.dark : colors.mutedLt} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
