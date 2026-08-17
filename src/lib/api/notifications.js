import { supabase } from "@/lib/supabase/supabase";

// ── Notifications lesen ──

export async function getNotifications(limit = 20) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) console.error("getNotifications:", error);
  return data || [];
}

export async function getUnreadCount() {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);
  if (error) console.error("getUnreadCount:", error);
  return count || 0;
}

// ── Notifications verwalten ──

export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  if (error) console.error("markAsRead:", error);
}

export async function markAllAsRead() {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);
  if (error) console.error("markAllAsRead:", error);
}

export async function deleteNotification(notificationId) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);
  if (error) console.error("deleteNotification:", error);
}

// ── Notification erstellen ──

export async function createNotification(userId, type, title, message, link, settingsKey) {
  if (!userId) return;

  // Check user preferences (if settingsKey provided)
  if (settingsKey) {
    try {
      const prefs = await getNotificationPreferences(userId);
      if (prefs[settingsKey]?.push === false) return; // User hat diesen Typ deaktiviert
    } catch (e) { /* preferences not set = allow all */ }
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    link,
    is_read: false,
  });
  if (error) console.error("createNotification ERROR:", error.message, error.details, error.code);
}

// ── Notification Preferences ──

export async function getNotificationPreferences(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("notification_settings")
    .eq("id", userId)
    .maybeSingle();
  if (error) console.error("getNotificationPreferences:", error);
  return data?.notification_settings || {};
}

export async function saveNotificationPreferences(userId, settings) {
  const { error } = await supabase
    .from("profiles")
    .update({ notification_settings: settings })
    .eq("id", userId);
  if (error) {
    console.error("saveNotificationPreferences:", error);
    return false;
  }
  return true;
}

// ── Realtime Subscription ──

export function subscribeToNotifications(userId, onNew) {
  // Kanalname pro Aufruf eindeutig: die Glocke ist zweimal gemountet
  // (Desktop- und Mobile-Header), ein zweites subscribe() auf denselben
  // Kanal wirft sonst "cannot add postgres_changes callbacks"
  const channel = supabase
    .channel(`notifications:${userId}:${Math.random().toString(36).slice(2, 10)}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNew(payload.new);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
