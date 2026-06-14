"use client";
import { supabase } from "@/lib/supabase/supabase";
import { useState, useEffect } from "react";
import { getMyConversations } from "@/lib/listings";
import Link from "next/link";
import { MessageCircle, User, Package, ShoppingBag, Tag } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [filter, setFilter] = useState("all"); // all | unread

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
  // Immer neueste zuerst; Filter nur Alle/Ungelesen.
  let convs = conversations
    .filter((c) => !c.is_public)
    .sort((a, b) => +new Date(b.last_message_at) - +new Date(a.last_message_at));
  if (filter === "unread") convs = convs.filter((c) => c.hasUnread);

  const totalUnread = conversations.filter((c) => !c.is_public && c.hasUnread).length;

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
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 80px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 4px", fontFamily: fonts.head }}>Nachrichten</h1>
            <p style={{ margin: 0, fontSize: 13, color: colors.muted }}>{totalUnread > 0 ? `${totalUnread} ungelesen` : "Alles gelesen"}</p>
          </div>
          <div style={{ display: "flex", background: colors.surface, borderRadius: 8, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            {[{ key: "all", label: "Alle" }, { key: "unread", label: `Ungelesen${totalUnread > 0 ? ` (${totalUnread})` : ""}` }].map((s) => (
              <button key={s.key} onClick={() => setFilter(s.key)} style={{
                padding: "7px 16px", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                fontFamily: fonts.body, background: filter === s.key ? colors.yellow : "transparent", color: colors.dark,
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, background: colors.borderLt, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: "45%", height: 12, borderRadius: 4, background: colors.borderLt, marginBottom: 8 }} />
                  <div style={{ width: "70%", height: 10, borderRadius: 4, background: colors.borderLt }} />
                </div>
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
              </div>
            ))}
          </div>
        )}

        {!loading && convs.length === 0 && (
          <div style={{ textAlign: "center", padding: 56, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <MessageCircle size={40} color={colors.mutedLt} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>{filter === "unread" ? "Nichts Ungelesenes" : "Keine Nachrichten"}</p>
            <p style={{ fontSize: 13, color: colors.muted, margin: "0 0 16px" }}>{filter === "unread" ? "Du bist auf dem Laufenden." : "Schreib einem Verkäufer über ein Inserat."}</p>
            {filter !== "unread" && (
              <Link href="/search" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 10, background: colors.yellow, color: colors.dark, fontSize: 14, fontWeight: 800, textDecoration: "none" }}>Marktplatz durchstöbern</Link>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {!loading && convs.map((c) => {
            const isBuyer = c.buyer_id === userId;
            return (
              <Link key={c.id} href={`/chat/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 13, padding: "12px 14px",
                  background: colors.surface,
                  borderRadius: radius.lg,
                  border: `1px solid ${c.hasUnread ? colors.teal : colors.border}`,
                  borderLeft: c.hasUnread ? `3px solid ${colors.teal}` : `1px solid ${colors.border}`,
                }}>
                  {/* Inserat-Thumbnail als Anker + Avatar-Overlay */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 10, background: colors.warm, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {c.listingImage ? <img src={c.listingImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={20} color={colors.mutedLt} />}
                    </div>
                    <div style={{ position: "absolute", bottom: -4, right: -4, width: 26, height: 26, borderRadius: "50%", background: colors.yellowSoft, border: "2px solid #fff", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {c.otherUser?.avatar_url ? <img src={c.otherUser.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={13} color={colors.yellow} />}
                    </div>
                  </div>

                  {/* Mitte */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: c.hasUnread ? 800 : 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{c.listingTitle || "Gelöschtes Inserat"}</p>
                      <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".03em", padding: "2px 7px", borderRadius: 5, background: isBuyer ? "#E6F5F5" : colors.natureSoft, color: isBuyer ? colors.tealDark : "#3F6B3E" }}>
                        {isBuyer ? <><ShoppingBag size={9} /> Kaufen</> : <><Tag size={9} /> Verkaufen</>}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: colors.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.otherUser?.display_name || "Benutzer"}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 13, color: c.hasUnread ? colors.dark : colors.muted, fontWeight: c.hasUnread ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.lastMessagePreview || "Bild gesendet"}
                    </p>
                  </div>

                  {/* Zeit + Unread */}
                  <div style={{ textAlign: "right", flexShrink: 0, minWidth: 44, alignSelf: "flex-start", paddingTop: 2 }}>
                    <span style={{ fontSize: 11, color: c.hasUnread ? colors.teal : colors.muted, fontWeight: c.hasUnread ? 700 : 400 }}>{fmtTime(c.last_message_at)}</span>
                    {c.hasUnread && <span style={{ display: "block", width: 9, height: 9, borderRadius: "50%", background: colors.teal, marginLeft: "auto", marginTop: 6 }} />}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
