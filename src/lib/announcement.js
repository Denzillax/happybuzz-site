import { supabase } from "@/lib/supabase/supabase";

// Brand-Presets (Hintergrund + lesbare Textfarbe).
export const ANNOUNCEMENT_PRESETS = [
  { name: "Teal", bg: "#0E9493", text: "#FFFFFF" },
  { name: "Gelb", bg: "#F4C03F", text: "#191615" },
  { name: "Grün", bg: "#5B8C5A", text: "#FFFFFF" },
  { name: "Dark", bg: "#191615", text: "#FFFFFF" },
  { name: "Rot",  bg: "#EB5E55", text: "#FFFFFF" },
];

export async function getAnnouncement() {
  const { data } = await supabase.from("site_announcement").select("*").eq("id", 1).maybeSingle();
  return data || null;
}
