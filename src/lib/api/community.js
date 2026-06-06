import { supabase } from "@/lib/supabase/supabase";


export async function getCommunityBeeImpact() {
  const { data, error } = await supabase.rpc("get_community_bee_impact");
  if (error) return 0;
  return data || 0;
}
