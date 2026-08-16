// ═══════════════════════════════════════════════════════════════
// BEEDARO Notifications System
// ═══════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabase/supabase";

// Benachrichtigung erstellen.
// In-App (Glocke) IMMER — transaktionskritische Benachrichtigungen sind per
// Projektregel nicht abschaltbar. settingsKey steuert die Kanaele E-Mail und
// Push: die RPCs queue_notification_email / queue_notification_push pruefen
// SERVERSEITIG das jeweilige Haekchen in Einstellungen -> Benachrichtigungen
// und legen bei Zustimmung einen pending-Eintrag ab (email_log / push_queue).
// Versand: Edge Function notify-worker im Minutentakt.
export async function createNotification(userId, type, title, message = null, link = null, settingsKey = null) {
  const { error } = await supabase.from("notifications").insert({ user_id: userId, type, title, message, link, is_read: false });
  if (error) console.error("Notification error:", error);

  if (settingsKey) {
    const { error: mailErr } = await supabase.rpc("queue_notification_email", {
      p_recipient: userId, p_subject: title, p_message: message, p_link: link, p_settings_key: settingsKey,
    });
    if (mailErr) console.error("queue_notification_email:", mailErr);

    const { error: pushErr } = await supabase.rpc("queue_notification_push", {
      p_recipient: userId, p_title: title, p_message: message, p_link: link, p_settings_key: settingsKey,
    });
    if (pushErr) console.error("queue_notification_push:", pushErr);
  }
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
