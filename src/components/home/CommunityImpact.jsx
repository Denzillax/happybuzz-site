"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { getCommunityBeeImpact } from "@/lib/listings";
import { CommunityImpactCounter } from "@/components/shared/BeeLevel";

export function CommunityImpact() {
  const [total, setTotal] = useState(0);
  const [userImpact, setUserImpact] = useState(0);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    getCommunityBeeImpact().then(setTotal).catch(() => {});
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("first_name, display_name, bee_impact_total").eq("id", session.user.id).maybeSingle();
        if (profile) {
          setUserImpact(profile.bee_impact_total || 0);
          setFirstName(profile.first_name || profile.display_name || "");
        }
      }
    }
    loadUser();
  }, []);

  if (total <= 0) return null;

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "0 20px", marginTop: -50, marginBottom: 30, position: "relative", zIndex: 10 }}>
      <CommunityImpactCounter total={total} userImpact={userImpact} firstName={firstName} />
    </div>
  );
}
