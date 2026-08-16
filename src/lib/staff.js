import { supabase } from "@/lib/supabase/supabase";

export const ROLE_LABELS = { support: "Support", finance: "Buchhaltung", moderation: "Moderation", manager: "Manager" };
export const ROLE_TABS = {
  support: ["overview", "users", "orders", "reports", "emails", "feedback"],
  finance: ["overview", "invoices", "dunning", "analytics"],
  moderation: ["overview", "listings", "reports", "users"],
  manager: ["overview", "analytics", "users", "orders", "invoices", "listings", "emails", "dunning", "audit", "reports", "feedback", "categories", "challenges"],
};

export async function getMyRole(userId) {
  const { data } = await supabase.from("staff_roles").select("role").eq("user_id", userId).maybeSingle();
  return data?.role || null;
}
export async function getStaffRoles() {
  const { data } = await supabase.from("staff_roles").select("user_id, role");
  return Object.fromEntries((data || []).map(r => [r.user_id, r.role]));
}
export async function setStaffRole(userId, role) {
  const { error } = await supabase.rpc("set_staff_role", { p_user_id: userId, p_role: role || "" });
  if (error) throw error;
}
