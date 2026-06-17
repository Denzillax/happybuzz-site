// ═══════════════════════════════════════════════════════════════
// BEEDARO Notifications System
// ═══════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabase/supabase";

// Benachrichtigung erstellen
export async function createNotification(userId, type, title, message = null, link = null) {
  const { error } = await supabase.from("notifications").insert({ user_id: userId, type, title, message, link, is_read: false });
  if (error) console.error("Notification error:", error);
}

// Alle Benachrichtigungen laden (neueste zuerst)
export async function getNotifications(userId, limit = 20) {
  const { data } = await supabase.from("notifications")
    .select("*").eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

// Ungelesene Anzahl
export async function getUnreadCount(userId) {
  const { count } = await supabase.from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId).eq("is_read", false);
  return count || 0;
}

// Als gelesen markieren
export async function markAsRead(notificationId) {
  await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
}

// Alle als gelesen markieren
export async function markAllAsRead(userId) {
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
}
