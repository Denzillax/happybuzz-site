"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, CheckCheck, ShoppingBag, Star, MessageSquare, Leaf, Gavel, Key } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/lib/notifications";
import { colors, fonts, radius } from "@/lib/theme";
import Link from "next/link";

const TYPE_ICONS = {
  purchase: ShoppingBag,
  rating: Star,
  message: MessageSquare,
  system: Bell,
  bid: Gavel,
  rental: Key,
  impact: Leaf,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [userId, setUserId] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserId(session.user.id);
      setUnread(await getUnreadCount(session.user.id));
    }
    load();

    // Echtzeit-Subscription
    const channel = supabase.channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnread(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = async () => {
    if (!open && userId) {
      const items = await getNotifications(userId);
      setNotifications(items);
    }
    setOpen(!open);
  };

  const handleMarkAll = async () => {
    if (userId) {
      await markAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    }
  };

  const handleClick = async (n) => {
    if (!n.read) {
      await markAsRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      setUnread(prev => Math.max(0, prev - 1));
    }
    setOpen(false);
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return "Gerade eben";
    if (diff < 3600) return `${Math.floor(diff / 60)} Min.`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} Std.`;
    return d.toLocaleDateString("de-CH", { day: "numeric", month: "short" });
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={handleOpen} style={{
        background: "none", border: "none", cursor: "pointer", padding: 6, position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Bell size={20} color={colors.muted} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            width: 16, height: 16, borderRadius: "50%",
            background: colors.red, color: "#fff",
            fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1,
          }}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", right: -10, marginTop: 8,
          width: 360, maxHeight: 480, background: colors.surface,
          borderRadius: radius.lg, boxShadow: "0 12px 48px rgba(0,0,0,.14)",
          border: `1px solid ${colors.line}`, overflow: "hidden", zIndex: 200,
        }}>
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 18px", borderBottom: `1px solid ${colors.line}`,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: fonts.head }}>Benachrichtigungen</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: colors.teal, fontWeight: 600, fontFamily: fonts.body,
                display: "flex", alignItems: "center", gap: 4,
              }}><CheckCheck size={14} /> Alle gelesen</button>
            )}
          </div>

          {/* Liste */}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <Bell size={32} color={colors.line} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Keine Benachrichtigungen</p>
              </div>
            ) : (
              notifications.map(n => {
                const Icon = TYPE_ICONS[n.type] || Bell;
                const content = (
                  <div key={n.id} onClick={() => handleClick(n)} style={{
                    display: "flex", gap: 12, padding: "12px 18px", cursor: "pointer",
                    background: n.read ? "transparent" : `${colors.teal}06`,
                    borderBottom: `1px solid ${colors.line}`,
                    transition: "background .1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.cloud}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : `${colors.teal}06`}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: n.read ? colors.cloud : `${colors.teal}12`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={16} color={n.read ? colors.muted : colors.teal} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: n.read ? 400 : 600, color: colors.charcoal, lineHeight: 1.3 }}>{n.title}</p>
                      {n.body && <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</p>}
                      <p style={{ margin: "4px 0 0", fontSize: 10, color: colors.muted }}>{formatTime(n.created_at)}</p>
                    </div>
                    {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors.teal, flexShrink: 0, marginTop: 4 }} />}
                  </div>
                );
                return n.link ? <Link key={n.id} href={n.link} style={{ textDecoration: "none", color: "inherit" }}>{content}</Link> : content;
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
