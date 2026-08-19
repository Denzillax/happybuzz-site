// Nutzer blockieren: Kontakt (Chat/Vorschlaege) + Kaufen/Bieten.
// Durchgesetzt wird die Sperre SERVERSEITIG (Trigger, Migration
// user_blocks_und_offer_band) — hier nur die Verwaltung der eigenen Liste.
import { supabase } from "@/lib/supabase/supabase";

export async function blockUser(blockedId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");
  const { error } = await supabase.from("user_blocks").insert({ blocker_id: user.id, blocked_id: blockedId });
  if (error && error.code !== "23505") throw error; // doppelt blockieren ist ok
}

export async function unblockUser(blockedId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");
  const { error } = await supabase.from("user_blocks").delete()
    .eq("blocker_id", user.id).eq("blocked_id", blockedId);
  if (error) throw error;
}

// Eigene Sperrliste mit Anzeigenamen (fuer Einstellungen)
export async function getMyBlocks() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("user_blocks")
    .select("blocked_id, created_at, blocked:profiles!user_blocks_blocked_id_fkey(id, display_name, avatar_url)")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });
  return data || [];
}

// Habe ICH diesen Nutzer gesperrt? (fuer den Knopf-Zustand im Chat)
export async function isBlockedByMe(otherId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !otherId) return false;
  const { data } = await supabase.from("user_blocks")
    .select("blocked_id").eq("blocker_id", user.id).eq("blocked_id", otherId).maybeSingle();
  return !!data;
}
