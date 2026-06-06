"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Send, ArrowLeft, User, Package, Loader2 } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { getMessages, sendMessage, markMessagesRead } from "@/lib/listings";

export default function ChatConversation() {
  const params = useParams();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [user, setUser] = useState(null);
  const [conv, setConv] = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!u) { window.location.href = "/login"; return; }
        setUser(u);

        // Conversation laden
        const { data: c } = await supabase
          .from("conversations")
          .select("*, listing:listings(id, title, listing_images(*)), buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url), seller:profiles!conversations_seller_id_fkey(id, display_name, avatar_url)")
          .eq("id", params.id)
          .single();
        setConv(c);

        // Messages laden
        const msgs = await getMessages(params.id);
        setMessages(msgs);
        await markMessagesRead(params.id, u.id);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [params.id]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${params.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${params.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          if (user && payload.new.sender_id !== user.id) {
            markMessagesRead(params.id, user.id);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [params.id, user]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(params.id, user.id, newMsg.trim());
      setNewMsg("");
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  if (loading) return <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 size={24} color={colors.muted} style={{ animation: "spin 1s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  const otherUser = conv ? (conv.buyer_id === user?.id ? conv.seller : conv.buyer) : null;

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", display: "flex", flexDirection: "column", color: colors.dark }}>

      {/* Header */}
      <div style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/chat" style={{ color: colors.muted, display: "flex" }}><ArrowLeft size={20} /></Link>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {otherUser?.avatar_url ? <img src={otherUser.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={20} color={colors.yellow} />}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{otherUser?.display_name || "Benutzer"}</p>
          {conv?.listing && <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>{conv.listing.title}</p>}
        </div>
        {conv?.listing && (
          <Link href={`/listing/${conv.listing.id}`} style={{ width: 40, height: 40, borderRadius: 6, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {conv.listing.listing_images?.[0]?.url ? <img src={conv.listing.listing_images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={16} color={colors.mutedLt} />}
          </Link>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", maxWidth: 800, margin: "0 auto", width: "100%" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: colors.muted, fontSize: 13 }}>Schreibe die erste Nachricht.</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <div style={{
                maxWidth: "70%", padding: "10px 14px", borderRadius: 16,
                background: isMe ? colors.yellow : colors.surface,
                border: isMe ? "none" : `1px solid ${colors.border}`,
                borderBottomRightRadius: isMe ? 4 : 16,
                borderBottomLeftRadius: isMe ? 16 : 4,
              }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: colors.dark }}>{msg.content}</p>
                <p style={{ margin: "4px 0 0", fontSize: 10, color: isMe ? "rgba(0,0,0,.4)" : colors.mutedLt, textAlign: "right" }}>
                  {new Date(msg.created_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: colors.surface, borderTop: `1px solid ${colors.border}`, padding: "12px 20px", position: "sticky", bottom: 0 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="text" value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nachricht schreiben..."
            style={{ flex: 1, padding: "12px 16px", borderRadius: 24, border: `1.5px solid ${colors.border}`, outline: "none", fontSize: 14, fontFamily: fonts.body, background: colors.cream }}
          />
          <button onClick={handleSend} disabled={!newMsg.trim() || sending}
            style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: newMsg.trim() ? colors.yellow : colors.warm, cursor: newMsg.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
            <Send size={18} color={newMsg.trim() ? colors.dark : colors.mutedLt} />
          </button>
        </div>
      </div>
    </div>
  );
}
