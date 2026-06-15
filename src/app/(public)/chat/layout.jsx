"use client";
// Zwei-Pane-Chat-Shell: links die Gesprächsliste (Sidebar), rechts der aktive
// Thread ({children} = /chat oder /chat/[id]). Desktop = beide Spalten,
// Mobile = eine Spalte (Liste ODER Thread, je nach Route).
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/supabase";
import { getMyConversations } from "@/lib/listings";
import Link from "next/link";
import { MessageCircle, User, Package, ShoppingBag, Tag } from "lucide-react";
import { colors, fonts } from "@/lib/theme";

export default function ChatLayout({ children }) {
  const pathname = usePathname();
  const activeId = pathname?.startsWith("/chat/") ? pathname.split("/")[2] : null;
  const onThread = !!activeId;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [filter, setFilter] = useState("all");

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

  // Liste aktualisieren bei Threadwechsel + wenn Nachrichten gelesen markiert wurden
  useEffect(() => {
    if (!userId) return;
    getMyConversations(userId).then(setConversations).catch(() => {});
  }, [pathname, userId]);
  useEffect(() => {
    const onRead = () => { if (userId) getMyConversations(userId).then(setConversations).catch(() => {}); };
    window.addEventListener("beedaro:messages-read", onRead);
    return () => window.removeEventListener("beedaro:messages-read", onRead);
  }, [userId]);

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
    <div className="chat-shell" style={{ display: "flex", background: colors.surface, height: "calc(100dvh - 64px)", overflow: "hidden", fontFamily: fonts.body, color: colors.dark, maxWidth: 1100, margin: "0 auto", borderLeft: `1px solid ${colors.borderLt}`, borderRight: `1px solid ${colors.borderLt}` }}>

      {/* ── Sidebar: Gesprächsliste ── */}
      <aside className={`chat-sidebar${onThread ? " is-hidden-mobile" : ""}`} style={{ width: 340, flexShrink: 0, borderRight: `1px solid ${colors.borderLt}`, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${colors.borderLt}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, fontFamily: fonts.head }}>Nachrichten</h1>
            <div style={{ display: "flex", background: colors.cream, borderRadius: 999, padding: 2 }}>
              {[{ key: "all", label: "Alle" }, { key: "unread", label: "Ungelesen" }].map((s) => (
                <button key={s.key} onClick={() => setFilter(s.key)} style={{
                  padding: "5px 12px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", borderRadius: 999,
                  fontFamily: fonts.body, background: filter === s.key ? colors.yellow : "transparent", color: colors.dark,
                }}>{s.label}</button>
              ))}
            </div>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: colors.muted }}>{totalUnread > 0 ? `${totalUnread} ungelesen` : "Alles gelesen"}</p>
        </div>

        <div className="chat-scroll" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {loading && <div style={{ padding: 20, color: colors.muted, fontSize: 13 }}>Lädt…</div>}

          {!loading && convs.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: colors.muted }}>
              <MessageCircle size={32} color={colors.mutedLt} style={{ marginBottom: 6 }} />
              <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: colors.dark }}>{filter === "unread" ? "Nichts Ungelesenes" : "Keine Nachrichten"}</p>
              <p style={{ fontSize: 12, margin: 0 }}>{filter === "unread" ? "Du bist auf dem Laufenden." : "Schreib einem Verkäufer über ein Inserat."}</p>
            </div>
          )}

          {!loading && convs.map((c) => {
            const isBuyer = c.buyer_id === userId;
            const active = c.id === activeId;
            return (
              <Link key={c.id} href={`/chat/${c.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                  background: active ? "#E6F5F5" : "transparent",
                  borderLeft: `3px solid ${active ? colors.teal : "transparent"}`,
                  borderBottom: `1px solid ${colors.cream}`,
                }}>
                  {/* Inserat-Thumbnail + Avatar-Overlay */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: colors.warm, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {c.listingImage ? <img src={c.listingImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={18} color={colors.mutedLt} />}
                    </div>
                    <div style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: colors.yellowSoft, border: "2px solid #fff", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {c.otherUser?.avatar_url ? <img src={c.otherUser.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={12} color={colors.yellow} />}
                    </div>
                  </div>

                  {/* Mitte */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: c.hasUnread ? 800 : 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{c.listingTitle || "Gelöschtes Inserat"}</p>
                      <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".03em", padding: "1px 6px", borderRadius: 999, background: isBuyer ? "#E6F5F5" : colors.natureSoft, color: isBuyer ? colors.tealDark : "#3F6B3E" }}>
                        {isBuyer ? <><ShoppingBag size={9} /> Kaufen</> : <><Tag size={9} /> Verkaufen</>}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: colors.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.otherUser?.display_name || "Benutzer"}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, color: c.hasUnread ? colors.dark : colors.muted, fontWeight: c.hasUnread ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.lastMessagePreview || "Bild gesendet"}</p>
                  </div>

                  {/* Zeit + Unread */}
                  <div style={{ textAlign: "right", flexShrink: 0, alignSelf: "flex-start", paddingTop: 2 }}>
                    <span style={{ fontSize: 10, color: c.hasUnread ? colors.teal : colors.muted, fontWeight: c.hasUnread ? 700 : 400 }}>{fmtTime(c.last_message_at)}</span>
                    {c.hasUnread && <span style={{ display: "block", width: 9, height: 9, borderRadius: "50%", background: colors.teal, marginLeft: "auto", marginTop: 6 }} />}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* ── Rechts: aktiver Thread / Platzhalter ── */}
      <main className={`chat-main${onThread ? "" : " is-hidden-mobile"}`} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}
