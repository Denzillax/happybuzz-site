"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, X, Gavel, ShoppingBag, MessageCircle, Star, CalendarDays, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts } from "@/lib/theme";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
} from "@/lib/api/notifications";

const ICONS = {
  bid: Gavel,
  purchase: ShoppingBag,
  message: MessageCircle,
  rating: Star,
  booking: CalendarDays,
  system: Bell,
  rental: CalendarDays,
};

const TIME_AGO = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Jetzt";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString("de-CH", { day: "numeric", month: "short" });
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [userId, setUserId] = useState(null);
  const ref = useRef(null);

  // Load user + notifications
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const count = await getUnreadCount();
      setUnread(count);
    }
    init();
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToNotifications(userId, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setUnread(prev => prev + 1);
    });
    return unsub;
  }, [userId]);

  // Load full list when dropdown opens
  useEffect(() => {
    if (open && userId) {
      getNotifications(20).then(setNotifications);
    }
  }, [open, userId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    }
    if (notif.link) {
      router.push(notif.link);
      setOpen(false);
    }
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const handleDelete = async (e, notifId) => {
    e.stopPropagation();
    await deleteNotification(notifId);
    const wasUnread = notifications.find(n => n.id === notifId && !n.is_read);
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    if (wasUnread) setUnread(prev => Math.max(0, prev - 1));
  };

  const handleDeleteAll = async () => {
    for (const n of notifications) {
      await deleteNotification(n.id);
    }
    setNotifications([]);
    setUnread(0);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          position: "relative", padding: 6, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Bell size={22} color={colors.dark} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            minWidth: 16, height: 16, borderRadius: 8,
            background: "#c62828", color: "#fff",
            fontSize: 10, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px", fontFamily: fonts.body,
            border: "2px solid #fff",
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 380, maxHeight: 480, background: "#fff",
          borderRadius: 12, boxShadow: "0 12px 48px rgba(0,0,0,.15)",
          border: `1px solid ${colors.border}`,
          overflow: "hidden", zIndex: 1000,
          animation: "fadeIn .15s ease",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderBottom: `1px solid ${colors.border}`,
          }}>
            <h3 style={{
              margin: 0, fontSize: 16, fontWeight: 800,
              fontFamily: fonts.body, color: colors.dark,
            }}>Benachrichtigungen</h3>
            <div style={{ display: "flex", gap: 12 }}>
              {unread > 0 && (
                <button onClick={handleMarkAll} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, color: colors.yellow,
                  fontFamily: fonts.body, display: "flex", alignItems: "center", gap: 4,
                }}>
                  <CheckCheck size={14} /> Alle gelesen
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleDeleteAll} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, color: colors.muted,
                  fontFamily: fonts.body, display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Trash2 size={14} /> Alle löschen
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", maxHeight: 400 }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: 40, textAlign: "center",
                color: colors.muted, fontSize: 13,
              }}>
                Keine Benachrichtigungen
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    display: "flex", gap: 12, padding: "12px 16px",
                    cursor: n.link ? "pointer" : "default",
                    background: n.is_read ? "transparent" : `${colors.yellow}08`,
                    borderBottom: `1px solid ${colors.border}`,
                    transition: "background .15s",
                  }}
                  onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.background = `${colors.yellow}15`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.is_read ? "transparent" : `${colors.yellow}08`; }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: n.is_read ? colors.cream : `${colors.yellow}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {(() => { const Icon = ICONS[n.type] || Bell; return <Icon size={16} color={n.is_read ? colors.muted : colors.dark} />; })()}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: n.is_read ? 500 : 700,
                      color: colors.dark, fontFamily: fonts.body,
                    }}>
                      {n.title}
                    </div>
                    {n.message && (
                      <div style={{
                        fontSize: 12, color: colors.muted,
                        marginTop: 2, lineHeight: 1.4,
                        overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {n.message}
                      </div>
                    )}
                    <div style={{
                      fontSize: 11, color: colors.muted, marginTop: 3,
                    }}>
                      {TIME_AGO(n.created_at)}
                    </div>
                  </div>

                  {/* Unread dot + Delete */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {!n.is_read && (
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: colors.yellow,
                      }} />
                    )}
                    <button onClick={(e) => handleDelete(e, n.id)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      padding: 2, color: colors.muted, opacity: 0.4,
                      transition: "opacity .15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.4}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
