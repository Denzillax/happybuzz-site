import { supabase } from "@/lib/supabase/supabase";

// Brand-Presets (Hintergrund + lesbare Textfarbe).
export const ANNOUNCEMENT_PRESETS = [
  { name: "Teal", bg: "#1D1D1D", text: "#FFFFFF" },
  { name: "Gelb", bg: "#F4C03F", text: "#1D1D1D" },
  { name: "Grün", bg: "#50804F", text: "#FFFFFF" },
  { name: "Dark", bg: "#1D1D1D", text: "#FFFFFF" },
  { name: "Rot",  bg: "#C62828", text: "#FFFFFF" },
];

export async function getAnnouncement() {
  const { data } = await supabase.from("site_announcement").select("*").eq("id", 1).maybeSingle();
  return data || null;
}

// Grosse Laufschrift (eigenes Element, Platzierung 'home' oder 'global')
export async function getTicker() {
  const { data } = await supabase.from("site_ticker").select("*").eq("id", 1).maybeSingle();
  return data || null;
}
