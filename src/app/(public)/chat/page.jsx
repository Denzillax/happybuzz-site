"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { getMyConversations } from "@/lib/listings";
import Link from "next/link";
import { MessageCircle, User, Package } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
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

  // Nur private Unterhaltungen (öffentliche Q&A laufen über das Inserat).
  let convs = conversations.filter((c) => !c.is_public);
  if (sortBy === "newest") convs = [...convs].sort((a, b) => +new Date(b.last_message_at) - +new Date(a.last_message_at));
  if (sortBy === "oldest") convs = [...convs].sort((a, b) => +new Date(a.last_message_at) - +new Date(b.last_message_at));
  if (sortBy === "unread") convs = [...convs].sort((a, b) => (b.hasUnread ? 1 : 0) - (a.hasUnread ? 1 : 0));

  const totalUnread = convs.filter((c) => c.hasUnread).length;

  const fmtTime = (d) => {
    if (!d) return "";
    const date = new Date(d); const now = new Date();
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
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 4px", fontFamily: fonts.head }}>Nachrichten</h1>
            {totalUnread > 0 && <p style={{ margin: 0, fontSize: 13, color: colors.teal, fontWeight: 700 }}>{totalUnread} ungelesen</p>}
          </div>
          <div style={{ display: "flex", background: colors.surface, borderRadius: 8, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            {[{ key: "newest", label: "Neueste" }, { key: "oldest", label: "Älteste" }, { key: "unread", label: "Ungelesen" }].map((s) => (
              <button key={s.key} onClick={() => setSortBy(s.key)} style={{
                padding: "6px 12px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                fontFamily: fonts.body, background: sortBy === s.key ? colors.yellow : "transparent", color: colors.dark,
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {loading && <div style={{ textAlign: "center", padding: 60, color: colors.mutedLt }}>Lade...</div>}
        {!loading && convs.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <MessageCircle size={40} color={colors.mutedLt} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Keine Nachrichten</p>
            <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Schreib einem Verkäufer über ein Inserat.</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {convs.map((c) => (
            <Link key={c.id} href={`/chat/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                background: c.hasUnread ? `${colors.yellow}0C` : colors.surface,
                borderRadius: radius.lg, border: `1px solid ${c.hasUnread ? `${colors.yellow}55` : colors.border}`,
                transition: "background .1s",
              }}>
                {/* Avatar */}
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: colors.yellowSoft, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {c.otherUser?.avatar_url ? <img src={c.otherUser.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={20} color={colors.yellow} />}
                </div>
                {/* Mitte */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: c.hasUnread ? 800 : 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.otherUser?.display_name || "Benutzer"}</p>
                  </div>
                  <p style={{ margin: "1px 0 0", fontSize: 11, color: colors.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.listing?.title || "Gelöschtes Inserat"}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 13, color: c.hasUnread ? colors.dark : colors.muted, fontWeight: c.hasUnread ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.lastMessagePreview || "Bild gesendet"}</p>
                </div>
                {/* Listing-Thumb */}
                <div style={{ width: 46, height: 46, borderRadius: 8, background: colors.warm, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {c.listing?.listing_images?.[0]?.url ? <img src={c.listing.listing_images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={18} color={colors.mutedLt} />}
                </div>
                {/* Zeit + Unread */}
                <div style={{ textAlign: "right", flexShrink: 0, minWidth: 44 }}>
                  <span style={{ fontSize: 11, color: colors.muted }}>{fmtTime(c.last_message_at)}</span>
                  {c.hasUnread && <span style={{ display: "block", width: 9, height: 9, borderRadius: "50%", background: colors.yellow, marginLeft: "auto", marginTop: 5 }} />}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
